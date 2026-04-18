/**
 * Rate limiter with Upstash Redis for production, in-memory fallback for dev.
 *
 * In production (UPSTASH_REDIS_REST_URL + _TOKEN set), uses a global sliding-window
 * limiter shared across all serverless instances.
 *
 * In dev (or if Upstash env vars are missing), falls back to per-instance
 * in-memory limiting. Good enough for local testing, insufficient for scale.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ── Upstash client (lazy-initialized) ────────────────────────────────────────
let redisClient: Redis | null = null;
let redisChecked = false;

function getRedis(): Redis | null {
  if (redisChecked) return redisClient;
  redisChecked = true;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  try {
    redisClient = new Redis({ url, token });
  } catch (err) {
    console.error('[rate-limit] Failed to init Upstash, falling back:', err);
    redisClient = null;
  }
  return redisClient;
}

// Cache limiter instances by (limit, windowMs) to avoid re-creating per request
const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const redis = getRedis();
  if (!redis) return null;

  const cacheKey = `${limit}:${windowMs}`;
  let limiter = limiterCache.get(cacheKey);
  if (!limiter) {
    // Upstash sliding window expects a Duration string like "60 s"
    const windowSec = Math.max(1, Math.round(windowMs / 1000));
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      analytics: false,
      prefix: 'vi_rl',
    });
    limiterCache.set(cacheKey, limiter);
  }
  return limiter;
}

// ── In-memory fallback ───────────────────────────────────────────────────────
interface MemEntry { timestamps: number[]; }
const memStore = new Map<string, MemEntry>();
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function memCleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  memStore.forEach((entry, key) => {
    entry.timestamps = entry.timestamps.filter((t: number) => t > cutoff);
    if (entry.timestamps.length === 0) memStore.delete(key);
  });
}

function memRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;
  memCleanup(windowMs);

  let entry = memStore.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    memStore.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter(t => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: limit - entry.timestamps.length };
}

// ── Public API ───────────────────────────────────────────────────────────────

interface RateLimitOptions {
  /** Max requests per window (default: 30) */
  limit?: number;
  /** Window size in ms (default: 60_000 = 1 minute) */
  windowMs?: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Retry-After in seconds (only set when blocked) */
  retryAfter?: number;
}

export async function rateLimit(
  key: string,
  opts: RateLimitOptions = {},
): Promise<RateLimitResult> {
  const { limit = 30, windowMs = 60_000 } = opts;

  // Try Upstash first
  const upstashLimiter = getUpstashLimiter(limit, windowMs);
  if (upstashLimiter) {
    try {
      const result = await upstashLimiter.limit(key);
      const retryAfter = result.success
        ? undefined
        : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
      return {
        allowed: result.success,
        remaining: Math.max(0, result.remaining),
        retryAfter,
      };
    } catch (err) {
      // Redis failure — degrade to in-memory rather than failing requests
      console.error('[rate-limit] Upstash failure, falling back to memory:', err);
    }
  }

  return memRateLimit(key, limit, windowMs);
}

/** Extract a usable IP from the request for rate-limit keying */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    '0.0.0.0'
  );
}

/** Returns a 429 Response if rate limit exceeded, or null if allowed. */
export async function checkRateLimit(
  request: Request,
  route: string,
  opts: RateLimitOptions = {},
): Promise<Response | null> {
  const ip = getClientIp(request);
  const result = await rateLimit(`${route}:${ip}`, opts);

  if (!result.allowed) {
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please try again later.' }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(result.retryAfter ?? 60),
          'X-RateLimit-Limit': String(opts.limit ?? 30),
          'X-RateLimit-Remaining': '0',
        },
      },
    );
  }

  return null;
}

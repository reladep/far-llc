/**
 * In-memory sliding-window rate limiter.
 * No external dependencies — works on Vercel serverless (per-instance).
 * For stricter global limiting, swap to Upstash Redis in production.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Evict stale entries every 5 minutes to prevent memory growth
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  store.forEach((entry, key) => {
    entry.timestamps = entry.timestamps.filter((t: number) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  });
}

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

export function rateLimit(
  key: string,
  opts: RateLimitOptions = {},
): RateLimitResult {
  const { limit = 30, windowMs = 60_000 } = opts;
  const now = Date.now();
  const cutoff = now - windowMs;

  cleanup(windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Drop timestamps outside the window
  entry.timestamps = entry.timestamps.filter(t => t > cutoff);

  if (entry.timestamps.length >= limit) {
    const oldest = entry.timestamps[0];
    const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.timestamps.push(now);
  return { allowed: true, remaining: limit - entry.timestamps.length };
}

/** Extract a usable IP from the request for rate-limit keying */
export function getClientIp(request: Request): string {
  const headers = request.headers;
  // Vercel / Cloudflare forwarded headers
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    '0.0.0.0'
  );
}

/** Helper: returns a 429 Response if rate limit exceeded, or null if allowed */
export function checkRateLimit(
  request: Request,
  route: string,
  opts: RateLimitOptions = {},
): Response | null {
  const ip = getClientIp(request);
  const result = rateLimit(`${route}:${ip}`, opts);

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

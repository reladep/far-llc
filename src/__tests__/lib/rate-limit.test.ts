import { describe, it, expect, beforeEach, vi } from 'vitest';

// Ensure no Upstash credentials leak from the test env
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

// Reset module state between tests so the in-memory store starts fresh
async function importFresh() {
  vi.resetModules();
  return await import('@/lib/rate-limit');
}

function makeRequest(ip: string) {
  return new Request('http://localhost/test', {
    headers: { 'x-forwarded-for': ip },
  });
}

describe('rate-limit (in-memory fallback)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('allows requests within the limit', async () => {
    const { rateLimit } = await importFresh();
    const result = await rateLimit('test:a', { limit: 5, windowMs: 1000 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it('blocks requests beyond the limit', async () => {
    const { rateLimit } = await importFresh();
    for (let i = 0; i < 3; i++) {
      await rateLimit('test:b', { limit: 3, windowMs: 1000 });
    }
    const blocked = await rateLimit('test:b', { limit: 3, windowMs: 1000 });
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfter).toBeGreaterThan(0);
  });

  it('tracks separate keys independently', async () => {
    const { rateLimit } = await importFresh();
    for (let i = 0; i < 3; i++) {
      await rateLimit('test:c', { limit: 3, windowMs: 1000 });
    }
    // Key 'c' is now exhausted, but 'd' should still be fresh
    const cBlocked = await rateLimit('test:c', { limit: 3, windowMs: 1000 });
    const dAllowed = await rateLimit('test:d', { limit: 3, windowMs: 1000 });
    expect(cBlocked.allowed).toBe(false);
    expect(dAllowed.allowed).toBe(true);
  });

  it('uses default limit (30) when none provided', async () => {
    const { rateLimit } = await importFresh();
    const result = await rateLimit('test:default');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(29);
  });
});

describe('getClientIp', () => {
  it('prefers x-forwarded-for first hop', async () => {
    const { getClientIp } = await importFresh();
    const req = new Request('http://localhost/', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip', async () => {
    const { getClientIp } = await importFresh();
    const req = new Request('http://localhost/', {
      headers: { 'x-real-ip': '9.10.11.12' },
    });
    expect(getClientIp(req)).toBe('9.10.11.12');
  });

  it('falls back to cf-connecting-ip', async () => {
    const { getClientIp } = await importFresh();
    const req = new Request('http://localhost/', {
      headers: { 'cf-connecting-ip': '13.14.15.16' },
    });
    expect(getClientIp(req)).toBe('13.14.15.16');
  });

  it('returns 0.0.0.0 when no header present', async () => {
    const { getClientIp } = await importFresh();
    const req = new Request('http://localhost/');
    expect(getClientIp(req)).toBe('0.0.0.0');
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns null when allowed', async () => {
    const { checkRateLimit } = await importFresh();
    const req = makeRequest('192.0.2.1');
    const result = await checkRateLimit(req, '/test-route', { limit: 3, windowMs: 1000 });
    expect(result).toBeNull();
  });

  it('returns 429 Response when blocked', async () => {
    const { checkRateLimit } = await importFresh();
    const req = makeRequest('192.0.2.2');
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(req, '/test-route-blocked', { limit: 3, windowMs: 1000 });
    }
    const result = await checkRateLimit(req, '/test-route-blocked', { limit: 3, windowMs: 1000 });
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
    expect(result!.headers.get('Retry-After')).toBeTruthy();
    expect(result!.headers.get('X-RateLimit-Limit')).toBe('3');
  });

  it('different IPs on same route are limited independently', async () => {
    const { checkRateLimit } = await importFresh();
    const reqA = makeRequest('10.0.0.1');
    const reqB = makeRequest('10.0.0.2');

    // Exhaust A's limit
    for (let i = 0; i < 3; i++) {
      await checkRateLimit(reqA, '/iso', { limit: 3, windowMs: 1000 });
    }
    const aBlocked = await checkRateLimit(reqA, '/iso', { limit: 3, windowMs: 1000 });
    const bAllowed = await checkRateLimit(reqB, '/iso', { limit: 3, windowMs: 1000 });

    expect(aBlocked?.status).toBe(429);
    expect(bAllowed).toBeNull();
  });

  it('same IP on different routes are limited independently', async () => {
    const { checkRateLimit } = await importFresh();
    const req = makeRequest('172.16.0.1');

    for (let i = 0; i < 3; i++) {
      await checkRateLimit(req, '/route-a', { limit: 3, windowMs: 1000 });
    }
    const aBlocked = await checkRateLimit(req, '/route-a', { limit: 3, windowMs: 1000 });
    const bAllowed = await checkRateLimit(req, '/route-b', { limit: 3, windowMs: 1000 });

    expect(aBlocked?.status).toBe(429);
    expect(bAllowed).toBeNull();
  });
});

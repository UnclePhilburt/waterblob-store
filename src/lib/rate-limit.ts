interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimiterConfig {
  windowMs: number;
  max: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

/** Create a named rate limiter backed by an in-memory Map */
export function createRateLimiter(name: string, config: RateLimiterConfig) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }
  const store = stores.get(name)!;

  return {
    /** Returns true if the request is allowed, false if rate-limited */
    check(ip: string): { allowed: boolean; remaining: number; resetAt: number } {
      const now = Date.now();
      const entry = store.get(ip);

      if (!entry || entry.resetAt <= now) {
        store.set(ip, { count: 1, resetAt: now + config.windowMs });
        return { allowed: true, remaining: config.max - 1, resetAt: now + config.windowMs };
      }

      entry.count++;
      if (entry.count > config.max) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      return {
        allowed: true,
        remaining: config.max - entry.count,
        resetAt: entry.resetAt,
      };
    },
  };
}

/** Pre-configured limiters matching the Express setup */
export const generalLimiter = createRateLimiter('general', {
  windowMs: 15 * 60 * 1000,
  max: 300,
});

export const trackingLimiter = createRateLimiter('tracking', {
  windowMs: 15 * 60 * 1000,
  max: 1000,
});

export const authLimiter = createRateLimiter('auth', {
  windowMs: 15 * 60 * 1000,
  max: 10,
});

export const orderLimiter = createRateLimiter('order', {
  windowMs: 60 * 60 * 1000,
  max: 20,
});

/** Helper to get client IP from Next.js request */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return '127.0.0.1';
}

/** Apply rate limiting and return error response if limited, or null if allowed */
export function applyRateLimit(
  request: Request,
  limiter: ReturnType<typeof createRateLimiter>
) {
  const ip = getClientIp(request);
  const result = limiter.check(ip);

  if (!result.allowed) {
    return Response.json(
      { error: 'Too many requests, please try again later' },
      {
        status: 429,
        headers: {
          'Retry-After': String(
            Math.ceil((result.resetAt - Date.now()) / 1000)
          ),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        },
      }
    );
  }

  return null;
}

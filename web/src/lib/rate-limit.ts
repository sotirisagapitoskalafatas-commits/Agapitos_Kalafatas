/**
 * Lightweight fixed-window rate limiter for unauthenticated POST routes.
 *
 * Storage is a per-instance in-memory Map. On Vercel's serverless runtime each
 * lambda instance has its own memory, so this is a *best-effort* throttle that
 * blunts naive floods from a single source hitting one warm instance — not a
 * distributed guarantee. For hard limits across instances, move the store to
 * Upstash Redis / Vercel KV (same interface: swap `hit()` for an atomic INCR
 * with EXPIRE). This is deliberately dependency-free so it ships today.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Opportunistic cleanup so the Map doesn't grow unbounded on a long-lived instance.
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  store.forEach((b, key) => {
    if (b.resetAt <= now) store.delete(key);
  });
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
}

/**
 * @param key       Unique caller key (usually IP + route).
 * @param limit     Max requests allowed per window.
 * @param windowMs  Window length in milliseconds.
 */
export function hit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: existing.resetAt,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
    retryAfterSeconds: 0,
  };
}

/**
 * Best-effort client IP from standard proxy headers (Vercel sets x-forwarded-for).
 */
export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/**
 * Convenience: apply a limit keyed by IP+route. Returns null when allowed,
 * or a ready-to-return 429 Response when the caller is over the limit.
 */
export function rateLimit(
  req: Request,
  route: string,
  limit: number,
  windowMs: number
): Response | null {
  const result = hit(`${clientIp(req)}:${route}`, limit, windowMs);
  if (result.ok) return null;
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again shortly." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(result.retryAfterSeconds),
      },
    }
  );
}

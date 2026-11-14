interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipStore = new Map<string, RateLimitRecord>();

export const DEFAULT_IP_MAX_REQUESTS = 10;
export const DEFAULT_IP_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Checks and increments rate limit for a given IP address.
 */
export function checkIpRateLimit(
  ip: string,
  maxRequests: number = DEFAULT_IP_MAX_REQUESTS,
  windowMs: number = DEFAULT_IP_WINDOW_MS
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const cleanIp = (ip || "127.0.0.1").trim();
  const record = ipStore.get(cleanIp);

  if (!record || now >= record.resetAt) {
    const resetAt = now + windowMs;
    ipStore.set(cleanIp, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (record.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true, remaining: maxRequests - record.count, resetAt: record.resetAt };
}

/**
 * Extracts client IP from standard proxy headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const firstIp = forwarded.split(",")[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

/**
 * Clears in-memory store for testing.
 */
export function resetIpRateLimits(): void {
  ipStore.clear();
}

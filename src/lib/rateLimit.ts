/**
 * 简易内存限流（单实例，保护上游 QPS）
 * 上游已将 QPS 提升至 100；搜索类按 60/秒软限流，留出余量。
 */

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs = 1000
): { ok: boolean; retryAfterMs: number } {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfterMs: 0 };
  }
  if (b.count >= limit) {
    return { ok: false, retryAfterMs: b.resetAt - now };
  }
  b.count += 1;
  return { ok: true, retryAfterMs: 0 };
}

export const LIMITS = {
  search: (ip: string) => rateLimit("search:" + ip, 60),
  order: (ip: string) => rateLimit("order:" + ip, 5, 1000),
} as const;

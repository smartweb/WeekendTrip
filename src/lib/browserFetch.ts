/**
 * 前端 fetch 封装：调用 BFF 路由（前端永远不接触 token）
 */

export async function api<T = unknown>(
  path: string,
  init?: { method?: "GET" | "POST"; body?: unknown }
): Promise<{ ok: true; data: T } | { ok: false; error: string; authRelated?: boolean }> {
  try {
    const res = await fetch(path, {
      method: init?.method ?? "GET",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
    });
    const json = await res.json();
    if (json.ok) return { ok: true, data: json.data };
    return { ok: false, error: json.error ?? "请求失败", authRelated: json.authRelated };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "网络错误" };
  }
}

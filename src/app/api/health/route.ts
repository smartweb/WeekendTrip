import { NextResponse } from "next/server";
import { listCityAirports } from "@/lib/lx/flight";
import { lxConfig } from "@/lib/lx/client";

export const dynamic = "force-dynamic";

/** 就绪自检：环境变量、token、上游连通性 */
export async function GET() {
  let upstream = "unknown";
  let upstreamError: string | undefined;
  if (lxConfig.hasToken) {
    try {
      await listCityAirports("北京");
      upstream = "ok";
    } catch (e) {
      upstream = "error";
      upstreamError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({
    ok: true,
    service: "weekend-family-trip",
    lx: { base: lxConfig.BASE, hasToken: lxConfig.hasToken },
    upstream,
    upstreamError,
    hint: !lxConfig.hasToken
      ? "未配置 LX_API_TOKEN，请编辑 .env.local。"
      : upstream === "error" && upstreamError
      ? `上游不可用：${upstreamError}（请确认运行机公网出口 IP 已加入白名单）`
      : "Token 已配置，上游连通正常。",
  });
}

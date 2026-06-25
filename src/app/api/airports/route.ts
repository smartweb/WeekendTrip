import { NextRequest, NextResponse } from "next/server";
import { listCityAirports } from "@/lib/lx/flight";
import { LxApiError } from "@/lib/lx/client";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const city = req.nextUrl.searchParams.get("city") ?? "";
  if (!city) {
    return NextResponse.json({ ok: false, error: "缺少参数：city" }, { status: 400 });
  }
  try {
    const data = await listCityAirports(city);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const err = e as LxApiError;
    return NextResponse.json(
      { ok: false, error: err.message, authRelated: err.authRelated },
      { status: 502 }
    );
  }
}

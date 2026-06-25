import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/lx/flight";
import { LxApiError } from "@/lib/lx/client";
import type { LxFlightSearchRequest } from "@/lib/lx/types";

export const dynamic = "force-dynamic";

/** 机票搜索（真实接口） */
export async function POST(req: NextRequest) {
  let body: Partial<LxFlightSearchRequest> & { return_date?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体非 JSON" }, { status: 400 });
  }

  if (!body.from_code || !body.to_code || !body.depart_date) {
    return NextResponse.json(
      { ok: false, error: "缺少必要参数：from_code/to_code/depart_date" },
      { status: 400 }
    );
  }

  const req2: LxFlightSearchRequest = {
    trip_mode: "domestic",
    trip_type: body.return_date ? "roundtrip" : "oneway",
    from_code: body.from_code,
    to_code: body.to_code,
    cabin_class: body.cabin_class ?? "economy",
    depart_date: body.depart_date,
    return_date: body.return_date,
    passengers: {
      adult: Math.max(1, Number(body.passengers?.adult ?? 2)),
      child: Math.max(0, Number(body.passengers?.child ?? 1)),
      infant: body.passengers?.infant ?? 0,
    },
    sort_by: body.sort_by ?? "price",
    page_size: 8,
  };

  try {
    const data = await searchFlights(req2);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const err = e as LxApiError;
    return NextResponse.json(
      { ok: false, error: err.message, authRelated: err.authRelated },
      { status: 502 }
    );
  }
}

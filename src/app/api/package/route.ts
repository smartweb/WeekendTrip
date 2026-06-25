import { NextRequest, NextResponse } from "next/server";
import { searchFlights } from "@/lib/lx/flight";
import { searchHotels } from "@/lib/lx/hotel";
import { buildPackages, calcNights, budgetToBand } from "@/lib/package";
import { LIMITS } from "@/lib/rateLimit";
import { LxApiError } from "@/lib/lx/client";
import type { LxFlightSearchRequest, LxHotelSearchRequest } from "@/lib/lx/types";

export const dynamic = "force-dynamic";

/**
 * 套餐聚合：并发拉取机票 + 酒店，服务端拼装成「亲子套餐卡」。
 * 入参：from(出发城市三字码), toAirport(到达城市三字码), destination(酒店目的地关键字),
 *       checkIn, checkOut, adults(默认2), children(默认1)
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = LIMITS.search(ip);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "操作太频繁，请稍后再试" }, { status: 429 });
  }

  let body: {
    from?: string;
    toAirport?: string;
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    adults?: number;
    children?: number;
    hotelMaxPerNight?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体非 JSON" }, { status: 400 });
  }

  if (!body.from || !body.toAirport || !body.destination || !body.checkIn || !body.checkOut) {
    return NextResponse.json(
      { ok: false, error: "缺少必要参数：from/toAirport/destination/checkIn/checkOut" },
      { status: 400 }
    );
  }

  const adults = Math.max(1, Number(body.adults ?? 2));
  const children = Math.max(0, Number(body.children ?? 1));
  const nights = calcNights(body.checkIn, body.checkOut);
  // 预算是一个目标价位中心（如 1000 → 500-1500），而不是简单上限
  const band = budgetToBand(Number(body.hotelMaxPerNight ?? 0));

  const flightReq: LxFlightSearchRequest = {
    trip_mode: "domestic",
    trip_type: "roundtrip",
    from_code: body.from,
    to_code: body.toAirport,
    cabin_class: "economy",
    depart_date: body.checkIn,
    return_date: body.checkOut,
    passengers: { adult: adults, child: children },
    sort_by: "price",
    page_size: 5,
  };
  const hotelReq: LxHotelSearchRequest = {
    destination: body.destination,
    check_in: body.checkIn,
    check_out: body.checkOut,
    adult_count: adults,
    room_count: 1,
    scene: "family",
    sort_by: "rating",
    filters: {
      has_child_facility: true,
      min_review_score: 4,
      ...(band ?? {}),
    },
    page_size: 6,
  };

  try {
    const [flight, hotel] = await Promise.all([searchFlights(flightReq), searchHotels(hotelReq)]);
    const packages = buildPackages({
      destinationId: body.destination,
      flight,
      hotel,
      adults,
      children,
      nights,
    });
    return NextResponse.json({
      ok: true,
      data: { packages, meta: { adults, children, nights, checkIn: body.checkIn, checkOut: body.checkOut } },
    });
  } catch (e) {
    const err = e as LxApiError;
    return NextResponse.json(
      { ok: false, error: err.message, authRelated: err.authRelated },
      { status: 502 }
    );
  }
}

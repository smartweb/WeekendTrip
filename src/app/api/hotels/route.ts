import { NextRequest, NextResponse } from "next/server";
import { searchHotels } from "@/lib/lx/hotel";
import { LxApiError } from "@/lib/lx/client";
import type { LxHotelSearchRequest } from "@/lib/lx/types";

export const dynamic = "force-dynamic";

/** 酒店搜索（真实接口，强制 scene=family） */
export async function POST(req: NextRequest) {
  let body: Partial<LxHotelSearchRequest>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体非 JSON" }, { status: 400 });
  }

  if (!body.destination || !body.check_in || !body.check_out) {
    return NextResponse.json(
      { ok: false, error: "缺少必要参数：destination/check_in/check_out" },
      { status: 400 }
    );
  }

  const req2: LxHotelSearchRequest = {
    destination: body.destination,
    check_in: body.check_in,
    check_out: body.check_out,
    adult_count: body.adult_count ?? 2,
    room_count: body.room_count ?? 1,
    scene: "family",
    sort_by: body.sort_by ?? "best",
    filters: {
      has_child_facility: body.filters?.has_child_facility ?? true,
      has_swimming_pool: body.filters?.has_swimming_pool,
      min_review_score: body.filters?.min_review_score,
      star_levels: body.filters?.star_levels,
      min_price: body.filters?.min_price,
      max_price: body.filters?.max_price,
    },
    page: 1,
    page_size: 10,
  };

  try {
    const data = await searchHotels(req2);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const err = e as LxApiError;
    return NextResponse.json(
      { ok: false, error: err.message, authRelated: err.authRelated },
      { status: 502 }
    );
  }
}

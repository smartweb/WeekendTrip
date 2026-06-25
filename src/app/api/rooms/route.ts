import { NextRequest, NextResponse } from "next/server";
import { getHotelRooms } from "@/lib/lx/hotel";
import { LxApiError } from "@/lib/lx/client";

export const dynamic = "force-dynamic";

/** 酒店房型/产品详情：使用搜索返回的 search_offer_id */
export async function POST(req: NextRequest) {
  let body: { search_offer_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体非 JSON" }, { status: 400 });
  }

  if (!body.search_offer_id) {
    return NextResponse.json(
      { ok: false, error: "缺少必要参数：search_offer_id" },
      { status: 400 }
    );
  }

  try {
    const data = await getHotelRooms(body.search_offer_id);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const err = e as LxApiError;
    return NextResponse.json(
      { ok: false, error: err.message, authRelated: err.authRelated },
      { status: 502 }
    );
  }
}

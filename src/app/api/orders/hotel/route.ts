import { NextRequest, NextResponse } from "next/server";
import { createHotelOrder } from "@/lib/lx/hotel";
import { LxApiError } from "@/lib/lx/client";
import { LIMITS } from "@/lib/rateLimit";
import type {
  LxContactInput,
  LxGuestInput,
} from "../types";
import type { LxHotelOrderCreateRequest } from "@/lib/lx/types";

export const dynamic = "force-dynamic";

/**
 * 创建酒店订单 —— 真实下单（rdak_live 会产生真实订单与扣费）
 * 入参：offer_id(产品级，来自 room_types[].products[].offer_id) / contact / guests
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const rl = LIMITS.order(ip);
  if (!rl.ok) {
    return NextResponse.json({ ok: false, error: "下单太频繁，请稍后再试" }, { status: 429 });
  }

  let body: {
    out_trade_no?: string;
    offer_id?: string;
    contact?: LxContactInput;
    guests?: LxGuestInput[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体非 JSON" }, { status: 400 });
  }

  if (!body.offer_id || !body.contact?.name || !body.contact?.phone || !body.guests?.length) {
    return NextResponse.json(
      { ok: false, error: "缺少必要参数：offer_id/contact/guests" },
      { status: 400 }
    );
  }

  const req2: LxHotelOrderCreateRequest = {
    out_trade_no: body.out_trade_no || `WXF_H_${Date.now()}`,
    offer_id: body.offer_id,
    contact: body.contact,
    guests: body.guests.map((g) => ({
      name: g.name,
      name_en: g.name_en,
      id_type: (g.id_type as LxHotelOrderCreateRequest["guests"][number]["id_type"]) ?? "ID_CARD",
      id_number: g.id_number,
    })),
    pay_mode: "user_pay",
    return_url: `${req.nextUrl.origin}/orders`,
  };

  try {
    const data = await createHotelOrder(req2);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const err = e as LxApiError;
    return NextResponse.json(
      { ok: false, error: err.message, authRelated: err.authRelated },
      { status: 502 }
    );
  }
}

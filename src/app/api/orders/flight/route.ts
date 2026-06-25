import { NextRequest, NextResponse } from "next/server";
import { createFlightOrder } from "@/lib/lx/flight";
import { LxApiError } from "@/lib/lx/client";
import { LIMITS } from "@/lib/rateLimit";
import type {
  LxFlightOrderCreateRequest,
} from "@/lib/lx/types";
import type {
  LxIdTypeAlias,
  LxPassengerInfoInput,
  LxContactInput,
} from "../types";

export const dynamic = "force-dynamic";

/**
 * 创建机票订单 —— 真实下单（rdak_live 会产生真实订单与扣费）
 * 入参：out_trade_no / offer_id / return_offer_id / contact / passengers
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
    return_offer_id?: string;
    contact?: LxContactInput;
    passengers?: LxPassengerInfoInput[];
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "请求体非 JSON" }, { status: 400 });
  }

  if (!body.offer_id || !body.contact?.name || !body.contact?.phone || !body.passengers?.length) {
    return NextResponse.json(
      { ok: false, error: "缺少必要参数：offer_id/contact/passengers" },
      { status: 400 }
    );
  }

  // 校验乘客
  for (const p of body.passengers) {
    if (!p.name || !p.id_number || !p.id_type || !p.phone) {
      return NextResponse.json(
        { ok: false, error: `乘客 ${p.name || "未命名"} 信息不全：姓名/证件号/证件类型/手机号必填` },
        { status: 400 }
      );
    }
    if (p.type === "child" && !p.birthday) {
      return NextResponse.json({ ok: false, error: "儿童乘客需填写出生日期" }, { status: 400 });
    }
  }

  const req2: LxFlightOrderCreateRequest = {
    out_trade_no: body.out_trade_no || `WXF_F_${Date.now()}`,
    offer_id: body.offer_id,
    return_offer_id: body.return_offer_id || undefined,
    contact: body.contact,
    passengers: body.passengers.map((p) => ({
      name: p.name,
      name_en: p.name_en,
      phone: p.phone,
      type: p.type,
      id_type: p.id_type as LxIdTypeAlias,
      id_number: p.id_number,
      birthday: p.birthday,
      gender: p.gender,
    })),
    pay_mode: "user_pay",
    return_url: `${req.nextUrl.origin}/orders`,
  };

  try {
    const data = await createFlightOrder(req2);
    return NextResponse.json({ ok: true, data });
  } catch (e) {
    const err = e as LxApiError;
    return NextResponse.json(
      { ok: false, error: err.message, authRelated: err.authRelated },
      { status: 502 }
    );
  }
}

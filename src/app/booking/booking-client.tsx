"use client";

import { useMemo, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { ErrorBanner } from "@/components/ui";
import { api } from "@/lib/browserFetch";
import { addTrip, genTripId, type StoredTrip } from "@/lib/orders";

interface Pax {
  type: "adult" | "child";
  name: string;
  id_type: "ID_CARD" | "PASSPORT";
  id_number: string;
  birthday?: string;
  phone: string;
}

interface OrderResult {
  platform_order_id?: string;
  out_trade_no?: string;
  total_amount?: number;
  checkout_url?: string;
  status?: string;
}

function fmt(ymd: string) {
  const d = new Date(ymd + "T00:00:00");
  if (Number.isNaN(d.getTime())) return ymd;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function BookingClient({
  sp,
}: {
  sp: {
    from?: string;
    toAirport?: string;
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    nights?: string;
    adults?: string;
    children?: string;
    departOffer?: string;
    returnOffer?: string;
    hotelId?: string;
    hotelName?: string;
    hotelOffer?: string;
    roomName?: string;
    destName?: string;
    originName?: string;
  };
}) {
  const adults = Number(sp.adults ?? 2);
  const children = Number(sp.children ?? 1);

  const [paxes, setPaxes] = useState<Pax[]>(() => {
    const arr: Pax[] = [];
    for (let i = 0; i < adults; i++)
      arr.push({ type: "adult", name: "", id_type: "ID_CARD", id_number: "", phone: "" });
    for (let i = 0; i < children; i++)
      arr.push({ type: "child", name: "", id_type: "ID_CARD", id_number: "", birthday: "", phone: "" });
    return arr;
  });
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ flight?: OrderResult; hotel?: OrderResult } | null>(null);

  const summary = useMemo(
    () => `${sp.originName} ⇄ ${sp.destName} · ${fmt(sp.checkIn ?? "")}-${fmt(sp.checkOut ?? "")} · 住${sp.nights ?? 2}晚`,
    [sp]
  );

  const paxValid = paxes.every(
    (p) =>
      p.name.trim() &&
      p.id_number.trim() &&
      p.phone.trim() &&
      (p.type === "adult" || p.birthday?.trim())
  );
  const valid = paxValid && contactName.trim() && contactPhone.trim();

  async function submit() {
    if (!valid || submitting) return;
    setError(null);
    setSubmitting(true);

    const passengers = paxes.map((p) => ({
      name: p.name.trim(),
      phone: p.phone.trim(),
      type: p.type,
      id_type: p.id_type,
      id_number: p.id_number.trim(),
      birthday: p.birthday?.trim() || undefined,
    }));
    const guests = paxes.map((p) => ({ name: p.name.trim(), id_type: p.id_type, id_number: p.id_number.trim() }));
    const contact = { name: contactName.trim(), phone: contactPhone.trim() };
    const ts = Date.now();

    const flightReq = sp.departOffer
      ? api<OrderResult>("/api/orders/flight", {
          method: "POST",
          body: {
            out_trade_no: `WXF_F_${ts}`,
            offer_id: sp.departOffer,
            return_offer_id: sp.returnOffer || undefined,
            contact,
            passengers,
          },
        })
      : (Promise.resolve({ ok: false, error: "未选择航班" }) as Promise<{ ok: false; error: string }>);

    const hotelReq =
      sp.hotelId && sp.hotelOffer
        ? api<OrderResult>("/api/orders/hotel", {
            method: "POST",
            body: {
              out_trade_no: `WXF_H_${ts}`,
              offer_id: sp.hotelOffer,
              contact,
              guests,
            },
          })
        : (Promise.resolve({ ok: false, error: "未选择酒店" }) as Promise<{ ok: false; error: string }>);

    const [fr, hr] = await Promise.all([flightReq, hotelReq]);

    if (!fr.ok || !hr.ok) {
      setError(
        `下单失败：${[!fr.ok && `机票 ${fr.error}`, !hr.ok && `酒店 ${hr.error}`].filter(Boolean).join("；")}`
      );
      setSubmitting(false);
      return;
    }

    const trip: StoredTrip = {
      id: genTripId(),
      createdAt: Date.now(),
      title: `${sp.originName} ⇄ ${sp.destName}`,
      flightOrderId: fr.data.platform_order_id ?? fr.data.out_trade_no,
      hotelOrderId: hr.data.platform_order_id ?? hr.data.out_trade_no,
      flightCheckoutUrl: fr.data.checkout_url,
      hotelCheckoutUrl: hr.data.checkout_url,
      flightAmount: fr.data.total_amount,
      hotelAmount: hr.data.total_amount,
      route: summary,
      dates: `${fmt(sp.checkIn ?? "")}-${fmt(sp.checkOut ?? "")}`,
      paxSummary: `${adults}大${children}小`,
      totalPrice: (fr.data.total_amount ?? 0) + (hr.data.total_amount ?? 0),
    };
    addTrip(trip);

    setResult({ flight: fr.data, hotel: hr.data });
    setSubmitting(false);
  }

  // 成功页：一单一单支付（机票、酒店各自独立的收银台）
  if (result) {
    const fUrl = result.flight?.checkout_url;
    const hUrl = result.hotel?.checkout_url;
    return (
      <main className="pb-safe">
        <NavBar title="下单结果" back="/" />
        <div className="px-4 py-6">
          <div className="bg-cream rounded-xl2 shadow-card p-6 text-center fade-up border border-line">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-brand-soft flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-brand">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="font-display text-[20px] font-medium text-ink">订单创建成功</div>
            <div className="text-[13px] text-muted mt-1">两笔订单需分别支付（不合并收款）</div>

            {/* 机票订单 */}
            <div className="mt-5 text-left rounded-xl border border-line p-4 bg-canvas/60">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-ink">✈️ 机票订单</span>
                {result.flight?.total_amount != null && (
                  <span className="font-display text-brand font-semibold">¥{Math.round(result.flight.total_amount).toLocaleString("zh-CN")}</span>
                )}
              </div>
              {result.flight?.platform_order_id && (
                <div className="text-[11px] text-muted mt-1 break-all">订单号 {result.flight.platform_order_id}</div>
              )}
              <a
                href={fUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-3 block w-full h-11 leading-[2.75rem] text-center rounded-full font-medium btn-press ${
                  fUrl ? "bg-brand text-white shadow-soft" : "bg-canvas text-muted"
                }`}
              >
                {fUrl ? "支付机票" : "未获取到支付链接"}
              </a>
            </div>

            {/* 酒店订单 */}
            <div className="mt-3 text-left rounded-xl border border-line p-4 bg-canvas/60">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-medium text-ink">🏨 酒店订单</span>
                {result.hotel?.total_amount != null && (
                  <span className="font-display text-brand font-semibold">¥{Math.round(result.hotel.total_amount).toLocaleString("zh-CN")}</span>
                )}
              </div>
              {result.hotel?.platform_order_id && (
                <div className="text-[11px] text-muted mt-1 break-all">订单号 {result.hotel.platform_order_id}</div>
              )}
              <a
                href={hUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`mt-3 block w-full h-11 leading-[2.75rem] text-center rounded-full font-medium btn-press ${
                  hUrl ? "bg-brand text-white shadow-soft" : "bg-canvas text-muted"
                }`}
              >
                {hUrl ? "支付酒店" : "未获取到支付链接"}
              </a>
            </div>

            <div className="mt-4 text-[11px] text-muted leading-relaxed text-left">
              请分别完成两笔订单的支付。每笔订单独立收款，互不影响。
            </div>

            <div className="mt-3 flex gap-2">
              <a href="/orders" className="flex-1 h-11 leading-[2.75rem] text-center rounded-full border border-line text-ink btn-press">
                查看订单
              </a>
              <a href="/" className="flex-1 h-11 leading-[2.75rem] text-center rounded-full bg-brand-soft text-brand font-medium btn-press">
                继续预订
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pb-32">
      <NavBar title="填写订单信息" back="/" />

      <div className="px-4 py-3">
        <div className="bg-cream rounded-xl shadow-card p-4 text-[13px] border border-line">
          <div className="font-medium text-ink">{summary}</div>
          <div className="text-[12px] text-muted mt-1">
            {sp.hotelName} {sp.roomName ? `· ${sp.roomName}` : ""}
          </div>
        </div>
      </div>

      <div className="px-4">
        <ErrorBanner message="本页将创建真实订单并产生真实扣费，请确认信息无误后再提交。" />
      </div>

      {/* 乘机人 */}
      <section className="px-4 py-2">
        <h3 className="font-display text-[19px] font-medium text-ink tracking-tightish mb-3">
          乘机人信息<span className="text-[13px] text-muted font-normal"> · {paxes.length}人</span>
        </h3>
        <div className="space-y-3">
          {paxes.map((p, i) => (
            <div key={i} className="bg-cream rounded-xl p-4 space-y-2.5 fade-up border border-line">
              <div className="flex items-center gap-2">
                <span
                  className="tag"
                  style={p.type === "child" ? { background: "#e0d9cc", color: "#5a4a2e" } : {}}
                >
                  {p.type === "adult" ? "成人" : "儿童"}
                </span>
                <span className="text-[12px] text-muted">第 {i + 1} 位</span>
              </div>
              <input
                className="w-full h-10 px-3 rounded-lg border border-line bg-canvas text-[13px] outline-none focus:border-brand transition-colors"
                placeholder="姓名（与证件一致）"
                value={p.name}
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <div className="flex gap-2">
                <select
                  className="h-10 px-2 rounded-lg border border-line bg-canvas text-[13px] outline-none focus:border-brand"
                  value={p.id_type}
                  onChange={(e) => update(i, { id_type: e.target.value as Pax["id_type"] })}
                >
                  <option value="ID_CARD">身份证</option>
                  <option value="PASSPORT">护照</option>
                </select>
                <input
                  className="flex-1 h-10 px-3 rounded-lg border border-line bg-canvas text-[13px] outline-none focus:border-brand transition-colors"
                  placeholder="证件号"
                  value={p.id_number}
                  onChange={(e) => update(i, { id_number: e.target.value })}
                />
              </div>
              <input
                className="w-full h-10 px-3 rounded-lg border border-line bg-canvas text-[13px] outline-none focus:border-brand transition-colors"
                placeholder="手机号"
                inputMode="tel"
                value={p.phone}
                onChange={(e) => update(i, { phone: e.target.value })}
              />
              {p.type === "child" && (
                <input
                  type="date"
                  className="w-full h-10 px-3 rounded-lg border border-line bg-canvas text-[13px] outline-none focus:border-brand transition-colors"
                  value={p.birthday ?? ""}
                  onChange={(e) => update(i, { birthday: e.target.value })}
                />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 联系人 */}
      <section className="px-4 py-3">
        <h3 className="font-display text-[19px] font-medium text-ink tracking-tightish mb-3">联系人</h3>
        <div className="bg-cream rounded-xl p-4 space-y-2.5 border border-line">
          <input
            className="w-full h-10 px-3 rounded-lg border border-line bg-canvas text-[13px] outline-none focus:border-brand transition-colors"
            placeholder="联系人姓名"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
          <input
            className="w-full h-10 px-3 rounded-lg border border-line bg-canvas text-[13px] outline-none focus:border-brand transition-colors"
            placeholder="手机号"
            inputMode="tel"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>
      </section>

      {error && (
        <div className="px-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-h5 bg-cream/95 backdrop-blur-xl border-t border-line/70 bar-safe z-30 shadow-bar">
        <div className="h-16 px-4 flex items-center gap-3">
          <div className="flex-1 text-[11px] text-muted leading-tight">
            提交即创建真实订单
            <br />
            机票+酒店 两笔订单
          </div>
          <button
            disabled={!valid || submitting}
            onClick={submit}
            className="h-12 px-9 rounded-full bg-brand text-white font-medium text-[15px] btn-press shadow-soft disabled:opacity-50"
          >
            {submitting ? "提交中…" : "确认下单"}
          </button>
        </div>
      </div>
    </main>
  );

  function update(i: number, patch: Partial<Pax>) {
    setPaxes((arr) => arr.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }
}

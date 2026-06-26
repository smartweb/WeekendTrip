"use client";

import { useEffect, useState } from "react";
import { NavBar, TabBar } from "@/components/NavBar";
import { EmptyState, Spinner } from "@/components/ui";
import { readTrips, removeTrip, type StoredTrip } from "@/lib/orders";
import { yuan } from "@/lib/package";

export function OrdersClient() {
  const [trips, setTrips] = useState<StoredTrip[] | null>(null);

  useEffect(() => {
    setTrips(readTrips());
  }, []);

  function refresh() {
    setTrips(readTrips());
  }

  return (
    <main className="pb-safe">
      <NavBar title="我的订单" back="/" />
      <div className="px-4 py-4">
        {trips === null ? (
          <Spinner label="加载中…" />
        ) : trips.length === 0 ? (
          <EmptyState title="还没有订单" hint="去首页选个亲子套餐，开启周末之旅吧" />
        ) : (
          <div className="space-y-4">
            {trips.map((t) => (
              <TripCard key={t.id} trip={t} onRemove={() => { removeTrip(t.id); refresh(); }} />
            ))}
          </div>
        )}
      </div>
      <TabBar active="orders" />
    </main>
  );
}

function TripCard({ trip, onRemove }: { trip: StoredTrip; onRemove: () => void }) {
  return (
    <div className="bg-cream rounded-xl2 shadow-card p-4 fade-up border border-line">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-display text-[17px] font-medium text-ink">{trip.title}</div>
          <div className="text-[12px] text-muted mt-0.5">
            {trip.dates} · {trip.paxSummary}
          </div>
        </div>
        <button onClick={onRemove} className="text-[11px] text-muted px-2 py-1">
          删除
        </button>
      </div>

      {/* 两笔订单，各自独立支付 */}
      <div className="mt-3 space-y-2.5 border-t border-line pt-3">
        <OrderPayRow
          icon="✈️"
          label="机票订单"
          orderId={trip.flightOrderId}
          amount={trip.flightAmount}
          checkoutUrl={trip.flightCheckoutUrl}
        />
        <OrderPayRow
          icon="🏨"
          label="酒店订单"
          orderId={trip.hotelOrderId}
          amount={trip.hotelAmount}
          checkoutUrl={trip.hotelCheckoutUrl}
        />
      </div>

      {trip.totalPrice ? (
        <div className="mt-3 flex justify-between items-center border-t border-line pt-2.5">
          <span className="text-[12px] text-muted">合计</span>
          <span className="font-display text-brand font-semibold text-[20px]">{yuan(trip.totalPrice)}</span>
        </div>
      ) : null}

      <div className="mt-2 text-[10px] text-muted leading-relaxed">
        两笔订单需分别支付（不合并收款）。订单号有效期约 10 分钟，过期需重新下单。
      </div>
    </div>
  );
}

/** 单笔订单行：金额 + 各自的「去支付」按钮 */
function OrderPayRow({
  icon,
  label,
  orderId,
  amount,
  checkoutUrl,
}: {
  icon: string;
  label: string;
  orderId?: string;
  amount?: number;
  checkoutUrl?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span>{icon}</span>
          <span className="text-[13px] font-medium text-ink">{label}</span>
          {amount != null && (
            <span className="font-display text-brand font-semibold text-[14px]">¥{Math.round(amount).toLocaleString("zh-CN")}</span>
          )}
        </div>
        <div className="font-mono text-[11px] text-muted mt-0.5 break-all">{orderId ?? "未创建"}</div>
      </div>
      <a
        href={checkoutUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex-shrink-0 h-9 px-4 rounded-full text-[12px] font-medium btn-press leading-[2.25rem] ${
          checkoutUrl ? "bg-brand text-white shadow-soft" : "bg-canvas text-muted"
        }`}
      >
        {checkoutUrl ? "去支付" : "无链接"}
      </a>
    </div>
  );
}

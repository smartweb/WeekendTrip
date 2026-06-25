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
  const created = new Date(trip.createdAt);
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

      <div className="mt-3 space-y-2 text-[13px] border-t border-line pt-3">
        <OrderLine label="机票订单" orderId={trip.flightOrderId} />
        <OrderLine label="酒店订单" orderId={trip.hotelOrderId} />
      </div>

      {trip.totalPrice ? (
        <div className="mt-3 flex justify-between items-center border-t border-line pt-2.5">
          <span className="text-[12px] text-muted">合计</span>
          <span className="font-display text-brand font-semibold text-[20px]">{yuan(trip.totalPrice)}</span>
        </div>
      ) : null}

      <div className="mt-3 flex items-center gap-2">
        <span className="text-[11px] px-2.5 py-1 rounded-full bg-ochre-soft text-ochre">待支付</span>
        <div className="text-[10px] text-muted">
          下单于 {created.getMonth() + 1}/{created.getDate()} {String(created.getHours()).padStart(2, "0")}:{String(created.getMinutes()).padStart(2, "0")}
        </div>
      </div>

      <div className="mt-2 text-[10px] text-muted leading-relaxed">
        支付需在下单时跳转的收银台完成。如需重新支付，请重新下单（订单号 10 分钟内有效）。
      </div>
    </div>
  );
}

function OrderLine({ label, orderId }: { label: string; orderId?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="text-muted">{label}：</span>
        <span className="font-mono text-[12px] text-ink break-all">{orderId ?? "未创建"}</span>
      </div>
    </div>
  );
}

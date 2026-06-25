"use client";

import { useMemo, useState } from "react";
import { Sheet } from "./ui";
import { Stepper } from "./Stepper";

/** 计算周末候选日期：未来 6 周的周五/六出发，对应 2 晚返回 */
function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function fmt(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function weekday(d: Date) {
  return ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
}

export interface TravelChoice {
  depart: string;
  nights: number;
  adults: number;
  children: number;
  /** 酒店每晚预算上限（元），0 = 不限 */
  hotelMaxPerNight: number;
}

/** 酒店每晚预算档位（元）— 这里的金额是「目标价位中心」而非上限 */
export const HOTEL_BUDGET_OPTIONS: { value: number; label: string; sub: string }[] = [
  { value: 0, label: "不限", sub: "看所有价位" },
  { value: 300, label: "约 300", sub: "经济实惠" },
  { value: 600, label: "约 600", sub: "舒适之选" },
  { value: 1000, label: "约 1000", sub: "品质亲子" },
  { value: 2000, label: "约 2000", sub: "高端度假" },
];

export function TravelPicker({
  open,
  value,
  onConfirm,
  onClose,
}: {
  open: boolean;
  value: TravelChoice;
  onConfirm: (v: TravelChoice) => void;
  onClose: () => void;
}) {
  const today = useMemo(() => new Date(), []);
  const options = useMemo(() => {
    const arr: { depart: string; nights: number; label: string; sub: string }[] = [];
    let d = addDays(today, 1);
    // 往后扫 45 天，挑周五/六出发
    for (let i = 0; i < 45 && arr.length < 8; i++) {
      const day = d.getDay();
      if (day === 5 || day === 6) {
        const nights = day === 5 ? 2 : 1; // 周五出发行2晚，周六出发行1晚
        const ret = addDays(d, nights);
        arr.push({
          depart: fmt(d),
          nights,
          label: `${d.getMonth() + 1}月${d.getDate()}日 周${weekday(d)}`,
          sub: `住${nights}晚 · 返程 ${ret.getMonth() + 1}/${ret.getDate()}`,
        });
      }
      d = addDays(d, 1);
    }
    return arr;
  }, [today]);

  const [pick, setPick] = useState<{ depart: string; nights: number }>({
    depart: value.depart,
    nights: value.nights,
  });
  const [adults, setAdults] = useState(value.adults);
  const [children, setChildren] = useState(value.children);
  const [budget, setBudget] = useState(value.hotelMaxPerNight ?? 0);

  const selected = options.find((o) => o.depart === pick.depart && o.nights === pick.nights) ?? options[0];

  return (
    <Sheet open={open} onClose={onClose} title="选择出行日期与人数">
      <div className="p-4 space-y-5">
        <div className="grid grid-cols-2 gap-2.5">
          {options.map((o) => {
            const active = o.depart === pick.depart && o.nights === pick.nights;
            return (
              <button
                key={o.depart + o.nights}
                onClick={() => setPick({ depart: o.depart, nights: o.nights })}
                className={`text-left p-3 rounded-xl border btn-press transition-colors ${
                  active ? "border-brand bg-brand-soft" : "border-line bg-cream"
                }`}
              >
                <div className="text-[13px] font-medium text-ink">{o.label}</div>
                <div className="text-[11px] text-muted mt-0.5">{o.sub}</div>
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-line divide-y divide-line bg-cream overflow-hidden">
          <Row label="成人" hint="≥12岁">
            <Stepper value={adults} min={1} max={6} onChange={setAdults} />
          </Row>
          <Row label="儿童" hint="2-12岁，享儿童票">
            <Stepper value={children} min={0} max={5} onChange={setChildren} />
          </Row>
        </div>

        <div>
          <div className="text-[13px] font-medium text-ink mb-1.5 px-1">
            酒店每晚预算 <span className="text-[11px] text-muted font-normal">（决定推荐档次）</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {HOTEL_BUDGET_OPTIONS.map((o) => {
              const active = o.value === budget;
              return (
                <button
                  key={o.value}
                  onClick={() => setBudget(o.value)}
                  className={`text-left px-3.5 py-2 rounded-xl border btn-press transition-colors ${
                    active ? "border-brand bg-brand-soft" : "border-line bg-cream"
                  }`}
                >
                  <div className="text-[13px] font-medium text-ink">{o.label}</div>
                  <div className="text-[10px] text-muted mt-0.5">{o.sub}</div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={() => {
            onConfirm({
              depart: selected?.depart ?? value.depart,
              nights: selected?.nights ?? value.nights,
              adults,
              children,
              hotelMaxPerNight: budget,
            });
            onClose();
          }}
          className="w-full h-12 rounded-full bg-brand text-white font-medium btn-press shadow-soft"
        >
          确定
        </button>
      </div>
    </Sheet>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-3 py-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-[11px] text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

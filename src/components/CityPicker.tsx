"use client";

import { Sheet } from "./ui";

export interface CityOption {
  code: string;
  name: string;
  sub?: string;
}

/** 通用城市/机场选择底部弹层 */
export function CityPicker({
  open,
  title,
  options,
  value,
  onPick,
  onClose,
}: {
  open: boolean;
  title: string;
  options: CityOption[];
  value?: string;
  onPick: (code: string) => void;
  onClose: () => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="p-2.5">
        {options.map((o) => {
          const active = o.code === value;
          return (
            <button
              key={o.code}
              onClick={() => {
                onPick(o.code);
                onClose();
              }}
              className={`w-full text-left px-3.5 py-3.5 rounded-xl flex items-center justify-between btn-press transition-colors ${
                active ? "bg-brand-soft" : "hover:bg-canvas"
              }`}
            >
              <div>
                <div className="font-medium text-ink">{o.name}</div>
                {o.sub && <div className="text-[12px] text-muted mt-0.5">{o.sub}</div>}
              </div>
              {active && (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-brand">
                  <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

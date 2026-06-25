"use client";

/** 数量步进器（成人/儿童/房间数） */
export function Stepper({
  value,
  min = 0,
  max = 9,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={dec}
        disabled={value <= min}
        className="w-8 h-8 rounded-full border border-line bg-cream text-lg leading-none flex items-center justify-center disabled:opacity-30 btn-press"
        aria-label="减少"
      >
        −
      </button>
      <span className="w-5 text-center font-display font-medium">{value}</span>
      <button
        onClick={inc}
        disabled={value >= max}
        className="w-8 h-8 rounded-full border border-line bg-cream text-lg leading-none flex items-center justify-center disabled:opacity-30 btn-press"
        aria-label="增加"
      >
        +
      </button>
    </div>
  );
}

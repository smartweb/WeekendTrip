"use client";

import Link from "next/link";

/** 顶部导航：返回 / 标题 / 右侧操作 */
export function NavBar({
  title,
  back,
  right,
}: {
  title?: string;
  back?: string; // 返回目标路径，缺省为 history.back()
  right?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-20 bg-cream/85 backdrop-blur-xl border-b border-line/70">
      <div
        className="h-14 flex items-center px-3 gap-2"
        style={{ paddingTop: "var(--safe-top)" }}
      >
        <BackButton back={back} />
        {title && (
          <h1 className="flex-1 text-center font-display text-[17px] font-medium text-ink tracking-tightish truncate">
            {title}
          </h1>
        )}
        <div className="min-w-[36px] flex justify-end">{right ?? <span className="w-9" />}</div>
      </div>
    </header>
  );
}

function BackButton({ back }: { back?: string }) {
  if (back) {
    return (
      <Link
        href={back}
        aria-label="返回"
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-canvas btn-press"
      >
        <ChevronLeft />
      </Link>
    );
  }
  return (
    <button
      aria-label="返回"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) window.history.back();
      }}
      className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-canvas btn-press"
    >
      <ChevronLeft />
    </button>
  );
}

function ChevronLeft() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M15 5l-7 7 7 7" stroke="#242220" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** 底部 Tab 栏（首页 / 我的订单） */
export function TabBar({ active }: { active: "home" | "orders" }) {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-h5 bg-cream/90 backdrop-blur-xl border-t border-line/70 bar-safe z-20">
      <div className="grid grid-cols-2 h-16">
        <TabItem href="/" label="推荐" active={active === "home"} icon={<HomeIcon />} />
        <TabItem href="/orders" label="我的订单" active={active === "orders"} icon={<OrderIcon />} />
      </div>
    </nav>
  );
}

function TabItem({ href, label, active, icon }: { href: string; label: string; active: boolean; icon: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center gap-1 text-[11px] btn-press transition-colors ${
        active ? "text-brand" : "text-muted"
      }`}
    >
      {icon}
      <span className={active ? "font-medium" : ""}>{label}</span>
    </Link>
  );
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 10.5L12 3l9 7.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V20h14V9.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function OrderIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="4" y="3" width="16" height="18" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

/** 触底操作栏：左侧价格，右侧 CTA */
export function ActionBar({
  priceLabel,
  priceSub,
  cta,
  onCta,
}: {
  priceLabel: string;
  priceSub?: string;
  cta: string;
  onCta: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-h5 bg-cream/95 backdrop-blur-xl border-t border-line/70 bar-safe z-30 shadow-bar">
      <div className="h-16 px-4 flex items-center gap-3">
        <div className="flex-1 leading-tight">
          <div className="font-display text-brand text-[24px] font-semibold tracking-display">{priceLabel}</div>
          {priceSub && <div className="text-[11px] text-muted">{priceSub}</div>}
        </div>
        <button
          onClick={onCta}
          className="h-12 px-9 rounded-full bg-brand text-white font-medium text-[15px] btn-press shadow-soft"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}

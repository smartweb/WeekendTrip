"use client";

import { useEffect } from "react";

/** 底部弹层（ActionSheet 风格），避免原生 select */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-[2px]" />
      <div
        className="relative w-full max-w-h5 bg-cream rounded-t-xl3 fade-up bar-safe"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-line">
          <div className="font-display text-[17px] font-medium text-ink">{title}</div>
          <button onClick={onClose} aria-label="关闭" className="w-8 h-8 flex items-center justify-center rounded-full text-muted hover:bg-canvas">✕</button>
        </div>
        <div className="max-h-[64vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted">
      <div className="w-7 h-7 border-2 border-brand/25 border-t-brand rounded-full animate-spin" />
      {label && <div className="text-[13px]">{label}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-6">
      <div className="text-4xl mb-1 opacity-80">🧳</div>
      <div className="font-display font-medium text-ink text-[17px]">{title}</div>
      {hint && <div className="text-[13px] text-muted">{hint}</div>}
    </div>
  );
}

/** 错误提示横幅（IP 白名单等鉴权问题） */
export function ErrorBanner({ message, authRelated }: { message: string; authRelated?: boolean }) {
  return (
    <div className="mx-4 my-3 rounded-xl p-3.5 bg-ochre-soft border border-line text-ink text-[13px]">
      <div className="font-medium text-ochre mb-0.5">⚠️ {authRelated ? "接口不可用" : "出错了"}</div>
      <div className="text-[13px] leading-relaxed text-muted">
        {message}
        {authRelated && "（这是预览数据。请在龙虾平台后台将本机出口 IP 加入白名单以获取真实数据。）"}
      </div>
    </div>
  );
}

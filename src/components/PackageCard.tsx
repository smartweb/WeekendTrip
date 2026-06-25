"use client";

import { useState } from "react";
import Link from "next/link";
import type { FamilyDestination } from "@/lib/catalog";
import { yuan } from "@/lib/package";

export interface HomePackage {
  destinationId: string;
  destinationName: string;
  destinationCity: string;
  hotelId: string;
  hotelName: string;
  star?: number;
  starTag?: string;
  reviewScore?: number;
  tags: string[];
  /** 2大1小 套餐总价（元） */
  totalPrice: number;
  paxSummary: string;
  nights: number;
  emoji: string;
  theme: [string, string];
  /** 真实酒店封面图 URL */
  coverImage?: string;
}

export function PackageCard({ pkg, dest, href }: { pkg: HomePackage; dest?: FamilyDestination; href: string }) {
  // 图片加载失败时回退到主题渐变 + emoji
  const [imgOk, setImgOk] = useState(true);

  return (
    <Link
      href={href}
      className="group block rounded-xl2 overflow-hidden bg-cream shadow-card fade-up btn-press"
    >
      {/* 沉浸式全出血封面 */}
      <div
        className="h-52 relative"
        style={{
          background: `linear-gradient(135deg, ${pkg.theme[0]}, ${pkg.theme[1]})`,
        }}
      >
        {pkg.coverImage && imgOk ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={pkg.coverImage}
            alt={pkg.hotelName}
            className="absolute inset-0 w-full h-full object-cover img-fade"
            onError={() => setImgOk(false)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-90">
            {pkg.emoji}
          </div>
        )}
        {/* 顶部到底部的渐变遮罩，让封面文字清晰、有电影感 */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/65 pointer-events-none" />

        {/* 顶部右上：评分（玻璃质感） */}
        {pkg.reviewScore ? (
          <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur-md text-white">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" className="text-ochre">
              <path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17.8 5.9 21l1.5-6.8L2.2 9.6l6.9-.7L12 2z" />
            </svg>
            <span className="text-[11px] font-medium">{pkg.reviewScore.toFixed(1)}</span>
          </div>
        ) : null}

        {/* 底部封面文字：眉标 + 衬线目的地名 */}
        <div className="absolute inset-x-0 bottom-0 p-4 text-white">
          <div className="eyebrow text-white/80 mb-1">
            {pkg.tags[0] ?? "周末精选"} · {pkg.nights}晚
          </div>
          <h3 className="font-display text-[26px] leading-[1.1] tracking-display font-medium drop-shadow-sm">
            {pkg.destinationName}
          </h3>
        </div>
      </div>

      {/* 内容区 */}
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-1">
          {pkg.starTag ? (
            <span className="text-[11px] text-ochre font-medium">{pkg.starTag}</span>
          ) : pkg.star ? (
            <span className="text-ochre text-[11px]">{"★".repeat(Math.min(5, pkg.star))}</span>
          ) : null}
          <span className="text-[12px] text-muted truncate">{pkg.hotelName}</span>
        </div>

        <div className="flex items-end justify-between mt-1">
          <div>
            <span className="font-display text-brand text-[28px] font-semibold tracking-display">
              {yuan(pkg.totalPrice)}
            </span>
            <span className="text-[11px] text-muted ml-1.5">
              起 · {pkg.paxSummary}
            </span>
          </div>
          <span className="flex items-center gap-1 text-brand text-[12px] font-medium">
            探索
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

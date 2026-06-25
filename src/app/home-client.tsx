"use client";

import { useCallback, useEffect, useState } from "react";
import { FAMILY_DESTINATIONS, ORIGIN_CITIES, findOrigin, findDestination } from "@/lib/catalog";
import { CityPicker } from "@/components/CityPicker";
import { PackageCard, type HomePackage } from "@/components/PackageCard";
import { Spinner, ErrorBanner, EmptyState } from "@/components/ui";
import { TabBar } from "@/components/NavBar";
import { TravelPicker, type TravelChoice } from "@/components/TravelPicker";
import { api } from "@/lib/browserFetch";

function defaultTravel(): TravelChoice {
  const d = new Date();
  d.setDate(d.getDate() + (((5 - d.getDay() + 7) % 7) || 7));
  return { depart: toYmd(d), nights: 2, adults: 2, children: 1, hotelMaxPerNight: 600 };
}
function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(ymd: string, n: number) {
  const d = new Date(ymd + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toYmd(d);
}

interface PackageResp {
  packages: {
    destinationId: string;
    hotel: {
      hotel_id: string;
      hotel_name: string;
      star_rating?: number;
      star_tag?: string;
      review_score?: number;
      scene_tags?: string[];
      min_price?: number;
      address?: string;
      main_picture?: string;
    };
    pricing: { packageTotal: number };
  }[];
  meta: { adults: number; children: number; nights: number };
}

export function HomeClient() {
  const [originCode, setOriginCode] = useState("SZX");
  const [travel, setTravel] = useState<TravelChoice>(defaultTravel());
  const [cityOpen, setCityOpen] = useState(false);
  const [travelOpen, setTravelOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ msg: string; auth?: boolean } | null>(null);
  const [data, setData] = useState<PackageResp | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    const fetchOne = async (dest: (typeof FAMILY_DESTINATIONS)[number]) => {
      const r = await api<PackageResp>("/api/package", {
        method: "POST",
        body: {
          from: originCode,
          toAirport: dest.airportCode,
          destination: dest.destination,
          checkIn: travel.depart,
          checkOut: addDays(travel.depart, travel.nights),
          adults: travel.adults,
          children: travel.children,
          hotelMaxPerNight: travel.hotelMaxPerNight,
        },
      });
      return { dest, r };
    };
    // 并发拉取各目的地（QPS 已提升至 100）
    const CONCURRENCY = 4;
    const results: { dest: (typeof FAMILY_DESTINATIONS)[number]; r: Awaited<ReturnType<typeof fetchOne>>["r"] }[] = [];
    for (let i = 0; i < FAMILY_DESTINATIONS.length; i += CONCURRENCY) {
      const batch = FAMILY_DESTINATIONS.slice(i, i + CONCURRENCY);
      const part = await Promise.all(batch.map(fetchOne));
      results.push(...part);
    }

    const authFail = results.find((x) => !x.r.ok) as
      | { dest: typeof FAMILY_DESTINATIONS[number]; r: { ok: false; error: string; authRelated?: boolean } }
      | undefined;
    if (authFail && authFail.r.authRelated) {
      setError({ msg: authFail.r.error, auth: true });
      setData(null);
      setLoading(false);
      return;
    }

    const cards: { destId: string; pkg: PackageResp["packages"][number] }[] = [];
    for (const { dest, r } of results) {
      if (r.ok && r.data.packages?.length) {
        const cheapest = [...r.data.packages].sort(
          (a, b) => a.pricing.packageTotal - b.pricing.packageTotal
        )[0];
        cards.push({ destId: dest.id, pkg: cheapest });
      }
    }
    cards.sort((a, b) => a.pkg.pricing.packageTotal - b.pkg.pricing.packageTotal);

    setData({
      packages: cards.map((c) => ({ ...c.pkg, destinationId: c.destId })),
      meta: { adults: travel.adults, children: travel.children, nights: travel.nights },
    });
    setLoading(false);
  }, [originCode, travel]);

  useEffect(() => {
    load();
  }, [load]);

  const origin = findOrigin(originCode)!;

  const homePackages: HomePackage[] = (data?.packages ?? []).map((p) => {
    const dest = findDestination(p.destinationId)!;
    const tags =
      p.hotel.scene_tags && p.hotel.scene_tags.length
        ? p.hotel.scene_tags
        : dest.tags;
    return {
      destinationId: dest.id,
      destinationName: dest.name,
      destinationCity: dest.city,
      hotelId: p.hotel.hotel_id,
      hotelName: p.hotel.hotel_name,
      star: p.hotel.star_rating,
      starTag: p.hotel.star_tag,
      reviewScore: p.hotel.review_score,
      tags,
      totalPrice: p.pricing.packageTotal,
      paxSummary: `${travel.adults}大${travel.children}小`,
      nights: travel.nights,
      emoji: dest.emoji,
      theme: dest.theme,
      coverImage: p.hotel.main_picture ? p.hotel.main_picture.replace(/^http:\/\//i, "https://") : undefined,
    };
  });

  const queryBase = (id: string) =>
    `origin=${originCode}&checkIn=${travel.depart}&nights=${travel.nights}&adults=${travel.adults}&children=${travel.children}&hotelMaxPerNight=${travel.hotelMaxPerNight}`;

  return (
    <main className="pb-safe">
      {/* 编辑风 Hero */}
      <header className="px-5 pt-6 pb-5">
        <div className="flex items-center justify-between">
          <div className="eyebrow">周末亲子游 · Weekend Escapes</div>
          <button
            onClick={() => setCityOpen(true)}
            className="flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-cream border border-line text-[13px] font-medium btn-press shadow-soft"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M12 21s7-5.5 7-12a7 7 0 10-14 0c0 6.5 7 12 7 12z" stroke="#b94d2c" strokeWidth="1.8" />
              <circle cx="12" cy="9" r="2.5" stroke="#b94d2c" strokeWidth="1.8" />
            </svg>
            {origin.name}
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
              <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <h1 className="font-display text-[34px] leading-[1.08] font-medium tracking-display text-ink mt-3">
          带上孩子，
          <br />
          <span className="italic text-brand">轻松出发</span>
        </h1>
        <p className="text-[13px] text-muted mt-2 leading-relaxed">
          {origin.name}出发 · 精选全国亲子目的地 · 酒店+往返机票一站预订
        </p>

        {/* 出行信息胶囊卡 */}
        <button
          onClick={() => setTravelOpen(true)}
          className="mt-4 w-full bg-cream rounded-xl2 p-4 flex items-center justify-between border border-line shadow-soft btn-press"
        >
          <div className="text-left">
            <div className="text-[14px] font-medium text-ink">
              {formatDate(travel.depart)} · 住{travel.nights}晚
            </div>
            <div className="text-[12px] text-muted mt-0.5">
              {travel.adults}成人{travel.children > 0 ? ` · ${travel.children}儿童` : ""} · 酒店
              {travel.hotelMaxPerNight > 0 ? `约¥${travel.hotelMaxPerNight}/晚` : "不限"}
            </div>
          </div>
          <span className="text-brand text-[13px] font-medium flex items-center gap-0.5">
            修改
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </header>

      <section className="px-4 pb-3">
        <div className="flex items-end justify-between mb-3 px-1">
          <h2 className="font-display text-[20px] font-medium text-ink tracking-tightish">精选亲子套餐</h2>
          <span className="text-[11px] text-muted">含酒店+往返机票</span>
        </div>

        {loading && <Spinner label="正在为你搜索最佳组合…" />}

        {!loading && error && <ErrorBanner message={error.msg} authRelated={error.auth} />}

        {!loading && !error && (
          <div className="space-y-4">
            {homePackages.length === 0 ? (
              <EmptyState title="暂无可用套餐" hint="换个出发城市或日期试试" />
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {homePackages.map((p, i) => (
                  <PackageCard
                    key={p.destinationId + i}
                    pkg={p}
                    href={`/package/${p.destinationId}?${queryBase(p.destinationId)}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="px-4 pb-6 pt-2">
        <h2 className="font-display text-[20px] font-medium text-ink tracking-tightish mb-3 px-1">
          按主题逛
        </h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
          {FAMILY_DESTINATIONS.map((d) => (
            <a
              key={d.id}
              href={`/package/${d.id}?${queryBase(d.id)}`}
              className="flex-shrink-0 px-3.5 h-9 rounded-full bg-cream border border-line text-[13px] flex items-center gap-1.5 btn-press text-ink"
            >
              <span>{d.emoji}</span> {d.name}
            </a>
          ))}
        </div>
      </section>

      <CityPicker
        open={cityOpen}
        onClose={() => setCityOpen(false)}
        title="出发城市"
        value={originCode}
        onPick={setOriginCode}
        options={ORIGIN_CITIES.map((c) => ({ code: c.code, name: c.name, sub: c.airports.join("/") }))}
      />
      <TravelPicker open={travelOpen} onClose={() => setTravelOpen(false)} value={travel} onConfirm={setTravel} />

      <TabBar active="home" />
    </main>
  );
}

function formatDate(ymd: string) {
  const d = new Date(ymd + "T00:00:00");
  if (Number.isNaN(d.getTime())) return ymd;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

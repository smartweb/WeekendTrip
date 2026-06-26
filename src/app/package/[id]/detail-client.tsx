"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { findDestination, findOrigin } from "@/lib/catalog";
import { NavBar, ActionBar } from "@/components/NavBar";
import { Spinner, ErrorBanner } from "@/components/ui";
import { api } from "@/lib/browserFetch";
import { yuan, budgetToBand } from "@/lib/package";
import type { LxFlightItem, LxHotelItem, LxCabinFare, LxRoomType, LxRoomProduct } from "@/lib/lx/types";

function toYmd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addDays(ymd: string, n: number) {
  const d = new Date(ymd + "T00:00:00");
  d.setDate(d.getDate() + n);
  return toYmd(d);
}
function fmt(ymd: string) {
  const d = new Date(ymd + "T00:00:00");
  if (Number.isNaN(d.getTime())) return ymd;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
function weekday(ymd: string) {
  const d = new Date(ymd + "T00:00:00");
  return ["日", "一", "二", "三", "四", "五", "六"][d.getDay()];
}
/** "2026-07-03 23:10" → "23:10" */
function hhmm(dt: string) {
  if (!dt) return "--:--";
  const m = dt.match(/(\d{2}:\d{2})/);
  return m ? m[1] : dt;
}

/** 取舱位最低总价（含税费），用于展示 */
function cabinTotal(c: LxCabinFare): number {
  return (c.lowest_price ?? c.adult_price) + (c.airport_tax ?? 0) + (c.fuel_tax ?? 0);
}
function cheapestCabin(f: LxFlightItem): LxCabinFare | undefined {
  if (!f.cabins?.length) return undefined;
  return [...f.cabins].sort((a, b) => cabinTotal(a) - cabinTotal(b))[0];
}

/**
 * 生成航班的稳定唯一标识。
 * 注意：真实接口的 flight_id 不可靠（去程/返程、甚至同列表多条全是 "FL_0"），
 * 必须用 航班号+起飞时间+舱位令牌 组合才能保证唯一。
 */
function flightUid(f: LxFlightItem): string {
  const c = cheapestCabin(f);
  return [f.flight_no, f.dep_time, c?.cabin_code, c?.search_offer_id].filter(Boolean).join("|");
}

/** 去重：真实接口会返回多条完全相同的航班（同航班同舱位），合并为一条 */
function dedupeFlights(list: LxFlightItem[]): LxFlightItem[] {
  const seen = new Set<string>();
  const out: LxFlightItem[] = [];
  for (const f of list) {
    const uid = flightUid(f);
    if (!seen.has(uid)) {
      seen.add(uid);
      out.push(f);
    }
  }
  return out;
}

export function PackageDetailClient({
  id,
  origin,
  depart,
  nights,
  adults,
  childCount,
  hotelMaxPerNight,
}: {
  id: string;
  origin: string;
  depart: string;
  nights: number;
  adults: number;
  childCount: number;
  hotelMaxPerNight: number;
}) {
  const dest = findDestination(id);
  const originCity = findOrigin(origin);
  const children = childCount;
  const departOk = depart || (() => {
    const d = new Date();
    d.setDate(d.getDate() + (((5 - d.getDay() + 7) % 7) || 7));
    return toYmd(d);
  })();
  const ret = addDays(departOk, nights);

  const [departFlights, setDepartFlights] = useState<LxFlightItem[] | null>(null);
  const [returnFlights, setReturnFlights] = useState<LxFlightItem[] | null>(null);
  const [selDepart, setSelDepart] = useState<LxFlightItem | null>(null);
  const [selReturn, setSelReturn] = useState<LxFlightItem | null>(null);
  const [hotels, setHotels] = useState<LxHotelItem[] | null>(null);
  const [selHotel, setSelHotel] = useState<LxHotelItem | null>(null);
  const [roomTypes, setRoomTypes] = useState<LxRoomType[] | null>(null);
  const [selProduct, setSelProduct] = useState<{ roomType: LxRoomType; product: LxRoomProduct } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ msg: string; auth?: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [fr, hr] = await Promise.all([
      api<{ flights: LxFlightItem[]; return_flights?: LxFlightItem[] }>("/api/flights", {
        method: "POST",
        body: {
          trip_mode: "domestic",
          trip_type: "roundtrip",
          from_code: origin,
          to_code: dest?.airportCode,
          cabin_class: "economy",
          depart_date: departOk,
          return_date: ret,
          passengers: { adult: adults, child: children },
          sort_by: "price",
        },
      }),
      api<{ hotels: LxHotelItem[] }>("/api/hotels", {
        method: "POST",
        body: {
          destination: dest?.destination,
          check_in: departOk,
          check_out: ret,
          adult_count: adults,
          room_count: 1,
          scene: "family",
          sort_by: "rating",
          filters: {
            has_child_facility: true,
            min_review_score: 4,
            ...(budgetToBand(hotelMaxPerNight) ?? {}),
          },
        },
      }),
    ]);

    if (!fr.ok && fr.authRelated) setError({ msg: fr.error, auth: true });
    if (fr.ok) {
      // 去重：API 可能返回多条完全相同的航班
      const depart = dedupeFlights(fr.data.flights ?? []);
      const ret = dedupeFlights(fr.data.return_flights ?? []);
      setDepartFlights(depart);
      setReturnFlights(ret);
      setSelDepart(depart[0] ?? null);
      setSelReturn(ret[0] ?? null);
    }
    if (hr.ok) {
      setHotels(hr.data.hotels ?? []);
      setSelHotel((hr.data.hotels ?? [])[0] ?? null);
    }
    setLoading(false);
  }, [origin, dest?.airportCode, dest?.destination, departOk, ret, adults, children, hotelMaxPerNight]);

  useEffect(() => {
    load();
  }, [load]);

  // 选中酒店后用 search_offer_id 拉房型
  useEffect(() => {
    if (!selHotel?.search_offer_id) return;
    setRoomTypes(null);
    setSelProduct(null);
    api<{ room_types: LxRoomType[] }>("/api/rooms", {
      method: "POST",
      body: { search_offer_id: selHotel.search_offer_id },
    }).then((r) => {
      if (r.ok) {
        const list = r.data.room_types ?? [];
        setRoomTypes(list);
        // 默认选第一个房型的第一个产品
        const first = list[0];
        if (first?.products?.length) setSelProduct({ roomType: first, product: first.products[0] });
      } else {
        setRoomTypes([]);
      }
    });
  }, [selHotel]);

  const flightTotal = useMemo(() => {
    const dc = cheapestCabin(selDepart ?? ({} as LxFlightItem));
    const rc = cheapestCabin(selReturn ?? ({} as LxFlightItem));
    if (!selDepart) return 0;
    const adultOne = (dc ? dc.lowest_price ?? dc.adult_price : 0) + (dc?.airport_tax ?? 0) + (dc?.fuel_tax ?? 0);
    const adultRet = (rc ? rc.lowest_price ?? rc.adult_price : 0) + (rc?.airport_tax ?? 0) + (rc?.fuel_tax ?? 0);
    const childOne = (dc?.child_price ?? dc?.adult_price ?? 0) + (dc?.airport_tax ?? 0) + (dc?.fuel_tax ?? 0);
    const childRet = (rc?.child_price ?? rc?.adult_price ?? 0) + (rc?.airport_tax ?? 0) + (rc?.fuel_tax ?? 0);
    return adults * (adultOne + adultRet) + children * (childOne + childRet);
  }, [selDepart, selReturn, adults, children]);

  const hotelDisplay = selProduct ? selProduct.product.price * nights : (selHotel?.min_price ?? 0) * nights;
  const total = flightTotal + hotelDisplay;

  if (!dest) {
    return (
      <main className="pt-16 px-4">
        <NavBar title="套餐详情" />
        <div className="text-center py-20 text-muted">未找到该目的地</div>
      </main>
    );
  }

  // 构造预订跳转参数
  const departOffer = cheapestCabin(selDepart ?? ({} as LxFlightItem))?.offer_id ?? cheapestCabin(selDepart ?? ({} as LxFlightItem))?.search_offer_id ?? "";
  const returnOffer = cheapestCabin(selReturn ?? ({} as LxFlightItem))?.offer_id ?? cheapestCabin(selReturn ?? ({} as LxFlightItem))?.search_offer_id ?? "";

  return (
    <main className="pb-safe">
      <NavBar
        title={`${dest.name}亲子套餐`}
        back="/"
        right={
          <a href="/orders" className="text-sm text-muted">
            订单
          </a>
        }
      />

      {/* 目的地封面（沉浸式）— 用排行榜首酒店的实拍图，无数据时回退主题渐变 */}
      {(() => {
        const cover = hotels?.find((h) => h.main_picture)?.main_picture?.replace(/^http:\/\//i, "https://");
        return (
          <div className="h-56 relative overflow-hidden">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={dest.name} className="absolute inset-0 w-full h-full object-cover img-fade" />
            ) : (
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(135deg, ${dest.theme[0]}, ${dest.theme[1]})` }}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/65" />
            <div className="relative h-full flex flex-col justify-end p-5 text-white">
              <div className="eyebrow text-white/80 mb-1.5">目的地</div>
              <div className="font-display text-[32px] leading-[1.05] font-medium tracking-display">{dest.name}</div>
              <div className="text-[13px] opacity-90 mt-1">{dest.tagline}</div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {dest.highlights.map((h) => (
                  <span key={h} className="text-[11px] px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md">
                    {h}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="mx-4 -mt-4 relative bg-cream rounded-xl2 shadow-card p-4 flex items-center justify-between text-[13px] border border-line">
        <div>
          <div className="font-medium text-ink">{originCity?.name} ⇄ {dest.name}</div>
          <div className="text-[12px] text-muted mt-0.5">{fmt(departOk)}周{weekday(departOk)} - {fmt(ret)}周{weekday(ret)} · 住{nights}晚</div>
        </div>
        <div className="text-[12px] text-muted">{adults}成人{children > 0 ? `+${children}儿童` : ""}</div>
      </div>

      {loading && <Spinner label="搜索航班与酒店中…" />}
      {!loading && error && <ErrorBanner message={error.msg} authRelated={error.auth} />}

      {!loading && (
        <div className="px-4 py-3 space-y-5">
          {/* 往返航班 */}
          <Section title="① 选择往返航班" subtitle={`${originCity?.name} ⇄ ${dest.name}`}>
            {departFlights && departFlights.length > 0 ? (
              <>
                <FlightGroup
                  label={`去程 · ${fmt(departOk)} 周${weekday(departOk)}`}
                  flights={departFlights}
                  selected={selDepart ?? undefined}
                  onSelect={setSelDepart}
                />
                {returnFlights && returnFlights.length > 0 && (
                  <FlightGroup
                    label={`返程 · ${fmt(ret)} 周${weekday(ret)}`}
                    flights={returnFlights}
                    selected={selReturn ?? undefined}
                    onSelect={setSelReturn}
                  />
                )}
              </>
            ) : (
              <div className="text-sm text-muted py-4 text-center">暂无可用航班</div>
            )}
          </Section>

          {/* 酒店 */}
          <Section title="② 选择亲子酒店" subtitle={`${dest.name} · 亲子设施`}>
            {hotels && hotels.length > 0 ? (
              <div className="space-y-2">
                {hotels.map((h) => {
                  const active = h.hotel_id === selHotel?.hotel_id;
                  return (
                    <div
                      key={h.hotel_id}
                      className={`p-3 rounded-xl border transition-colors ${active ? "border-brand bg-brand-soft" : "border-line bg-cream"}`}
                    >
                      <button onClick={() => setSelHotel(h)} className="w-full text-left btn-press">
                        <div className="flex gap-3 items-start">
                          {h.main_picture ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={h.main_picture.replace(/^http:\/\//i, "https://")}
                              alt={h.hotel_name}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0 bg-canvas"
                            />
                          ) : (
                            <div
                              className="w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-2xl"
                              style={{ background: `linear-gradient(135deg, ${dest.theme[0]}, ${dest.theme[1]})` }}
                            >
                              {dest.emoji}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-ink flex items-center gap-1">
                              {h.hotel_name}
                              {h.star_tag ? (
                                <span className="text-[10px] text-ochre">{h.star_tag}</span>
                              ) : h.star_rating ? (
                                <span className="text-ochre text-xs">{"★".repeat(Math.min(5, Math.round(h.star_rating)))}</span>
                              ) : null}
                            </div>
                            <div className="text-[12px] text-muted">{h.address ?? [h.district, h.business_zone].filter(Boolean).join(" · ")}</div>
                            <div className="flex gap-1.5 mt-1 flex-wrap items-center">
                              {h.review_score ? (
                                <span className="text-[11px] text-brand font-medium">{h.review_score.toFixed(1)} 分</span>
                              ) : null}
                              {h.has_swimming_pool && <span className="tag">泳池</span>}
                              {h.has_breakfast && <span className="tag">早餐</span>}
                              {h.has_child_facility !== false && <span className="tag">亲子设施</span>}
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="font-display text-brand font-semibold text-[16px]">{yuan(h.min_price ?? 0)}</div>
                            <div className="text-[10px] text-muted">/晚 起</div>
                          </div>
                        </div>
                      </button>
                      <div className="mt-2 pt-2 border-t border-line/70 flex justify-end">
                        <HotelDetailLink hotel={h} checkIn={departOk} checkOut={ret} destName={dest.name} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted py-4 text-center">暂无可用酒店</div>
            )}
          </Section>

          {/* 房型 */}
          {selHotel && (
            <Section title="③ 选择房型" subtitle={selHotel.hotel_name}>
              {roomTypes === null ? (
                <Spinner label="加载房型中…" />
              ) : roomTypes.length > 0 ? (
                <div className="space-y-2">
                  {roomTypes.map((rt) =>
                    (rt.products ?? []).map((p) => {
                      const active = selProduct?.product.offer_id === p.offer_id;
                      return (
                        <button
                          key={p.offer_id}
                          onClick={() => setSelProduct({ roomType: rt, product: p })}
                          className={`w-full text-left p-3.5 rounded-xl border btn-press transition-colors ${
                            active ? "border-brand bg-brand-soft" : "border-line bg-cream"
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-medium text-ink">{rt.room_name}</div>
                              <div className="text-[12px] text-muted">
                                {[bedTypeText(rt.bed_type, rt.room_name), rt.area ? `${rt.area}㎡` : "", `可住${rt.max_occupancy ?? 2}人`].filter(Boolean).join(" · ")}
                                {rt.has_window === false ? " · 无窗" : ""}
                              </div>
                              <div className="flex gap-1.5 mt-1.5 flex-wrap">
                                {p.has_breakfast && <span className="tag">含早</span>}
                                <span
                                  className="tag"
                                  style={p.refundable ? { background: "#e8f0e7", color: "#3f6b3a" } : { background: "#f6e7e3", color: "#8a3520" }}
                                >
                                  {p.refundable ? "可取消" : "不可取消"}
                                </span>
                                {p.product_name && <span className="text-[10px] text-muted self-center">{p.product_name}</span>}
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="font-display text-brand font-semibold text-[17px]">{yuan(p.price)}</div>
                              <div className="text-[10px] text-muted">/晚</div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted py-4 text-center">暂无可用房型</div>
              )}
            </Section>
          )}
        </div>
      )}

      <ActionBar
        priceLabel={yuan(total)}
        priceSub={`${yuan(flightTotal)} 机票 + ${yuan(hotelDisplay)} 酒店`}
        cta="立即预订"
        onCta={() => {
          if (!selDepart || !selHotel || !departOffer) {
            alert("请选择航班与酒店/房型");
            return;
          }
          const q = new URLSearchParams({
            from: origin,
            toAirport: dest.airportCode,
            destination: dest.destination,
            checkIn: departOk,
            checkOut: ret,
            nights: String(nights),
            adults: String(adults),
            children: String(children),
            departOffer,
            returnOffer,
            hotelId: selHotel.hotel_id,
            hotelName: selHotel.hotel_name,
            hotelOffer: selProduct?.product.offer_id ?? "",
            roomName: selProduct ? `${selProduct.roomType.room_name}` : "",
            destName: dest.name,
            originName: originCity?.name ?? origin,
          });
          window.location.href = `/booking?${q.toString()}`;
        }}
      />
    </main>
  );
}

function bedTypeText(t?: string, roomName?: string): string {
  const known = { big_bed: "大床", twin: "双床", multi: "多床", single_bed: "单床", tatami: "榻榻米" } as Record<string, string>;
  if (t && known[t]) return known[t];
  // API 常把 bed_type 返回成 "unknown"，此时从房型名里推断
  const name = roomName ?? "";
  if (/双床|两张| twin/i.test(name)) return "双床";
  if (/大床|king|queen/i.test(name)) return "大床";
  if (/单床|single/i.test(name)) return "单床";
  if (/榻榻米|榻/i.test(name)) return "榻榻米";
  return "";
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="fade-up">
      <div className="mb-3">
        <h3 className="font-display text-[19px] font-medium text-ink tracking-tightish">{title}</h3>
        {subtitle && <div className="text-[12px] text-muted mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </section>
  );
}

function FlightGroup({
  label,
  flights,
  selected,
  onSelect,
}: {
  label: string;
  flights: LxFlightItem[];
  /** 选中的航班对象（用引用比较，避免 API 返回重复 flight_id/同航班多舱位导致全选） */
  selected?: LxFlightItem;
  onSelect: (f: LxFlightItem) => void;
}) {
  return (
    <div className="mb-4">
      <div className="text-[12px] font-medium text-muted mb-2 px-1">{label}</div>
      <div className="space-y-2">
        {flights.map((f, idx) => {
          const c = cheapestCabin(f);
          // 用数组下标做 key：API 的 flight_id 不可靠（去程/返程/多条全是 "FL_0"）
          const active = selected === f;
          const price = c ? (c.lowest_price ?? c.adult_price) + (c.airport_tax ?? 0) + (c.fuel_tax ?? 0) : 0;
          return (
            <button
              key={idx}
              onClick={() => onSelect(f)}
              className={`w-full text-left p-3.5 rounded-xl border btn-press transition-colors ${
                active ? "border-brand bg-brand-soft" : "border-line bg-cream"
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 flex-1">
                  <div className="text-center w-12">
                    <div className="font-display font-semibold text-ink text-[16px]">{hhmm(f.dep_time)}</div>
                    <div className="text-[10px] text-muted">{f.dep_airport_code}</div>
                  </div>
                  <div className="text-muted text-xs flex-1 px-1">
                    <div className="text-center text-[10px]">{f.airline_name} {f.flight_no}</div>
                    <div className="flex items-center gap-1">
                      <span className="flex-1 h-px bg-line" />
                      <span>✈</span>
                      <span className="flex-1 h-px bg-line" />
                    </div>
                    {f.stop_count ? (
                      <div className="text-center text-[10px] text-ochre">经停{f.stop_count}次</div>
                    ) : (
                      <div className="text-center text-[10px] text-muted">{Math.round((f.duration_minutes ?? 0) / 60)}h{(f.duration_minutes ?? 0) % 60}m</div>
                    )}
                  </div>
                  <div className="text-center w-12">
                    <div className="font-display font-semibold text-ink text-[16px]">{hhmm(f.arr_time)}</div>
                    <div className="text-[10px] text-muted">{f.arr_airport_code}</div>
                  </div>
                </div>
                <div className="text-right ml-2">
                  <div className="font-display text-brand font-semibold text-[17px]">{yuan(price)}</div>
                  <div className="text-[10px] text-muted">起/人</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** 酒店详情链接 */
function HotelDetailLink({
  hotel,
  checkIn,
  checkOut,
  destName,
}: {
  hotel: LxHotelItem;
  checkIn: string;
  checkOut: string;
  destName: string;
}) {
  const facilities = [
    hotel.has_wifi && "WiFi",
    hotel.has_swimming_pool && "泳池",
    hotel.has_breakfast && "早餐",
    hotel.has_parking && "停车",
    hotel.has_gymnasium && "健身房",
    hotel.has_restaurant && "餐厅",
  ].filter(Boolean) as string[];

  const q = new URLSearchParams({
    checkIn,
    checkOut,
    hotelId: hotel.hotel_id,
    searchOfferId: hotel.search_offer_id,
    name: hotel.hotel_name,
    starRating: String(hotel.star_rating ?? ""),
    starTag: hotel.star_tag ?? "",
    score: String(hotel.review_score ?? ""),
    reviewCount: String(hotel.review_count ?? ""),
    address: hotel.address ?? [hotel.district, hotel.business_zone].filter(Boolean).join(" "),
    brandName: hotel.brand_name ?? "",
    minPrice: String(hotel.min_price ?? ""),
    tags: hotel.scene_tags ? encodeURIComponent(JSON.stringify(hotel.scene_tags)) : "",
    facilities: facilities.length ? encodeURIComponent(JSON.stringify(facilities)) : "",
    mainPicture: hotel.main_picture ?? "",
    destName,
    back: typeof window !== "undefined" ? window.location.pathname + window.location.search : "/",
  });
  return (
    <Link href={`/hotel/${hotel.hotel_id}?${q.toString()}`} className="text-[12px] text-brand font-medium btn-press flex items-center gap-0.5">
      查看详情
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}

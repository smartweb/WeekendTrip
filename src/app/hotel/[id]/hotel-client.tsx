"use client";

import { useCallback, useEffect, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { Spinner, ErrorBanner, EmptyState } from "@/components/ui";
import { api } from "@/lib/browserFetch";
import { yuan } from "@/lib/package";
import type { LxRoomType } from "@/lib/lx/types";

function fmt(ymd: string) {
  const d = new Date(ymd + "T00:00:00");
  if (Number.isNaN(d.getTime())) return ymd;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}
function nights(checkIn: string, checkOut: string) {
  const a = new Date(checkIn + "T00:00:00").getTime();
  const b = new Date(checkOut + "T00:00:00").getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 0;
  return Math.round((b - a) / 86400000);
}
function decodeList(v?: string): string[] {
  if (!v) return [];
  try {
    const arr = JSON.parse(decodeURIComponent(v));
    return Array.isArray(arr) ? arr.map(String) : [];
  } catch {
    return [];
  }
}
/** 床型文案：识别已知枚举；未知(unknown/空)时从房型名兜底推断，实在没有就返回空串 */
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

export function HotelDetailClient({
  hotelId,
  searchOfferId,
  checkIn,
  checkOut,
  name,
  starRating,
  starTag,
  score,
  reviewCount,
  address,
  brandName,
  minPrice,
  tagsRaw,
  facilitiesRaw,
  mainPicture,
  back,
}: {
  hotelId: string;
  searchOfferId: string;
  checkIn: string;
  checkOut: string;
  name: string;
  starRating: string;
  starTag: string;
  score: string;
  reviewCount: string;
  address: string;
  brandName: string;
  minPrice: string;
  tagsRaw: string;
  facilitiesRaw: string;
  mainPicture: string;
  back: string;
}) {
  const [roomTypes, setRoomTypes] = useState<LxRoomType[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ msg: string; auth?: boolean } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (!searchOfferId) {
      setError({ msg: "缺少房型查询令牌(search_offer_id)，请从套餐详情进入。" });
      setLoading(false);
      return;
    }
    const rr = await api<{ room_types: LxRoomType[] }>("/api/rooms", {
      method: "POST",
      body: { search_offer_id: searchOfferId },
    });
    if (rr.ok) {
      setRoomTypes(rr.data.room_types ?? []);
    } else {
      setError({ msg: rr.error, auth: rr.authRelated });
    }
    setLoading(false);
  }, [searchOfferId]);

  useEffect(() => {
    load();
  }, [load]);

  const n = nights(checkIn, checkOut);
  const tags = decodeList(tagsRaw);
  const facilities = decodeList(facilitiesRaw);
  const stars = Number(starRating) || 0;
  const scoreNum = Number(score) || 0;
  const reviewCnt = Number(reviewCount) || 0;
  const minP = Number(minPrice) || 0;

  return (
    <main className="pb-safe">
      <NavBar title="酒店详情" back={back || "/"} />

      {/* 封面图 */}
      {mainPicture ? (
        <div className="h-56 w-full overflow-hidden bg-canvas">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mainPicture} alt={name} className="w-full h-full object-cover img-fade" />
        </div>
      ) : (
        <div
          className="h-48 text-white p-5 flex flex-col justify-end"
          style={{ background: "linear-gradient(135deg, #b94d2c, #8a3520)" }}
        >
          <div className="text-3xl mb-1">🏨</div>
          <div className="font-display text-[26px] font-medium tracking-display">{name || "亲子酒店"}</div>
        </div>
      )}

      {loading && <Spinner label="加载酒店信息…" />}

      {!loading && (
        <div className="px-4 py-3 space-y-4">
          {error && <ErrorBanner message={error.msg} authRelated={error.auth} />}

          {/* 酒店信息卡 */}
          <div className="bg-cream rounded-xl2 shadow-card p-4 fade-up border border-line">
            <div className="flex items-start gap-1 flex-wrap">
              <span className="font-display text-ink text-[22px] font-medium tracking-tightish">{name || "亲子酒店"}</span>
              {starTag ? (
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-ochre-soft text-ochre self-center">{starTag}</span>
              ) : stars > 0 ? (
                <span className="text-ochre text-xs self-center">{"★".repeat(Math.min(5, Math.round(stars)))}</span>
              ) : null}
              {brandName && <span className="text-[11px] text-muted self-center">{brandName}</span>}
            </div>

            {(scoreNum > 0 || reviewCnt > 0) && (
              <div className="flex items-center gap-2 mt-2">
                {scoreNum > 0 && (
                  <span className="font-display text-brand font-semibold text-[18px]">{scoreNum.toFixed(1)}</span>
                )}
                {reviewCnt > 0 && <span className="text-[12px] text-muted">{reviewCnt.toLocaleString("zh-CN")}条评价</span>}
              </div>
            )}

            {address && <div className="text-[12px] text-muted mt-2 flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 21s7-5.5 7-12a7 7 0 10-14 0c0 6.5 7 12 7 12z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.8"/></svg>
              {address}
            </div>}
            {checkIn && (
              <div className="text-[12px] text-muted mt-1">
                {fmt(checkIn)} - {checkOut ? fmt(checkOut) : ""} · 住{n || 1}晚
              </div>
            )}

            {tags.length > 0 && (
              <div className="flex gap-1.5 mt-3 flex-wrap">
                {tags.map((t) => (
                  <span key={t} className="tag">{t}</span>
                ))}
              </div>
            )}

            {facilities.length > 0 && (
              <div className="mt-4 pt-4 border-t border-line">
                <div className="eyebrow mb-2">酒店设施</div>
                <div className="flex flex-wrap gap-1.5">
                  {facilities.map((f) => (
                    <span key={f} className="text-[11px] px-2.5 py-1 rounded-md bg-canvas text-ink">{f}</span>
                  ))}
                </div>
              </div>
            )}

            {minP > 0 && (
              <div className="mt-4 pt-4 border-t border-line flex items-end justify-between">
                <span className="text-[12px] text-muted">最低价</span>
                <span className="font-display text-brand font-semibold text-[20px]">
                  {yuan(minP)}
                  <span className="text-[10px] text-muted font-normal ml-0.5"> /晚 起</span>
                </span>
              </div>
            )}
          </div>

          {/* 房型 / 价格 */}
          <section className="fade-up">
            <h3 className="font-display text-[19px] font-medium text-ink tracking-tightish mb-3">可订房型与价格</h3>
            {roomTypes === null ? (
              <Spinner label="加载房型中…" />
            ) : roomTypes.length > 0 ? (
              <div className="space-y-3">
                {roomTypes.map((rt) => (
                  <div key={rt.room_type_id} className="p-4 rounded-xl border border-line bg-cream">
                    <div className="font-medium text-ink">{rt.room_name}</div>
                    <div className="text-[12px] text-muted mb-2.5">
                      {[bedTypeText(rt.bed_type, rt.room_name), rt.area ? `${rt.area}㎡` : "", `可住${rt.max_occupancy ?? 2}人`].filter(Boolean).join(" · ")}
                      {rt.has_window === false ? " · 无窗" : rt.has_window === true ? " · 有窗" : ""}
                    </div>
                    {(rt.facilities ?? []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {rt.facilities!.map((f) => (
                          <span key={f} className="text-[10px] px-2 py-0.5 rounded bg-canvas text-muted">{f}</span>
                        ))}
                      </div>
                    )}
                    <div className="pt-2.5 border-t border-line/70 space-y-2">
                      {(rt.products ?? []).map((p) => (
                        <div key={p.offer_id} className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="text-[13px] text-ink">{p.product_name || (p.has_breakfast ? "含早" : "无早")}</div>
                            <div className="flex gap-1.5 mt-1">
                              {p.has_breakfast && <span className="tag">含早</span>}
                              <span
                                className="tag"
                                style={p.refundable ? { background: "#e8f0e7", color: "#3f6b3a" } : { background: "#f6e7e3", color: "#8a3520" }}
                              >
                                {p.refundable ? "可取消" : "不可取消"}
                              </span>
                            </div>
                          </div>
                          <div className="text-right ml-2">
                            <div className="font-display text-brand font-semibold text-[17px]">{yuan(p.price)}</div>
                            <div className="text-[10px] text-muted">/晚</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="暂无可订房型" hint="换个日期或返回选择其他酒店" />
            )}
          </section>
        </div>
      )}
    </main>
  );
}

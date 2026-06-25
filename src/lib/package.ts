/**
 * 「亲子套餐」拼装逻辑（真实接口数据）
 *
 * 龙虾 API 没有「机票+酒店」聚合接口，由本模块把两者拼成一张套餐卡：
 *   套餐总价 = 往返机票(2成人 + N儿童) + 酒店总价(N晚 × 最低价/晚)
 *
 * 真实数据结构：
 *  - 机票：价格在 flights[].cabins[]，取最低 lowest_price 作为每人参考价；
 *          儿童价用 child_price（缺省按成人价估算）
 *  - 酒店：min_price 为每晚最低价
 */

import type {
  LxFlightItem,
  LxHotelItem,
  LxHotelSearchResponse,
  LxFlightSearchResponse,
} from "./lx/types";

export interface PackagePricing {
  adults: number;
  children: number;
  nights: number;
  /** 单人往返机票价（成人/儿童，含税费参考） */
  adultRoundFlight: number;
  childRoundFlight: number;
  flightTotal: number;
  /** 酒店总价（N 晚） */
  hotelTotal: number;
  packageTotal: number;
  currency: string;
}

export interface PackageCard {
  destinationId: string;
  hotel: LxHotelItem;
  cheapestDepart?: LxFlightItem;
  cheapestReturn?: LxFlightItem;
  pricing: PackagePricing;
}

export function calcNights(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + "T00:00:00").getTime();
  const b = new Date(checkOut + "T00:00:00").getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 1;
  return Math.round((b - a) / 86400000);
}

/** 取航班最便宜的舱位单人价（含税费参考） */
function cheapestCabinTotal(flight: LxFlightItem): number {
  if (!flight.cabins?.length) return 0;
  const c = [...flight.cabins].sort(
    (a, b) => (a.lowest_price ?? a.adult_price) - (b.lowest_price ?? b.adult_price)
  )[0];
  return (c.lowest_price ?? c.adult_price) + (c.airport_tax ?? 0) + (c.fuel_tax ?? 0);
}

function childCabinTotal(flight: LxFlightItem): number {
  if (!flight.cabins?.length) return 0;
  const c = [...flight.cabins].sort(
    (a, b) => (a.lowest_price ?? a.adult_price) - (b.lowest_price ?? b.adult_price)
  )[0];
  const child = c.child_price ?? c.adult_price;
  return child + (c.airport_tax ?? 0) + (c.fuel_tax ?? 0);
}

export function pricePackage(opts: {
  adults: number;
  children: number;
  nights: number;
  depart?: LxFlightItem;
  ret?: LxFlightItem;
  hotel: LxHotelItem;
}): PackagePricing {
  const { adults, children, nights, depart, ret, hotel } = opts;
  const adultRoundFlight = cheapestCabinTotal(depart!) + cheapestCabinTotal(ret!);
  const childRoundFlight = childCabinTotal(depart!) + childCabinTotal(ret!);
  const flightTotal = adults * adultRoundFlight + children * childRoundFlight;
  const hotelPerN = hotel.min_price ?? 0;
  const hotelTotal = hotelPerN * nights;
  return {
    adults,
    children,
    nights,
    adultRoundFlight,
    childRoundFlight,
    flightTotal,
    hotelTotal,
    packageTotal: flightTotal + hotelTotal,
    currency: hotel.currency ?? "CNY",
  };
}

/** 取最便宜的去程/返程航班 */
function pickCheapest(list: LxFlightItem[]): LxFlightItem | undefined {
  if (!list?.length) return undefined;
  return [...list].sort((a, b) => cheapestCabinTotal(a) - cheapestCabinTotal(b))[0];
}

/** 组装套餐卡 */
export function buildPackages(opts: {
  destinationId: string;
  flight: LxFlightSearchResponse;
  hotel: LxHotelSearchResponse;
  adults: number;
  children: number;
  nights: number;
}): PackageCard[] {
  const { destinationId, flight, hotel, adults, children, nights } = opts;
  const cheapestDepart = pickCheapest(flight.flights ?? []);
  const cheapestReturn = pickCheapest(flight.return_flights ?? []);

  return (hotel.hotels ?? []).map((h) => ({
    destinationId,
    hotel: h,
    cheapestDepart,
    cheapestReturn,
    pricing: pricePackage({
      adults,
      children,
      nights,
      depart: cheapestDepart,
      ret: cheapestReturn,
      hotel: h,
    }),
  }));
}

/** 货币格式化（人民币） */
export function yuan(n: number): string {
  return "¥" + Math.round(n).toLocaleString("zh-CN");
}

/**
 * 把「每晚预算档位」换算成 [min, max] 价格区间。
 *
 * 关键点：预算是一个「目标价位中心」，而不是上限。
 * 用户选 1000 元，要的是「每晚 1000 元左右」的酒店，而不是「含 100 多元在内、
 * 上限 1000 的一切酒店」。否则低价经济型会霸占推荐位。
 *
 * 规则：
 *  - budget <= 0（不限）：返回 null，不加价区间
 *  - 否则以 budget 为中心，下浮约 50%、上浮约 50%，并向下取整到 100、向上取整到 100
 *  - 区间过窄时也保留一定宽度，避免小预算（如 300）区间收缩到 0
 *
 * 实测上游 min_price/max_price 过滤生效，可直接传给 search filters。
 */
export function budgetToBand(budget: number): { min_price: number; max_price: number } | null {
  if (!budget || budget <= 0) return null;
  const min = Math.max(0, Math.floor(budget * 0.5 / 100) * 100);
  const max = Math.ceil(budget * 1.5 / 100) * 100;
  // 防止极端窄区间
  if (max - min < 100) return { min_price: 0, max_price: budget };
  return { min_price: min, max_price: max };
}

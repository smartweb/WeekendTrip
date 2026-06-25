/**
 * 订单/行程本地存储（仅客户端）
 *
 * MVP 不引入数据库：一次「亲子套餐」下单会生成 1 笔机票订单 + 1 笔酒店订单，
 * 在 localStorage 里用一条「行程(trip)」把两个 order_id 关联起来。
 * 「我的订单」页据此调服务端查询状态。
 */

const KEY = "lx_trips_v1";

export interface StoredTrip {
  id: string; // 行程 id（本地生成）
  createdAt: number;
  title: string;
  /** 机票订单号（下单成功后写入；若失败为空） */
  flightOrderId?: string;
  /** 酒店订单号 */
  hotelOrderId?: string;
  /** 套餐总价快照（元） */
  totalPrice?: number;
  /** 出发 / 目的地展示文本 */
  route?: string;
  dates?: string;
  paxSummary?: string; // 如 "2大1小"
}

function isClient() {
  return typeof window !== "undefined";
}

export function readTrips(): StoredTrip[] {
  if (!isClient()) return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as StoredTrip[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function writeTrips(trips: StoredTrip[]) {
  if (!isClient()) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(trips));
  } catch {
    // 忽略容量/隐私模式错误
  }
}

export function addTrip(trip: StoredTrip) {
  const trips = readTrips();
  trips.unshift(trip);
  writeTrips(trips);
}

export function updateTrip(id: string, patch: Partial<StoredTrip>) {
  const trips = readTrips().map((t) => (t.id === id ? { ...t, ...patch } : t));
  writeTrips(trips);
}

export function removeTrip(id: string) {
  writeTrips(readTrips().filter((t) => t.id !== id));
}

export function genTripId(): string {
  return "trip_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

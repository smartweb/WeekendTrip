/**
 * 龙虾出行 — 酒店业务封装（服务端，真实接口）
 */
import { callApi } from "./client";
import type {
  LxHotelOrderCreateRequest,
  LxHotelRoomsResponse,
  LxHotelSearchRequest,
  LxHotelSearchResponse,
  LxOrderCreateResponse,
} from "./types";

export function searchHotels(req: LxHotelSearchRequest) {
  return callApi<LxHotelSearchResponse>("/open/v1/hotel/search", {
    method: "POST",
    body: { scene: "family", sort_by: "best", ...req },
  });
}

/** 查询房型：使用搜索返回的 search_offer_id */
export function getHotelRooms(search_offer_id: string) {
  return callApi<LxHotelRoomsResponse>("/open/v1/hotel/rooms", {
    method: "POST",
    body: { search_offer_id },
  });
}

export function createHotelOrder(req: LxHotelOrderCreateRequest) {
  return callApi<LxOrderCreateResponse>("/open/v1/hotel/order/create", {
    method: "POST",
    body: { ...req, pay_mode: req.pay_mode ?? "user_pay" },
  });
}

/**
 * 龙虾出行 — 机票业务封装（服务端，真实接口）
 */
import { callApi } from "./client";
import type {
  LxCityAirportResponse,
  LxFlightOrderCreateRequest,
  LxFlightSearchRequest,
  LxFlightSearchResponse,
  LxOrderCreateResponse,
} from "./types";

export function searchFlights(req: LxFlightSearchRequest) {
  return callApi<LxFlightSearchResponse>("/open/v1/flight/search", {
    method: "POST",
    body: { ...req, trip_mode: req.trip_mode ?? "domestic" },
  });
}

export function listCityAirports(city: string) {
  return callApi<LxCityAirportResponse>("/open/v1/flight/city_airport", {
    method: "GET",
    query: { city },
  });
}

export function createFlightOrder(req: LxFlightOrderCreateRequest) {
  return callApi<LxOrderCreateResponse>("/open/v1/flight/order/create", {
    method: "POST",
    body: { ...req, pay_mode: req.pay_mode ?? "user_pay" },
  });
}

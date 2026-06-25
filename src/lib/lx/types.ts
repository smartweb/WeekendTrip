/**
 * 龙虾出行开放平台 — 类型定义（与真实接口字段对齐）
 * 文档：https://docs.longxiachuxing.com
 *
 * 注意：字段命名严格按线上接口（Go struct → snake_case）。
 *  - 机票：trip_mode/trip_type/from_code/to_code/passengers，价格在 flights[].cabins[]
 *  - 酒店：destination(关键字)/adult_count/room_count/scene/sort_by，房型在 room_types[].products[]
 *  - 下单：offer_id + out_trade_no + contact + pay_mode:user_pay → 返回 checkout_url
 */

/** 平台统一响应外壳：code === 0 表示成功 */
export interface LxEnvelope<T> {
  code: number;
  message?: string;
  request_id?: string;
  data?: T;
}

/* ------------------------------------------------------------------ */
/* 城市 / 机场                                                         */
/* ------------------------------------------------------------------ */
export interface LxAirport {
  airport_code: string;
  airport_name: string;
  city_name?: string;
}
export interface LxCityAirportResponse {
  city: string;
  has_city_airport: boolean;
  matched_city_code?: string;
  airports: LxAirport[];
}

/* ------------------------------------------------------------------ */
/* 机票                                                                */
/* ------------------------------------------------------------------ */
export type TripMode = "domestic" | "international";
export type TripType = "oneway" | "roundtrip";
export type CabinClass = "economy" | "business" | "first";
export type FlightSortBy = "price" | "depart_time" | "duration" | "arrival_time";

export interface LxPassengers {
  adult: number;
  child?: number;
  infant?: number;
}

export interface LxFlightSearchRequest {
  trip_mode: TripMode;
  trip_type: TripType;
  from_code: string; // 出发城市三字码
  to_code: string; // 到达城市三字码
  cabin_class?: CabinClass;
  depart_date: string; // YYYY-MM-DD
  return_date?: string; // 往返时的返程日期
  flight_no?: string;
  passengers: LxPassengers;
  page?: number;
  page_size?: number;
  sort_by?: FlightSortBy;
}

/** 舱位价格项（可下单令牌在此） */
export interface LxCabinFare {
  cabin_class: string;
  cabin_code: string;
  cabin_name: string;
  discount_rate?: number;
  adult_price: number; // 成人票价（元）
  child_price?: number; // 儿童票价（元）
  airport_tax?: number; // 机建费
  fuel_tax?: number; // 燃油费
  lowest_price?: number;
  seat_status?: "enough" | "few" | "sold_out";
  baggage_rule?: string;
  change_rule?: string;
  refund_rule?: string;
  price_type?: "reference" | "realtime";
  /** 是否需要先调验价再下单 */
  pricing_required?: boolean;
  /** 搜索阶段令牌（每个 cabin 始终返回） */
  search_offer_id: string;
  /** 可直下令牌；为空时需先验价 */
  offer_id?: string;
}

/** 航段信息 */
export interface LxFlightItem {
  flight_id: string;
  flight_no: string;
  airline_code?: string;
  airline_name?: string;
  aircraft_type?: string;
  dep_airport_code: string;
  dep_airport_name?: string;
  dep_city_code?: string;
  dep_city_name?: string;
  dep_terminal?: string;
  dep_time: string; // 如 "2026-07-03 08:00"
  arr_airport_code: string;
  arr_airport_name?: string;
  arr_city_code?: string;
  arr_city_name?: string;
  arr_terminal?: string;
  arr_time: string;
  duration_minutes?: number;
  stop_count?: number;
  meal?: string;
  cabins: LxCabinFare[];
}

export interface LxFlightSearchResponse {
  search_id: string;
  total: number;
  page?: number;
  page_size?: number;
  /** 去程航班 */
  flights: LxFlightItem[];
  /** 返程航班（往返时返回） */
  return_flights?: LxFlightItem[];
}

/* ------------------------------------------------------------------ */
/* 酒店                                                                */
/* ------------------------------------------------------------------ */
export type HotelScene = "couple" | "family" | "senior" | "business" | "inbound";
export type HotelSortBy = "best" | "price" | "rating" | "star" | "distance";

export interface LxHotelSearchFilters {
  min_price?: number;
  max_price?: number;
  min_review_score?: number;
  star_levels?: number[];
  has_child_facility?: boolean;
  has_swimming_pool?: boolean;
  has_breakfast?: boolean;
  has_wifi?: boolean;
  has_parking?: boolean;
  has_gymnasium?: boolean;
  has_restaurant?: boolean;
  hotel_brand?: string;
  max_distance_km?: number;
}

export interface LxHotelSearchRequest {
  destination: string; // 目的地关键字（如 "三亚"、"杭州西湖"）
  check_in: string; // YYYY-MM-DD
  check_out: string; // YYYY-MM-DD
  adult_count?: number;
  room_count?: number;
  scene?: HotelScene;
  sort_by?: HotelSortBy;
  filters?: LxHotelSearchFilters;
  page?: number;
  page_size?: number;
  latitude?: number;
  longitude?: number;
  adcode?: string;
}

export interface LxHotelItem {
  hotel_id: string;
  hotel_name: string;
  hotel_name_en?: string;
  city?: string;
  district?: string;
  business_zone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  distance_km?: number;
  star_rating?: number;
  star_tag?: string; // 经济型/舒适型/高档型/豪华型
  review_score?: number;
  review_count?: number;
  main_picture?: string;
  brand_name?: string;
  has_wifi?: boolean;
  has_parking?: boolean;
  has_swimming_pool?: boolean;
  has_breakfast?: boolean;
  has_child_facility?: boolean;
  has_gymnasium?: boolean;
  has_restaurant?: boolean;
  scene_tags?: string[];
  min_price?: number;
  currency?: string;
  /** 搜索阶段令牌，用于查询房型 */
  search_offer_id: string;
}

export interface LxPageInfo {
  page: number;
  page_size: number;
  total: number;
}

export interface LxHotelSearchResponse {
  search_id: string;
  total: number;
  page_info?: LxPageInfo;
  hotels: LxHotelItem[];
}

/** 房型 */
export interface LxRoomType {
  room_type_id: string;
  room_name: string;
  bed_type?: string; // big_bed / twin / multi
  area?: number; // 平米
  max_occupancy?: number;
  has_window?: boolean;
  facilities?: string[];
  /** 产品列表（不同取消政策/早餐） */
  products: LxRoomProduct[];
}

/** 产品（含可下单 offer_id） */
export interface LxRoomProduct {
  offer_id: string;
  product_name?: string;
  price: number; // 价格（元/晚）
  has_breakfast?: boolean;
  refundable?: boolean;
  cancel_policy?: string;
}

export interface LxHotelRoomsResponse {
  hotel_id: string;
  hotel_name?: string;
  check_in?: string;
  check_out?: string;
  room_types: LxRoomType[];
}

/* ------------------------------------------------------------------ */
/* 联系人 / 乘客 / 入住人                                              */
/* ------------------------------------------------------------------ */
export type IdType = "ID_CARD" | "PASSPORT" | "HK_MACAO_PERMIT" | "TAIWAN_PERMIT";
export type PassengerType = "adult" | "child" | "infant";

export interface LxContactInfo {
  name: string;
  phone: string;
  email?: string;
}

export interface LxPassengerInfo {
  name: string;
  name_en?: string;
  phone: string;
  type: PassengerType;
  id_type: IdType;
  id_number: string;
  birthday?: string; // YYYY-MM-DD，儿童/婴儿必填
  gender?: 1 | 2; // 1男 2女
  card_valid_end_date?: string;
}

export interface LxGuestInfo {
  name: string;
  name_en?: string;
  id_type?: IdType;
  id_number?: string;
}

/* ------------------------------------------------------------------ */
/* 订单（机票/酒店通用结构）                                          */
/* ------------------------------------------------------------------ */
export type PayMode = "user_pay" | "enterprise_credit" | "monthly_settle";

export interface LxFlightOrderCreateRequest {
  out_trade_no: string; // 商户订单号（幂等键，必填）
  offer_id: string; // 去程 offer_id（直下或验价返回，10分钟有效）
  return_offer_id?: string; // 返程 offer_id
  contact: LxContactInfo;
  passengers: LxPassengerInfo[];
  pay_mode: PayMode;
  return_url?: string; // 支付成功跳转
  callback_url?: string;
}

export interface LxHotelOrderCreateRequest {
  out_trade_no: string;
  offer_id: string; // 来自 room_types[].products[].offer_id
  contact: LxContactInfo;
  guests: LxGuestInfo[];
  pay_mode: PayMode;
  return_url?: string;
  callback_url?: string;
  arrival_time?: string;
  special_request?: string;
}

export interface LxOrderCreateResponse {
  platform_order_id?: string;
  merchant_order_no?: string;
  out_trade_no?: string;
  status?: string;
  total_amount?: number;
  currency?: string;
  pay_expire_time?: string;
  /** 托管收银台地址（pay_mode=user_pay 时返回） */
  checkout_url?: string;
  create_time?: string;
}

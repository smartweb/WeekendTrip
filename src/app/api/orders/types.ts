/**
 * 订单路由共享的输入类型（前端 → BFF）
 * 与 lib/lx/types 的服务端类型解耦，便于前端简化传参
 */
import type { IdType, PassengerType } from "@/lib/lx/types";

export type LxIdTypeAlias = IdType;

export interface LxContactInput {
  name: string;
  phone: string;
  email?: string;
}

export interface LxPassengerInfoInput {
  name: string;
  name_en?: string;
  phone: string;
  type: PassengerType;
  id_type: string;
  id_number: string;
  birthday?: string;
  gender?: 1 | 2;
}

export interface LxGuestInput {
  name: string;
  name_en?: string;
  id_type?: string;
  id_number?: string;
}

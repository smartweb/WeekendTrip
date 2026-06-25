/**
 * 种子目录数据
 *  - 出发城市：北上广深（用于机票 from_code）
 *  - 亲子热点目的地：全国精选
 *
 * 字段说明：
 *  - airportCode：机票搜索的 to_code（城市三字码）
 *  - destination：酒店搜索的目的地关键字（真实接口要求中文名/关键字）
 */

export interface OriginCity {
  code: string; // 城市三字码（机票 from_code）
  name: string;
  airports: string[];
  airportNames: Record<string, string>;
}

export interface FamilyDestination {
  id: string; // 站内 slug
  /** 机票搜索用：城市三字码 */
  airportCode: string;
  /** 酒店搜索用：目的地关键字 */
  destination: string;
  name: string;
  city: string;
  tagline: string;
  tags: string[];
  theme: [string, string];
  emoji: string;
  highlights: string[];
}

/** 出发城市（北上广深） */
export const ORIGIN_CITIES: OriginCity[] = [
  {
    code: "BJS",
    name: "北京",
    airports: ["PEK", "PKX"],
    airportNames: { PEK: "首都国际", PKX: "大兴国际" },
  },
  {
    code: "SHA",
    name: "上海",
    airports: ["SHA", "PVG"],
    airportNames: { SHA: "虹桥", PVG: "浦东国际" },
  },
  {
    code: "CAN",
    name: "广州",
    airports: ["CAN"],
    airportNames: { CAN: "白云国际" },
  },
  {
    code: "SZX",
    name: "深圳",
    airports: ["SZX"],
    airportNames: { SZX: "宝安国际" },
  },
];

/** 亲子热点目的地 */
export const FAMILY_DESTINATIONS: FamilyDestination[] = [
  {
    id: "sanya",
    airportCode: "SYX",
    destination: "三亚",
    name: "三亚",
    city: "三亚",
    tagline: "阳光沙滩，孩子的海边乐园",
    tags: ["海边", "亲子", "度假"],
    theme: ["#36b6f0", "#0ea5e9"],
    emoji: "🏖️",
    highlights: ["亚龙湾沙滩", "蜈支洲岛", "亚特兰蒂斯水世界"],
  },
  {
    id: "zhuhai",
    airportCode: "ZUH",
    destination: "珠海长隆",
    name: "珠海长隆",
    city: "珠海",
    tagline: "海洋王国，畅玩一整天",
    tags: ["乐园", "亲子", "海洋"],
    theme: ["#22c1c3", "#0d9488"],
    emoji: "🐋",
    highlights: ["长隆海洋王国", "企鹅酒店", "横琴湾"],
  },
  {
    id: "shanghai-disney",
    airportCode: "SHA",
    destination: "上海迪士尼",
    name: "上海迪士尼",
    city: "上海",
    tagline: "奇妙之旅，圆梦城堡",
    tags: ["乐园", "亲子", "童话"],
    theme: ["#7c5cff", "#6d28d9"],
    emoji: "🏰",
    highlights: ["迪士尼乐园", "玩具总动员酒店", "米奇大街"],
  },
  {
    id: "chengdu",
    airportCode: "CTU",
    destination: "成都",
    name: "成都",
    city: "成都",
    tagline: "看滚滚，吃火锅，慢生活",
    tags: ["人文", "亲子", "熊猫"],
    theme: ["#34d399", "#059669"],
    emoji: "🐼",
    highlights: ["大熊猫繁育基地", "宽窄巷子", "都江堰"],
  },
  {
    id: "hangzhou",
    airportCode: "HGH",
    destination: "杭州西湖",
    name: "杭州",
    city: "杭州",
    tagline: "西湖泛舟，宋城穿越",
    tags: ["古镇", "亲子", "自然"],
    theme: ["#5eead4", "#0f9f8e"],
    emoji: "⛵",
    highlights: ["宋城", "杭州乐园", "西湖"],
  },
  {
    id: "guangzhou",
    airportCode: "CAN",
    destination: "广州长隆",
    name: "广州",
    city: "广州",
    tagline: "长隆 + 美食，全家都开心",
    tags: ["乐园", "亲子", "美食"],
    theme: ["#fbbf24", "#f59e0b"],
    emoji: "🎢",
    highlights: ["长隆欢乐世界", "野生动物世界", "珠江夜游"],
  },
  {
    id: "xiamen",
    airportCode: "XMN",
    destination: "厦门鼓浪屿",
    name: "厦门",
    city: "厦门",
    tagline: "鼓浪屿漫步，海滨亲子",
    tags: ["海边", "古镇", "亲子"],
    theme: ["#60a5fa", "#2563eb"],
    emoji: "🏝️",
    highlights: ["鼓浪屿", "科技馆", "环岛路"],
  },
  {
    id: "guilin",
    airportCode: "KWL",
    destination: "桂林",
    name: "桂林",
    city: "桂林",
    tagline: "山水甲天下，亲近自然",
    tags: ["自然", "亲子", "山水"],
    theme: ["#4ade80", "#16a34a"],
    emoji: "⛰️",
    highlights: ["漓江竹筏", "象鼻山", "银子岩"],
  },
];

export function findDestination(id: string): FamilyDestination | undefined {
  return FAMILY_DESTINATIONS.find((d) => d.id === id);
}

export function findOrigin(code: string): OriginCity | undefined {
  return ORIGIN_CITIES.find((c) => c.code === code);
}

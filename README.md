# 周末亲子游 · 酒店+机票组合推荐（MVP）

基于**龙虾出行开放平台**构建的移动端 H5 推荐 + 预订站：用户从**北上广深**出发，浏览**全国亲子热点目的地**（三亚 / 珠海长隆 / 上海迪士尼 / 成都 / 杭州 / 广州 / 厦门 / 桂林）的「酒店 + 往返机票」亲子套餐，查看实时价格，下单并完成支付。

技术栈：**Next.js（App Router，TypeScript）+ Tailwind CSS**。前后端一体，`app/api/*` Route Handlers 充当 BFF，唯一持有 API Token，前端永不接触密钥。

---

## ⚠️ 重要：真实数据与 IP 白名单

1. **全量真实数据**：本站直接对接龙虾出行开放平台生产接口，**不使用任何 mock/假数据**。搜索（机票/酒店/房型）、下单、支付全部走真实接口。
2. **真实计费**：生产 token（`rdak_live_*`）下，下单接口（`order/create`）会产生**真实订单与真实扣费**。下单时 `pay_mode=user_pay`，接口直接返回托管收银台地址 `checkout_url`（`pay.rideclaw.com`）用于跳转支付。联调期请谨慎点击「确认下单」。
3. **IP 白名单（部署前置，非代码）**：龙虾平台要求调用方公网出口 IP 命中白名单，否则接口返回 401/403/网络错误。需在 [龙虾开放平台后台](https://open.longxiachuxing.com/) 把运行机/服务器的**公网出口 IP** 加入白名单。访问 `/api/health` 可一键自检连通性。

---

## 快速开始

```bash
# 1. 安装依赖（pnpm 或 npm 均可）
pnpm install

# 2. 配置环境变量（已内置默认值，按需修改）
#    编辑 .env.local

# 3. 启动开发服务器
pnpm dev
# 打开 http://localhost:3000 （建议用浏览器移动端模式 375px）

# 4. 生产构建
pnpm build && pnpm start

# 5. 代码检查
pnpm lint
```

### 环境变量（`.env.local`）

| 变量 | 说明 |
|---|---|
| `LX_API_TOKEN` | 龙虾开放平台 Bearer Token（`rdak_live_*`），仅服务端使用 |
| `LX_API_BASE` | 上游网关，默认 `https://api.longxiachuxing.com` |

> `.env.local` 已加入 `.gitignore`，切勿提交。

### 就绪自检

启动后访问 [`/api/health`](http://localhost:3000/api/health)，可查看 token 是否就位、网关地址、以及 IP 白名单提示。

---

## 项目结构

```
src/
├─ app/
│  ├─ page.tsx                 # 首页：出发城市切换 + 精选亲子套餐
│  ├─ home-client.tsx          # 首页逻辑（并发拉取各目的地套餐）
│  ├─ search → 通过首页 chips/卡片进入
│  ├─ package/[id]/            # 套餐详情：选往返航班 + 选酒店/房型
│  ├─ booking/                 # 填写乘机人(成人/儿童)+联系人 → 真实下单
│  ├─ orders/                  # 我的订单（localStorage 行程 → 去支付）
│  └─ api/                     # BFF（唯一持有 token）
│     ├─ health/               # 就绪自检
│     ├─ airports/             # 城市机场查询
│     ├─ flights/              # 机票搜索
│     ├─ hotels/               # 酒店搜索（强制 scene=family）
│     ├─ rooms/                # 房型/offer 详情
│     ├─ package/              # 套餐聚合（并发机票+酒店，服务端拼装）
│     ├─ orders/flight|hotel/  # 创建订单（真实下单，返回收银台 checkout_url）
│     └─ rooms/                # 房型/产品详情（用 search_offer_id）
├─ lib/
│  ├─ lx/                      # 龙虾 API 客户端（client/flight/hotel/types）
│  ├─ catalog.ts               # 出发城市 + 亲子目的地种子数据
│  ├─ package.ts               # 套餐拼装 + 定价计算
│  ├─ orders.ts                # localStorage 行程存储
│  ├─ rateLimit.ts             # 简易内存限流（保护上游 QPS）
│  └─ browserFetch.ts          # 前端调用 BFF 的封装
└─ components/                 # NavBar / PackageCard / CityPicker / TravelPicker / ui ...
```

---

## 核心设计

### 1. 套餐是「拼」出来的
龙虾 API 没有「机票+酒店」聚合接口。「亲子套餐卡」由 BFF 并发调用：
- `flight/search`（`trip_type=roundtrip`，支持 `passengers.child` 儿童票）
- `hotel/search`（`scene=family`，默认 `has_child_facility=true` 亲子设施过滤）

服务端取**最便宜往返 + 最便宜亲子酒店**，组装出「套餐总价 = 往返机票(成人+儿童) + 酒店总价(N 晚)」。详见 `lib/package.ts`。

### 2. 下单拆成两笔订单
一次「套餐预订」实际创建 **1 笔机票订单 + 1 笔酒店订单**（`order/create` 用 `pay_mode=user_pay`，直接返回托管收银台 `checkout_url`，下单页跳转收银台完成支付）。MVP 不引入数据库，用浏览器 localStorage 里的「行程(trip)」把两个 `platform_order_id` 关联，「我的订单」页据此展示。

### 3. 安全与风控
- Token 仅存在于服务端 `process.env`，所有外部请求经 BFF。
- BFF 做参数校验、错误码归一、简易限流（搜索 20 QPS、订单 3 QPS/秒，保护上游 5 QPS 限制）。
- 下单页显著提示「真实订单、真实扣费」，乘机人校验（成人证件号必填、儿童出生日期必填）。

---

## 移动端 H5 体验

- 375px 设计、安全区适配、触底固定操作栏
- 出发城市、出行日期、人数用底部弹层（ActionSheet），避免原生 select
- 套餐卡：目的地封面渐变 + 标签 + 「2大1小 ¥X,XXX 起」
- 骨架屏加载、淡入动画、轻量按压反馈

---

## API 文档

详见 [https://docs.longxiachuxing.com/](https://docs.longxiachuxing.com/) 。

---

## 后续可演进

- 引入数据库持久化订单与用户，替代 localStorage
- 接入 `order` 状态查询接口，订单页展示真实状态轮询
- 套餐智能排序（按评分/距离/亲子设施丰富度）
- 接入登录态、优惠券、退改规则展示

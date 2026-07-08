# ZroImg Frontend

这是 `ZroImg` 的前端仓库，定位是一个基于 Next.js App Router 的 SSR 前端项目，服务于图片生成 / 视频生成 / 积分购买 / 订单管理 / 用户反馈 / 管理后台这条产品闭环。

当前架构已经按“前后端分离”方向调整：

- 前端仓库负责页面渲染、交互、同源 BFF 路由、登录态读取、基础协议转换。
- Java 后端负责真实业务：用户、验证码、邮件、订单、积分、生成任务、支付回调、对象存储、运营配置。
- 在 Java 后端尚未完全接入前，前端保留了一层 mock BFF，保证页面可以继续开发和联调。

## 1. 项目目标

这个仓库不是纯展示官网，也不是临时原型。它的目标是承接真实业务前端，包括：

- 游客访问：首页、定价、文档、登录、注册。
- 用户访问：概览、开始创作、创作历史、收藏合集、积分购买、我的订单、意见反馈、账户设置。
- 管理员访问：管理后台、用户管理、订单管理、任务管理、文档配置、系统配置。
- 技术职责：SSR 首屏、前端交互、BFF 转发、接口封装、样式规范、前后端联调。

## 2. 当前技术栈

- `Next.js 16`：App Router、SSR、Route Handlers。
- `React 19`：页面与交互组件。
- `TypeScript`：唯一业务开发语言。
- `Tailwind CSS 4`：基础原子样式能力。
- `CSS Modules`：页面和业务组件的局部样式。
- `React Query`：适合后续接入更复杂的客户端异步状态。
- `Zod`：接口入参和前端数据结构约束。
- `Lucide React`：图标系统。

当前仓库没有接入真实数据库，也不直接承载真实支付、真实 OSS、真实验证码发信。那部分会由 Java 后端负责。

## 3. 启动方式

### 3.1 安装依赖

```bash
pnpm install
```

### 3.2 启动开发环境

```bash
pnpm dev
```

默认访问地址：

```text
http://localhost:3000
```

### 3.3 构建生产包

```bash
pnpm build
pnpm start
```

### 3.4 代码校验

```bash
pnpm lint
```

## 4. 环境变量

项目当前仅保留一个后端联调环境变量：

```bash
JAVA_API_BASE_URL=
```

示例：

```bash
JAVA_API_BASE_URL=https://api-dev.zroimg.com
```

说明：

- 未配置时：前端优先走本地 mock BFF。
- 已配置时：部分接口会由 Next.js Route Handlers 转发到 Java 后端。
- 这个变量属于服务端变量，不要写进 `NEXT_PUBLIC_*`。

建议新建 `.env.local`：

```bash
cp .env.example .env.local
```

然后补上：

```bash
JAVA_API_BASE_URL=https://api-dev.zroimg.com
```

## 5. 目录结构

当前项目按“页面层 / 业务层 / 接口层 / BFF 层 / 类型层 / 样式层”拆分。

```text
src/
  app/                 Next.js 页面、布局、Route Handlers
  api/                 前端接口调用层，只写请求方法
  components/          可复用组件
    layout/            导航、外壳、站点级布局组件
    ui/                通用 UI 组件
  features/            按业务域拆分的页面组件和交互
  hooks/               全局复用 hooks
  server/              前端服务端逻辑与 BFF
    bff/               面向页面的服务层
  style/               全局样式、设计令牌、公共样式
  types/               共享业务类型
  utils/               request.ts 和纯工具函数
public/
  assets/              静态资源
mock/                  前端页面和 UI 联调用 mock 数据
```

## 6. 各目录职责

### `src/app`

放 Next.js 页面、布局和 Route Handlers。

包括：

- 页面：`page.tsx`
- 布局：`layout.tsx`
- 局部页面样式：`*.module.css`
- BFF 路由：`src/app/api/**`

规则：

- 页面优先做数据组织和结构拼装。
- 不把复杂业务请求直接散落在页面里。
- 不把大量复用交互逻辑堆到 `page.tsx`。

### `src/api`

只放前端接口定义，不放页面逻辑。

当前按业务域拆分：

- `src/api/auth`：登录、注册、验证码、滑块校验。
- `src/api/account`：账户资料、修改密码。
- `src/api/generation`：会话、任务、收藏、画廊。
- `src/api/orders`：订单与积分购买。
- `src/api/rewards`：签到奖励。
- `src/api/support`：意见反馈。
- `src/api/admin`：后台设置、文档、用户管理。

规则：

- 这里只写请求函数，例如 `fetchProfile()`、`createOrder()`。
- 每个文件统一写法：先定义 `function`，文件末尾再导出一个 `xxxApi` 对象。
- 不写 `toast`、弹窗、跳转、组件状态。
- 不写完整后端域名，只写同源路径，例如 `/api/orders`。
- 统一通过 `src/utils/request.ts` 发请求。
- 请求入参和返回值类型统一从 `src/types` 引入。
- 统一从具体业务文件导入，例如 `@/api/admin/settings`、`@/api/generation/tasks`。
- 不额外建立 `index.ts` barrel，避免隐藏接口来源和重复维护导出。
- `src/api` 不做类型转导；组件需要类型时，直接从 `src/types` 引入。

推荐示例：

```ts
import { request } from "@/utils/request";
import type {
  UpdateAccountPasswordRequest,
  UpdateAccountPasswordResponse,
  UpdateAccountProfileRequest,
  UpdateAccountProfileResponse,
} from "@/types/account";

function updateProfile(data: UpdateAccountProfileRequest) {
  return request<UpdateAccountProfileResponse>({
    url: "/api/account/profile",
    method: "POST",
    body: data,
  });
}

function updatePassword(data: UpdateAccountPasswordRequest) {
  return request<UpdateAccountPasswordResponse>({
    url: "/api/account/password",
    method: "POST",
    data,
  });
}

export const accountApi = {
  updateProfile,
  updatePassword,
};
```

注意：

- `src/api/**` 是浏览器侧的请求封装层，适合按上面的写法统一。
- `src/app/api/**` 是 Next.js Route Handlers，必须继续导出 `GET`、`POST`、`PATCH` 这类服务端路由函数，不能改成 `request(...)` 包装形式。

### `src/hooks`

放全局复用 hooks。页面私有 hook 留在页面或业务目录内，不要为了“看起来统一”提前搬到全局。

规则：

- 超过 2 个页面复用，再进入 `src/hooks`。
- 含接口请求的 hook，统一后缀 `Service`，返回值优先对象。
- 通用 service hook 统一返回 `{ run, loading, status, data, error, reset }`。
- hook 不直接弹全局消息、不直接跳转，除非名字明确体现这个副作用。
- 轮询、监听、定时器、浏览器事件必须在 hook 内清理。
- 同类 hook 使用统一字段名，例如 `loading`、`error`、`run`。

当前公共 hook：

- `useService`：封装异步服务调用状态，适合后续给业务 service hook 复用。

### `src/components`

放可复用组件。

- `src/components/layout`：导航、应用壳、管理后台壳、顶部栏、主题控件。
- `src/components/ui`：下拉框、统计卡片等通用 UI。

规则：

- `layout` 放结构型组件。
- `ui` 放业务无关的通用组件。
- 组件样式复杂时，样式文件跟组件放同目录。

### `src/features`

按业务域拆分页面组件。

当前包括：

- `auth`
- `billing`
- `dashboard`
- `gallery`
- `generation`
- `history`
- `landing`
- `settings`
- `tickets`
- `admin`

规则：

- 页面专属但又不适合直接放 `app` 的交互，放在 `features`。
- 尽量一个业务域一个目录。
- 不跨域堆大杂烩组件。

### `src/server`

这是前端仓库中的“服务端辅助层”，不是 Java 业务后端本体。

当前主要职责：

- `auth.ts`：SSR 读登录态、Cookie、权限守卫。
- `env.ts`：读取服务端环境变量。
- `java-api.ts`：统一请求 Java 后端。
- `http.ts`：请求辅助逻辑。
- `bff/*.ts`：给页面和 Route Handlers 使用的服务 facade。
- `bff/internal/*`：当前 mock 实现。
- `bff/mock-store.ts`、`bff/mock-db.ts`：本地 mock 数据。

规则：

- 这里只放前端 SSR / BFF 需要的服务端代码。
- 不把浏览器逻辑写进这里。
- Java 后端接入后，优先替换 `bff/internal/*` 与 mock 数据，不动页面层。

### `src/types`

放跨页面、跨模块复用的业务类型。

当前已经拆出的类型包括：

- `account.ts`
- `admin.ts`
- `api.ts`
- `auth.ts`
- `checkin.ts`
- `content.ts`
- `feedback.ts`
- `generation.ts`
- `index.ts`
- `orders.ts`

规则：

- 共享类型优先放这里。
- 不要让 `features` 直接依赖 `server` 里的类型定义。
- 页面本地独有类型，保留在就近文件即可。

### `src/utils`

放纯工具，不放页面逻辑。

当前包括：

- `request.ts`：统一请求封装。
- `credits.ts`
- `feedback.ts`
- `local-generation.ts`

规则：

- 保持无 UI 副作用。
- 适合复用的纯函数和工具放这里。
- `request.ts` 支持请求拦截器、错误拦截器和 `ApiRequestError`，页面可以继续用普通 `try/catch`，需要精细判断时再读 `status`、`code`、`payload`。

### `src/style`

放全局样式资源，只保留真正跨页面复用的全局样式。

当前结构建议固定为：

- `index.css`：唯一全局入口，负责引入 Tailwind 和其余样式文件。
- `tokens.css`：设计令牌、颜色、字体、阴影变量。
- `base.css`：浏览器基础样式、`html/body`、全局过渡。
- `utilities.css`：工具类，例如滚动条隐藏、背景纹理、阴影、字体工具类。
- `components/`：可复用视觉组件样式，例如按钮、表单、surface、导航、标题。

规则：

- 不再继续往 `common.css`、`media.css`、`mixins.css` 这类大杂烩文件里堆内容。
- 变量只放 `tokens.css`。
- 浏览器和页面基础只放 `base.css`。
- 工具类只放 `utilities.css`。
- 可复用视觉组件类统一放 `src/style/components/*`。
- 页面或业务专属样式继续放各自目录下的 `*.module.css`，不要写回全局样式目录。

### `mock`

放前端页面、UI 走查和联调用 mock 数据，按业务域拆分。

规则：

- 这里只放模拟数据和说明文档，不放真实用户、真实订单、真实密钥。
- 当前运行态 mock 仍由 `src/server/bff/**` 承接，后续可以逐步统一读取这里的数据。
- 新增页面级 mock 时优先按业务域追加到现有文件，避免一个页面一个零散文件。

## 7. 页面与组件分层规范

项目使用 App Router，页面和交互边界要明确。

### 页面层

页面默认优先 SSR。

适合放在 Server Component 的内容：

- 首屏数据读取
- 权限判断
- 路由跳转
- 页面结构
- SEO 文案

### Client Component

只有这些交互才使用 `"use client"`：

- 表单输入
- 上传
- 弹窗
- 下拉框
- 轮询
- 滑块验证码
- 本地浏览器设置
- 主题切换

### 明确禁止

在服务端渲染阶段不要直接使用：

- `window`
- `document`
- `localStorage`
- `indexedDB`
- `navigator`
- 渲染期的 `Math.random()`
- 渲染期的 `Date.now()`

否则容易出现 hydration 不一致。

## 8. 接口规范

### 前端请求层规范

所有客户端请求统一走：

- `src/api/**`
- `src/utils/request.ts`

不要在 `features` 或 `components` 里到处手写零散 `fetch("/api/...")`。

标准写法示例：

```ts
import { request } from "@/utils/request";
import type { CreateOrderRequest, CreateOrderResponse } from "@/types/orders";

function createOrder(data: CreateOrderRequest) {
  return request<CreateOrderResponse>({
    url: "/api/orders",
    method: "POST",
    data,
  });
}

export const ordersApi = {
  createOrder,
};
```

### BFF 规范

`src/app/api/**` 只做这些事情：

- 读取 Cookie / 会话
- 鉴权
- 转发到 Java 后端
- 把前端字段格式转换成后端需要的格式
- Java 后端未接入时回退到 mock

不要在 Route Handler 里长期堆复杂业务逻辑。

## 9. Java 后端接入规范

这个前端仓库已经为 Java 联调预留了一层 BFF 和 mock 回退。

当前接入思路：

1. 前端页面继续调用同源 `/api/**`。
2. `src/app/api/**` 根据情况：
   - 转发到 Java 后端。
   - 或走 `src/server/bff/*`。
3. `src/server/java-api.ts` 负责统一拼接 `JAVA_API_BASE_URL`、透传请求头、返回标准响应。
4. Java 后端稳定后，再逐步移除 mock store。

这样做的好处：

- 前端页面不需要直接感知 Java 域名。
- 本地开发和联调环境切换更轻。
- 后端接口演进时，页面改动更少。

## 10. UI 与样式规范

整体视觉方向是克制、工具化、偏 KoImg 风格，不做模板味很重的 SaaS 页面。

### 视觉原则

- 白底、黑字、细边框。
- 少阴影，尽量不用悬浮大投影。
- 避免大面积渐变、玻璃拟态、紫色科技风。
- 大标题可以用 serif，工具区和表单用 sans。
- 组件尺寸偏紧凑，不做过大的按钮和输入框。

### 样式组织规则

- 页面私有样式：放当前目录 `*.module.css`。
- 业务组件私有样式：跟组件同目录。
- 全局令牌和基础类：放 `src/style/*.css`。
- 不要把页面专属类写进全局样式文件。

### 命名规则

CSS Module 建议使用接近 BEM 的命名方式，例如：

- `docs`
- `docs__sidebar`
- `docs__nav`
- `docs__navLink`
- `docs__navLinkActive`

## 11. 代码规范

### 基本原则

- 先保证业务代码清楚，再考虑抽象。
- 优先 happy path。
- 复杂条件先拆成有语义的变量。
- 普通页面逻辑不要过度防御。
- 安全敏感边界再加必要保护。

### 推荐写法

- 顺序型控制流。
- 清晰变量名。
- 一个函数只做一件主要的事。
- 组件 props 尽量语义化。

### 不推荐写法

- 页面里塞很长的业务逻辑。
- 多层嵌套 `try/catch`。
- 到处复制相同请求代码。
- 组件和接口层互相耦合。
- 一个样式文件服务多个完全无关页面。

## 12. mock 说明

当前项目仍保留一套 mock 数据和 mock BFF，目的是在 Java 后端未完成前继续开发前端。

mock 代码主要在：

- `src/server/bff/internal/*`
- `src/server/bff/mock-store.ts`
- `src/server/bff/mock-db.ts`
- `src/app/api/**`

这些 mock 的作用：

- 支撑登录注册演示
- 支撑订单、签到、反馈、生成记录等前端页面
- 作为后端接口未联通时的本地兜底

后续 Java 后端完成后，优先替换的是 mock 实现，不是页面结构。

## 13. 当前建议的开发流程

### 新增页面

1. 先在 `src/app` 建页面路由。
2. 复杂交互拆到 `src/features/<domain>`。
3. 样式用同目录 `*.module.css`。
4. 数据请求放 `src/api/<domain>`。
5. SSR 数据通过 `src/server/bff/*` 或 Route Handler 获取。

### 新增接口联调

1. 先确定前端调用路径是否统一走 `/api/**`。
2. 在 `src/types` 新增请求入参和响应类型。
3. 在 `src/api/<domain>` 新增请求函数；如果该业务域有多个接口文件，再从该业务域 `index.ts` 导出。
4. 在 `src/app/api` 新增或调整 Route Handler。
5. Java 后端联通后，替换 `src/server/bff/internal/*` 的 mock 实现。

### 新增共享类型

1. 判断是否跨模块复用。
2. 如果复用，放进 `src/types`。
3. 如果仅页面本地使用，就近定义。

## 14. 后续可继续整理的方向

当前目录已经比之前清楚很多，但仍有几项可以继续整理：

- 把 `src/app/layout.tsx` 中的样式导入路径与实际 `src/style` 目录彻底统一。
- 继续把零散业务类型抽到 `src/types`。
- Java 后端联通后，逐步清空 mock store。
- 对 `src/app/api/**` 做更统一的返回结构封装。
- 增加更明确的错误码约定和联调文档。

## 15. 当前仓库里哪些文件是关键文件

优先了解这些文件：

- `README.md`
- `AGENTS.md`
- `package.json`
- `src/app/layout.tsx`
- `src/utils/request.ts`
- `src/server/java-api.ts`
- `src/server/auth.ts`
- `src/server/bff/*`
- `src/components/layout/*`
- `src/api/*`

## 16. 文档约定

仓库根目录只保留一个面向开发者的主文档：`README.md`。

如果后续还要补充说明，优先追加到 `README.md` 对应章节，不再额外新增一份平行规范文档，避免规范和实现长期漂移。

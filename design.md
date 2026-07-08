# ZroImg 设计文档

## 1. 产品定位

ZroImg 是一个图片生成 SaaS 网站，面向创作者、小团队和需要批量产出视觉素材的运营人员。

这个产品不是单纯的展示站，也不是玩具 Demo。它要像一个真实可用的工具：

- 用户可以注册、登录、购买积分、生成图片、查看历史、管理账户。
- 管理员可以配置生图服务、查看用户、订单、任务和审计日志。
- 积分、订单、图片资产、生成任务都以后端数据库和私有存储为准。
- 界面优先表达功能状态，而不是堆砌营销文案。

设计上的核心目标是：看起来像一个成熟、克制、可信的创作工具，而不是“AI 生成的 SaaS 模板”。

## 2. 风格参考

主要参考站点：

- https://koimg.com/zh
- https://koimg.com/zh/create

参考原则：

- 只参考字体气质、布局节奏、颜色体系和组件克制度。
- 不复制对方源码。
- 不复制对方素材、图标、文案和完整页面结构。
- 我们的页面必须服务自己的业务闭环：积分购买、图片生成、生成历史、后台配置。

观察到的风格特点：

- 黑白灰为主，颜色非常克制。
- 白底、细边框、少阴影。
- 品牌字和大标题使用 serif 字体，有一点编辑感。
- 普通 UI 使用 sans 字体，清晰、紧凑。
- 顶部导航高度固定，结构简单。
- 按钮和卡片圆角较小，主要是 `rounded-md` 到 `rounded-xl`。
- 页面不像“炫技型 AI 官网”，更像“文档站 + 工具后台”。

## 3. 设计目标

界面要传达这些感觉：

- 可信：积分、订单、API 密钥和图片资产都由服务端管理。
- 清楚：用户一眼知道下一步该做什么。
- 克制：少渐变，少大阴影，少花哨动画。
- 可售卖：购买积分、生成图片、查看历史、后台管理这些商业闭环必须清晰。
- 可扩展：后续增加收藏、工单、公开画廊、任务详情时，风格能自然延展。

不应该出现的东西：

- 没有真实数据支撑的大型假画廊。
- 大量紫色、蓝紫渐变、玻璃拟态、发光圆球。
- “释放想象力”“点亮创意宇宙”这类泛 AI 文案。
- 把未完成的功能包装成已经可用。
- 主要流程依赖浏览器本地历史或 `localStorage`。

## 4. 字体规范

当前字体策略在 `src/app/globals.css` 中定义。

字体栈：

- Sans：`Inter`、`Noto Sans SC`、`PingFang SC`、系统 sans。
- Serif：`Playfair Display`、`Georgia`、`Times New Roman`、中文宋体兜底。
- Mono：`SFMono-Regular`、`Consolas`、`Liberation Mono`。

使用规则：

- 品牌名 `ZroImg` 使用 serif，中等字重。
- 首页大标题、页面主标题使用 serif，中等字重。
- 导航、表单、按钮、表格、说明文字使用 sans。
- 普通 UI 尽量不用 `font-black`。
- 常规重点用 `font-medium` 或 `font-semibold`。
- 数据数字可以使用 serif，让界面更接近 KoImg 的编辑感。

## 5. 颜色规范

核心颜色变量在 `src/app/globals.css` 中。

浅色模式：

- `--background`: `#ffffff`
- `--foreground`: `#0a0a0a`
- `--panel`: `#ffffff`
- `--soft`: `#f5f5f5`
- `--line`: `#e5e5e5`
- `--muted`: `#737373`
- `--accent`: `#0a0a0a`

深色模式：

- `--background`: `#0a0a0a`
- `--foreground`: `#fafafa`
- `--panel`: `#0a0a0a`
- `--soft`: `#1a1a1a`
- `--line`: `#262626`
- `--muted`: `#a3a3a3`
- `--accent`: `#fafafa`

使用规则：

- 主按钮使用黑底白字，深色模式反过来。
- 次按钮使用白底、细边框。
- 卡片使用白底或 `panel`，靠细边框区分层级。
- `soft` 用于卡片内部的轻背景。
- 状态色只在必要时使用，比如失败、警告、成功。
- 默认不使用紫色、蓝紫渐变。

## 6. 布局规范

### 顶部导航

实现文件：

- `src/components/product-top-nav.tsx`

结构：

- 顶部固定。
- 高度约 64px。
- 底部细边框。
- 背景使用 `background/80` 加轻微 blur。
- 左侧是 serif 品牌字。
- 中间是主要导航：开始创作、作品画廊、定价、文档。
- 右侧是语言切换、明暗切换、头像或登录入口。

设计要求：

- 不放复杂 logo 图形。
- 不加厚重阴影。
- 不做大胶囊按钮。
- 导航链接保持紧凑。

### 应用内布局

实现文件：

- `src/components/app-shell.tsx`

结构：

- 桌面端：左侧栏 `17rem`，右侧主内容自适应。
- 移动端：侧栏变成横向滚动导航。
- 不做右侧目录。
- 不做悬浮大卡片式侧边栏。

左侧导航固定入口：

- 概览：`/dashboard`
- 创作历史：`/history`
- 收藏合集：`/favorites`
- 积分购买：`/credits`
- 我的订单：`/billing`
- 工单：`/tickets`
- 账户设置：`/settings`

设计要求：

- 左侧栏像文档/工具导航。
- 当前项使用浅灰背景。
- 图标只做辅助，不喧宾夺主。
- 入口说明文字只在桌面端显示。

## 7. 组件规范

### 按钮

主按钮：

- 黑底白字。
- `rounded-md`。
- 高度约 40px。
- 文字使用 `text-sm font-medium`。
- 不加大阴影。

次按钮：

- 白底。
- 细边框。
- hover 时变成浅灰背景。

避免：

- 默认使用大胶囊按钮。
- 使用强烈发光阴影。
- 一个页面出现太多主按钮。

### 卡片

推荐写法：

- `surface rounded-xl p-5`

规则：

- 用边框建立层级。
- 少用阴影。
- 内部次级区域可以使用 `bg-soft`。
- 卡片不宜过度嵌套。

### 表单

推荐类名：

- 输入框：`.field`
- 标签：`.label`

规则：

- 标签短而明确，比如：提示词、尺寸、质量、张数。
- 中文核心界面不要夹太多英文标签。
- 上传区必须说明数量限制和格式限制。
- 表单状态要直接，比如：正在提交、上传失败、任务已创建。

### 标签和状态

规则：

- 使用 `rounded-md`。
- 文案短。
- 颜色克制。

任务状态建议：

- 排队中
- 生成中
- 已完成
- 失败

### 图标

规则：

- 使用 Lucide 图标。
- 默认尺寸 14-18px。
- 空状态可以用 20-24px。
- 图标只辅助识别，不能替代文字。

## 8. 页面设计说明

### 首页

实现文件：

- `src/features/landing/landing-page.tsx`

目标：

- 说明产品价值。
- 引导用户开始创作、查看定价、阅读文档。
- 展示真实 SaaS 闭环：注册、积分、生成、历史、存储、后台。

设计规则：

- 使用 serif 大标题。
- 顶部小标签用细边框。
- 产品预览要克制，不做夸张光效。
- 桌面端保留左侧文档式目录。
- 文案要偏产品说明，不要像广告词。

### 开始创作

实现文件：

- `src/app/generate/page.tsx`
- `src/features/generation/generate-form.tsx`

目标：

- 这是用户最重要的创作入口。

核心信息：

- 当前积分余额。
- 提示词输入。
- 文本生图 / 参考图编辑。
- 尺寸、质量、张数。
- 参考图上传。
- 遮罩图上传。
- 提交生成任务。

设计规则：

- 外层页面是 Server Component，负责读取登录用户和积分。
- 表单是 Client Component，因为需要输入状态、上传和请求接口。
- 不在前端暴露生图密钥。
- 不让用户直连 OSS。
- 创建任务后进入队列，失败自动退款的规则要让用户看得懂。

### 概览

实现文件：

- `src/app/dashboard/page.tsx`

目标：

- 作为用户登录后的工作台首页。

展示内容：

- 积分余额。
- 生成任务数量。
- 已完成作品数量。
- 订单数量。
- 今日生成数量。
- 最近任务。

设计规则：

- 数据必须来自数据库。
- 不堆大段欢迎文案。
- 最近任务要显示 prompt、模式、尺寸、状态和消耗积分。

### 创作历史

实现文件：

- `src/app/history/page.tsx`

目标：

- 展示用户所有生成任务和输出图片。

设计规则：

- 图片 URL 由服务端生成短时签名 URL。
- 任务状态清晰可见。
- 空状态引导用户去开始创作。
- “再次编辑”“设为参考图”先作为入口，后续要接真实预填逻辑。

### 积分购买

实现文件：

- `src/app/credits/page.tsx`
- `src/features/billing/order-form.tsx`

目标：

- 用户在这里选择积分包并创建支付订单。

设计规则：

- 页面只负责购买积分，不展示完整订单列表。
- 支付成功后的积分发放以后端异步回调为准。
- 前端跳转页不能作为发放积分依据。
- 当前余额、可购买套餐、待支付订单可以作为辅助信息展示。

### 我的订单

实现文件：

- `src/app/billing/page.tsx`

目标：

- 用户查看积分购买订单记录。

设计规则：

- 订单要显示状态。
- 不在这个页面放购买表单。
- 不在这个页面混入积分流水。

### 收藏合集

实现文件：

- `src/app/favorites/page.tsx`

当前状态：

- 页面入口已完成。
- 还没有收藏数据模型。

后续设计：

- 新增收藏合集表。
- 支持从历史作品收藏图片。
- 支持按项目、客户或风格归档。

### 工单

实现文件：

- `src/app/tickets/page.tsx`

当前状态：

- 页面入口已完成。
- 还没有工单数据模型。

后续设计：

- 新增工单表。
- 用户可以提交问题。
- 管理员可以回复。
- 工单可以关联订单号、任务 ID 或图片资产。

### 账户设置

实现文件：

- `src/app/settings/page.tsx`

目标：

- 展示账户资料、邮箱、角色、状态和积分。

设计规则：

- 普通用户不配置 OpenAI 密钥。
- 生图 URL、模型名、密钥只在管理员后台配置。
- 后续可增加修改用户名、修改密码、登录设备、二次验证等。

## 9. SSR 与客户端边界

默认规则：

- `page.tsx` 和 `layout.tsx` 默认使用 Server Component。
- 数据库读取在服务端完成。
- 密钥、支付配置、OSS 配置只在服务端使用。

允许使用 Client Component 的场景：

- 登录表单。
- 注册表单。
- 明暗模式切换。
- 语言切换。
- 生成表单。
- 上传组件。
- 任务轮询。
- 支付触发。

Server Component 渲染阶段禁止访问：

- `window`
- `document`
- `localStorage`
- `indexedDB`
- `navigator`

也要避免：

- 直接用 `Date.now()` 生成可见内容。
- 直接用 `Math.random()` 生成可见内容。
- 服务端和客户端格式化日期不一致导致 hydration mismatch。

## 10. 当前相关文件

核心设计与布局：

- `src/app/globals.css`
- `src/components/product-top-nav.tsx`
- `src/components/app-shell.tsx`
- `src/components/nav.tsx`
- `src/features/theme/theme-controls.tsx`

用户页面：

- `src/features/landing/landing-page.tsx`
- `src/app/dashboard/page.tsx`
- `src/app/generate/page.tsx`
- `src/app/history/page.tsx`
- `src/app/credits/page.tsx`
- `src/app/billing/page.tsx`
- `src/app/favorites/page.tsx`
- `src/app/tickets/page.tsx`
- `src/app/settings/page.tsx`

业务组件：

- `src/features/generation/generate-form.tsx`
- `src/features/billing/order-form.tsx`
- `src/features/history/task-poller.tsx`

## 11. 设计验收清单

每次做 UI 改动后建议运行：

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

基础检查：

- 首页能正常打开。
- 未登录访问 `/generate`、`/dashboard`、`/history`、`/credits`、`/billing` 会跳转登录。
- 没有 React hydration warning。
- 没有未使用 import。
- 没有把假数据包装成真实状态。
- 没有重新引入大面积紫色渐变和厚重光效。

人工视觉检查：

- 顶部导航在桌面和移动端都可用。
- 左侧导航不遮挡主内容。
- 生成表单在手机上能完整操作。
- 深色模式文字对比度足够。
- 空状态文案清楚，不像广告。

## 12. 下一步设计任务

建议后续按这个顺序继续完善：

- 给生成表单增加费用预估，提交前显示预计扣除积分。
- 给历史页增加任务详情页。
- 给历史页的“再次编辑”“设为参考图”接入真实预填逻辑。
- 给概览页最近任务加真实缩略图。
- 增加收藏合集数据模型和收藏动作。
- 增加工单数据模型和管理员回复页面。
- 增加公开分享页或作品画廊。
- 管理员后台也做一轮同风格改造，避免用户端和后台风格割裂。

# ZroImg Frontend

ZroImg 是基于 Next.js App Router 的图片生成 SaaS 前端，覆盖游客页面、用户创作流程、积分与订单、反馈工单和管理后台。

这个仓库负责：

- Server Components 页面渲染（公开页需要 SEO）。
- 浏览器交互，直接请求 Java 接口。
- SSR 登录态判断和页面级跳转。

Java 后端负责真实用户、会话、验证码、参数校验、登录限流、权限、生成任务、积分、订单、支付、对象存储和运营配置。前端没有接口转发层，不得成为这些数据的最终权威来源。

请求链路：

```text
页面  浏览器 -> nginx -> Next.js（服务端直连 Java 内网地址渲染 HTML）
接口  浏览器 -> nginx /api/* -> Java（去掉 /api 前缀，不经过 Next）
```

## 1. 技术栈

- Next.js 16.2，App Router、Server Components。
- React 19.2。
- TypeScript 严格模式。
- Tailwind CSS 4 和 CSS Modules。
- Lucide React，统一图标来源。
- clsx，统一条件 class 拼接。
- next-intl 4，用户端多语言（zh-CN 默认、en、ru）。
- pnpm 11，唯一包管理器；具体版本由 `package.json` 的 `packageManager` 固定。

修改 Next.js API、路由、缓存或文件约定前，必须先阅读当前安装版本位于 `node_modules/next/dist/docs/` 的对应指南。

## 2. 本地开发

```bash
corepack enable
pnpm install
cp .env.example .env.local
pnpm dev
```

默认地址：`http://localhost:3000`。

常用命令：

```bash
pnpm lint          # ESLint
pnpm typecheck     # Next.js 路由类型 + TypeScript
pnpm test          # Node.js 内建单元测试
pnpm format:check  # Prettier 检查
pnpm i18n:check    # 翻译文件结构检查（缺失翻译只警告）
pnpm build         # 生产构建
pnpm audit:prod    # 生产依赖安全审计
pnpm check         # 提交前完整校验
```

CI 位于 `.github/workflows/ci.yml`，Pull Request 和 `main`、`dev` 分支推送必须通过同样的质量门禁。

## 3. 环境与接口路由

```dotenv
JAVA_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=https://zroimg.com
```

- `NEXT_PUBLIC_SITE_URL` 是站点对外地址，用于 canonical、hreflang、sitemap 和 OpenGraph；不填默认 `https://zroimg.com`，测试环境需要改成测试域名。

- `JAVA_API_BASE_URL` 只供 Next 服务端渲染调用 Java；生产环境填 Java 的内网地址，不填公网域名。
- 浏览器接口一律写成 `/api/<Java 路径>`，例如 `/api/auth/user/me`。生产由 nginx 去掉 `/api` 前缀转发给 Java（见 `deploy/nginx.prod.conf.example`）；`pnpm dev` 时由 `next.config.ts` 的 rewrites 做同样的转发。
- `src/app` 下不新增 Route Handler，接口能力一律加在 Java。
- Java 请求失败必须返回明确的错误，禁止静默回退到本地数据。
- 服务端变量禁止使用 `NEXT_PUBLIC_*` 前缀。
- 视频页只有在后台“模型配置”中配置并启用视频模型后才具备实际生成能力；`VIDEO_*` 仅保留给历史视频任务兼容使用。

## 4. 国际化与 SEO

详细规范：[docs/i18n.md](docs/i18n.md)、[docs/seo.md](docs/seo.md)。硬性规则：

- 用户端代码（`src/app/[locale]/**`、`src/features/**`、`src/components/**`、`src/utils/**` 中会展示给用户的文本）**不写死任何用户可见字符串**，包括 `aria-label`、`title`、`alt`、`placeholder`、toast 和校验提示；全部放进 `messages/zh-CN/<namespace>.json`（按命名空间拆分，`pnpm i18n:build` 合并），en/ru 保持相同 key。Server Component 用 `getTranslations`，Client Component 用 `useTranslations`。
- key 是 camelCase 语义名（`generate.prompt.placeholder`），不用中文原文做 key；变量、复数用 ICU，不拼接字符串。
- 站内跳转一律从 `@/i18n/navigation` 导入 `Link`、`redirect`、`useRouter`、`usePathname`，写不带语言前缀的路径。
- 日期、数字、金额用 next-intl 格式化器（共享格式在 `src/i18n/formats.ts`）；Java 的 `LocalDateTime` 先用 `parseJavaDateTime` 解析（北京时间）。
- 每个公开页面导出 `generateMetadata` 并使用 `buildMetadata`（`src/lib/seo.ts`），路径登记到 `src/lib/site-routes.ts`；登录后的页面和认证页不收录。
- 按钮和导航不设固定宽度，长文案（俄文）要能换行或省略。
- 例外：后台 `/admin` 与 `src/features/admin/**` 只有中文，可以直接写中文，继续用 `next/link`。
- `pnpm i18n:check` 检查翻译结构（已包含在 `pnpm check` 中）。

## 5. 目录结构

```text
messages/              <locale>/<namespace>.json 源文件；<locale>.json 为合并生成文件
docs/                  i18n.md、seo.md
scripts/               check-i18n.mjs
src/
  proxy.ts             语言协商（next-intl），排除 /api、/admin、静态文件
  app/
    [locale]/          用户端全部页面（(product) 应用页、(auth) 认证页、公开页）
    admin/             后台（独立根布局，只有中文）
    sitemap.ts、robots.ts、global-not-found.tsx
  i18n/                路由、导航、请求配置、格式、文案回退
  api/                 浏览器请求 Java 的函数
  components/
    layout/            页面壳、导航和账户菜单
    ui/                业务无关 UI
  features/            按业务域组织的交互组件
    canvas/            无限画布编辑器（React Flow）和局部重绘遮罩（Konva）
  lib/                 seo.ts（buildMetadata）、structured-data.ts（JSON-LD）、site-routes.ts
  server/
    auth.ts            SSR 会话入口
    env.ts             服务端环境配置
    java-api.ts        Server Component 调用 Java
  style/               全局令牌、基础样式和公共组件样式
  types/               跨模块业务契约
  utils/               无 UI 副作用的纯函数
tests/                 纯业务规则单元测试
public/assets/         实际被页面引用的静态资源
```

不要为了目录对称创建空层、barrel 或“以后可能用到”的 helper。文件没有消费者时直接删除。

## 6. 模块边界

### `src/app`

- 页面默认是 Server Component。
- 页面负责鉴权、首屏数据组织和结构拼装，不承载长业务流程。
- 页面通过 `requestJava<T>(javaPath, { params })` 读取数据，路径是 Java 原始路径（不带 `/api`），当前请求的 Cookie 会自动透传。
- 只关心是否登录时用 `getCurrentUser()`；需要登录用 `requireUser()`，需要管理员用 `requireAdmin()`。
- Java 对不存在的资源可能返回 400，详情页按需转成 `notFound()`。
- 注册规范地址是 `/register`；`/signup`（及 `/en/signup`、`/ru/signup`）只在 `next.config.ts` 保留 308 兼容重定向，不维护第二份页面。
- 用户端路由放在 `src/app/[locale]/` 下；后台在 `src/app/admin/`。两个根布局共用 `components/layout/root-document.tsx`。

### `src/api`

- 只包含浏览器请求函数，不包含 toast、跳转或组件状态。
- 统一调用 `src/utils/request.ts`，`url` 写成 `/api/<Java 路径>`，HTTP 方法与 Java Controller 保持一致。
- 从具体文件导入，不建立 `index.ts` barrel。
- 请求和响应类型来自 `src/types`，不在 API 文件中重复声明。

### `src/features`

- 组件按业务域就近放置。
- 一个组件只维护自己负责的状态和事件。
- 页面独有逻辑不要提前提取成全局 hook；出现真实复用后再提取。

生成工作区固定拆分为：

- `GenerateForm`：请求编排和工作区状态。
- `ConversationSidebar`：对话选择、改名和删除。
- `GenerationSettings`：模型、比例、分辨率、画质和数量。
- `PromptComposer`：提示词、参考图和提交。
- `TaskPreview`：最近任务及结果预览。

无限画布（`features/canvas`）：

- 画布场景 JSON（`{nodes, edges, viewport}`）保存在 Java `canvas_board`，前端只负责编辑和提交。
- 节点类型为 `image`、`generator`、`note`；生成节点保存任务 `taskNo`，前端轮询任务结果后在客户端把结果图放到画布上。
- 局部重绘遮罩是与原图原始分辨率一致的 PNG：透明（alpha 0）为重绘区域，其余为不透明黑色。
- 改编自第三方开源项目的文件必须保留原 MIT 版权头；新增或移除第三方来源时同步更新 `THIRD_PARTY_NOTICES.md` 和 `/licenses` 页面。

画廊投稿（`features/gallery`、`/submissions`、`/admin/gallery`）：

- 用户只能投稿自己的生成结果，投稿后进入 `pending`，管理员通过后才出现在公开画廊；`rejected`、`withdrawn` 可重新提交，`removed` 不可重新提交，需通过意见反馈申诉。
- 生成结果自带 `galleryStatus`、`galleryRejectReason`，`PublishGalleryButton` 用它们作为初始状态；画布结果节点只保存 `resultId`，选中时通过 `/gallery/user/submissions` 查询状态。
- 拒绝、下架原因由管理员填写，1 到 200 字，用户可见。

不得重新加入浏览器直连生成供应商、API Key `localStorage` 或 IndexedDB 任务分支。生成密钥和资产必须留在服务端。

### `src/server`

- 服务端文件使用 `import "server-only"` 建立编译边界。
- 只保留 SSR 需要的 Java 客户端和会话入口，不再增加业务 facade。
- 鉴权与资源归属校验由 Java 负责，页面跳转只是体验层，不能替代后端校验。

### `src/types` 与 `src/utils`

- 只跨模块复用的类型才进入 `src/types`。
- 页面私有类型留在 feature 内。
- `src/types` 文件先逐个定义 `type Xxx = ...`，文件末尾再用 `export type { Xxx }` 集中导出。
- `utils` 必须是纯函数或明确的基础设施工具，不能弹消息、导航或读写组件状态。
- 类型层不能反向依赖 UI 或 feature。

## 7. API 契约

Java 后端成功响应统一为：

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

错误响应统一为：

```json
{
  "code": 400,
  "message": "请求参数不合法"
}
```

规则：

- HTTP 状态码表达请求结果，`code` 用于程序判断，`message` 用于用户反馈。
- `request.ts` 和 `requestJava` 只识别 Java 的数字 `code`；`code !== 200` 时，即使 HTTP 状态码是 200 也按失败处理并显示后端 `message`。
- `src/types` 直接使用 Java DTO/VO 的字段名，不在前端做字段改名或适配层。
- Java 把名为 `id` 或以 `Id` 结尾的 `Long` 字段序列化为字符串；`LocalDateTime` 是不带时区的 `2026-10-25T23:54:22`；分页统一为 `PageResult<T>`（`total`、`pages`、`list`），查询参数为 `pageNo`、`pageSize`、`sortBy`、`isAsc`。
- 不使用 `data.token || data.sliderToken`、数组/对象双形态等兼容兜底。
- 不使用 `as { ... }` 代替运行时校验。
- 后端返回类型确定后，把请求/响应类型写进 `src/types`，并在 `src/api` 的 `request<ResponseType>()` 上声明；页面和组件调用处不要再写 `as { ... }`。
- 表单可以做轻量的前端校验改善体验，但规则以 Java 为准，不在前端重复实现服务端规则。
- Java OpenAPI 稳定后，以后端契约为唯一来源生成共享类型。

## 8. 安全规则

- Session Cookie 必须由真实后端签名或绑定服务端会话，设置 `httpOnly`、`secure`、`sameSite` 和过期策略。
- 每个写操作都验证当前用户及目标资源归属，尤其是工单、图片、收藏、订单和积分。
- 管理员检查必须在服务端执行。
- 上传图片仅允许 PNG、JPEG、WebP；最多 4 张，单张不超过 10 MB。真实存储服务还必须校验文件内容而不只信任 MIME。
- 密钥、支付配置和 SMTP 密码只在服务端保存，页面只展示脱敏状态。
- 不向浏览器返回内部异常、堆栈、密钥或 Java 原始错误对象。
- 服务端请求 Java 失败必须记录不含敏感字段的请求方法、路径和错误摘要。
- 登录限流在 Java 中用 Redis 实现，前端不做进程内限流。

## 9. Server 与 Client Component

只有以下情况使用 `"use client"`：

- 表单输入、上传、弹层、轮询。
- 浏览器事件和本地主题偏好。
- 需要 React 客户端状态的交互。

规则：

- 把 Client Component 边界放在最小交互组件，不要把整页变为客户端组件。
- Client Component props 必须可序列化。
- 服务端模块不得被客户端组件导入。
- `window`、`document`、`localStorage`、`indexedDB` 和 `navigator` 只能在客户端事件或 effect 中使用。
- 渲染期间禁止 `Math.random()` 和 `Date.now()` 等不确定值。
- 轮询、计时器和浏览器事件必须清理，并防止卸载后的异步写入。

## 10. 命名与代码风格

命名以“当前作用域是否已经提供上下文”为判断依据。

```tsx
// 同一组件只有一个弹层
const [isOpen, setOpen] = useState(false);

// 同一组件有多个弹层，需要保留区分
const [isMenuOpen, setMenuOpen] = useState(false);
const [isSettingsOpen, setSettingsOpen] = useState(false);

// ConversationSidebar 内部已经有领域上下文
const [activeId, setActiveId] = useState("");
const [editId, setEditId] = useState("");
```

排序方向与字段比较必须分开表达，不在 `.sort()` 回调中嵌三元表达式：

```ts
const direction = args?.orderBy?.createdAt ?? "desc";
const isAscending = direction === "asc";

items.sort((a, b) => {
  const timeA = a.createdAt.getTime();
  const timeB = b.createdAt.getTime();

  if (isAscending) {
    return timeA - timeB;
  }

  return timeB - timeA;
});
```

规则：

- 布尔变量使用 `is`、`has`、`can`、`should` 前缀。
- setter 使用动作名，避免 `setConversationPanelOpen` 这类重复上下文。
- 跨模块 API 使用完整领域名，不能缩成难以搜索的字母或模糊缩写。
- 条件 class 统一使用 `clsx`，不再复制 `classNames()` helper。
- 前端表单提交使用 `try/catch/finally`，确保 loading 状态一定恢复。
- 业务函数发现问题直接 `throw`，不要为了“看起来安全”每层都 `catch` 后原样抛出。
- `catch` 必须有明确作用：转换错误、记录必要日志、展示错误、执行备用方案或释放资源。
- 需要明确 HTTP 状态码时抛 `AppError`，例如 `throw new AppError("资源不存在", 404)`。
- 复杂条件先命名；简单 happy path 不做多层防御和嵌套。
- 不使用链式或嵌套三元表达式；多分支逻辑使用提前命名和 `if/else`。
- 不把三元表达式、数组查找、`|| null` 混在一行里；先取 id，再查对象，再用 `if` 处理空值。
- 长表达式拆成 2 到 4 个中间变量，变量名短而清楚，避免在局部作用域重复完整业务前缀。
- 表单字段较多时，把纯表单字段收进一个 `form` 对象状态；保存中、测试中、提示消息、后端配置快照等非表单状态继续单独维护。
- 业务数据处理不要把过滤、排序、分页、补关联数据糅成一条链式调用；按步骤拆成变量，并在多步骤流程前加简短中文步骤注释。
- DTO 或接口返回值里不要直接嵌套多层对象；先拼 `generatedImage`、`profileWithUser`、`count` 等中间对象，再拼最终 `result` 并返回。
- 简单 JSX 列表渲染可以保留 `.map()`，但服务端业务查询、数据整理和过滤必须优先写成新手能读懂的步骤式代码。
- 函数名表达动作即可，不为了“看起来完整”堆很长；同一文件已有业务上下文时优先使用短名。
- 文件名、目录名、导入来源已经说明业务域时，不要在函数名里重复完整领域词。
- 例如 `generation-conversations.ts` 内部使用 `list`、`create`、`updateTitle`、`remove`，不要写 `listGenerationConversations`、`updateGenerationConversationTitle`。
- 局部变量也按同样规则收口，例如函数参数用 `profileId`，对象字段仍保留数据模型里的 `userProfileId`。
- 排序回调只负责取值和比较；方向、默认值和可选参数在回调外先命名。
- React 组件不在函数参数里解构 props，也不写内联 props 类型；先定义 `XxxProps`，函数接收 `props`，函数顶部再逐个 `const value = props.value`。
- 单文件超过约 400 行时检查是否混入多个职责，但不按行数机械拆文件。
- 注释只解释约束和原因，不复述代码。
- TypeScript 是唯一业务语言，`tsconfig` 不接受新增 JavaScript 业务文件。

类型文件推荐写法：

```ts
import type { OkResponse } from "@/types/api";

type AuthUser = {
  id: number;
  username: string;
  email: string;
  role: string;
};

type LoginWithEmailRequest = {
  email: string;
  password: string;
};

type LogoutAccountResponse = OkResponse;

export type { AuthUser, LoginWithEmailRequest, LogoutAccountResponse };
```

组件 props 推荐写法：

```tsx
type DocsSettingsFormProps = {
  initialDocs: DocsConfig;
  defaultDocs: DocsConfig;
};

export function DocsSettingsForm(props: DocsSettingsFormProps) {
  const initialDocs = props.initialDocs;
  const defaultDocs = props.defaultDocs;

  return <form />;
}
```

字段较多的表单状态推荐写法：

```tsx
const [form, setForm] = useState({
  isEnabled: initialSettings.enabled,
  host: initialSettings.host ?? "",
  port: String(initialSettings.port),
  user: initialSettings.user ?? "",
  password: "",
});

const [message, setMessage] = useState("");
const [isSaving, setSaving] = useState(false);

function updateForm(nextForm: Partial<typeof form>) {
  setForm((currentForm) => {
    const newForm = {
      ...currentForm,
      ...nextForm,
    };

    return newForm;
  });
}
```

业务数据处理推荐写法：

```ts
function attachMessages(ticketId: string) {
  const store = getStore();

  // 第一步：找出属于当前反馈工单的消息。
  const ticketMessages = store.feedbackMessages.filter((message) => {
    return message.ticketId === ticketId;
  });

  // 第二步：按照消息创建时间，从早到晚排序。
  ticketMessages.sort((messageA, messageB) => {
    const timeA = messageA.createdAt.getTime();
    const timeB = messageB.createdAt.getTime();

    return timeA - timeB;
  });

  // 第三步：给每条消息补充作者信息。
  const messagesWithAuthor = ticketMessages.map((message) => {
    const authorProfile = store.profiles.find((profile) => {
      return profile.id === message.authorProfileId;
    });

    if (!authorProfile) {
      throw new Error(`没有找到消息作者：${message.authorProfileId}`);
    }

    return {
      ...message,
      authorProfile,
    };
  });

  return messagesWithAuthor;
}
```

## 11. 生成与积分规则

- 界面上的预估积分来自 Java `POST /generation/user/price/estimate`，前端不维护计价公式。
- Java 后端创建任务时返回的 `requiredPoints` 是最终权威值。
- 真实扣费、失败退款和并发一致性必须由 Java 后端事务保证。
- 前端不得根据本地估算直接修改积分余额。

## 12. UI 规范

视觉目标是克制、工具化、适合重复操作，不做模板化 AI 营销页。

- 白底、黑字、细边框、少阴影。
- 避免大面积渐变、玻璃拟态、发光装饰和蓝紫科技风。
- 品牌和重要页面标题可使用 serif；表单、导航和数据使用 sans。
- 按钮和输入保持紧凑，圆角以 `rounded-md` 到 `rounded-xl` 为主。
- 使用 Lucide 图标，不手写已有图标。
- 用边框和留白建立层级，避免卡片嵌套卡片。
- 页面私有样式放同目录 CSS Module；令牌只放 `src/style/tokens.css`。
- CSS Module 使用稳定的 BEM 风格名称，例如 `docs__navLinkActive`。
- 移动端和桌面端都必须检查文字截断、固定工具尺寸和无重叠。
- 列表表格使用真实 `<table>`、`table-layout: fixed` 和 `<colgroup>` 统一列宽：用户端复用 `src/components/ui/data-table.module.css`，后台复用 `admin-workspace.module.css` 的 `table` 与 `col*` 列宽；时间、操作列固定宽度，长文本单行省略并带 `title`，窄屏横向滚动而不是压缩列。

当前全局样式入口是 `src/style/index.css`（由 `components/layout/root-document.tsx` 引入），语言切换器是 `src/components/layout/locale-switcher.tsx`，导航实现是 `src/components/layout/product-top-nav.tsx`，应用壳是 `src/components/layout/product-frame.tsx`。

## 13. 开发流程

新增页面：

1. 在 `src/app/[locale]` 创建路由（后台在 `src/app/admin`），默认使用 Server Component。
2. 首屏数据通过 `requestJava` 从 Java 获取。
3. 交互拆到对应 `src/features/<domain>`。
4. 浏览器请求放到 `src/api/<domain>`。
5. 请求/响应类型放到对应 `src/types/<domain>.ts`。
6. 校验、权限和新接口加在 Java 后端，前端不新增 Route Handler。
7. 文案进 `messages/zh-CN/<namespace>.json` 并 `pnpm i18n:build`；公开页使用 `buildMetadata` 并登记到 `site-routes.ts`（见 docs/i18n.md 第 4 节）。
8. 为纯业务规则和回归风险补测试。
9. 运行 `pnpm check` 和 `pnpm audit:prod`。

提交要求：

- 不提交 `.idea`、构建缓存、环境密钥或真实用户数据。
- 不保留没有消费者的依赖、文件、导出和静态资源。
- 不维护平行规范文档；国际化与 SEO 的细则只在 `docs/i18n.md`、`docs/seo.md`。
- README 是仓库唯一开发规范；实现变化必须同步更新对应章节。

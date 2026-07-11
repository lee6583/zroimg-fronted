# ZroImg Frontend

ZroImg 是基于 Next.js App Router 的图片生成 SaaS 前端，覆盖游客页面、用户创作流程、积分与订单、反馈工单和管理后台。

这个仓库负责：

- Server Components 和页面渲染。
- 浏览器交互与同源 API 调用。
- Next.js Route Handlers 组成的 BFF。
- Cookie、SSR 鉴权和前端权限入口。
- Java 后端协议转换、错误归一化和开发期 mock。

Java 后端负责真实用户、会话、验证码、生成任务、积分、订单、支付、对象存储和运营配置。前端不得成为这些数据的最终权威来源。

## 1. 技术栈

- Next.js 16.2，App Router、Server Components、Route Handlers。
- React 19.2。
- TypeScript 严格模式。
- Tailwind CSS 4 和 CSS Modules。
- Zod 4，用于 BFF 输入边界校验。
- Lucide React，统一图标来源。
- clsx，统一条件 class 拼接。
- pnpm 10，唯一包管理器。

修改 Next.js API、路由、缓存或文件约定前，必须先阅读当前安装版本位于 `node_modules/next/dist/docs/` 的对应指南。

## 2. 本地开发

```bash
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
pnpm build         # 生产构建
pnpm audit:prod    # 生产依赖安全审计
pnpm check         # 提交前完整校验
```

CI 位于 `.github/workflows/ci.yml`，Pull Request 和 `main`、`dev` 分支推送必须通过同样的质量门禁。

## 3. 环境与 BFF 模式

```dotenv
BFF_MODE=mock
AUTH_BFF_MODE=mock
JAVA_API_BASE_URL=http://localhost:8080
```

### 混合联调

当前后端只完成登录、注册、发码、重置密码等认证接口，而订单、生成、画廊、反馈等业务接口还没接完时，本地推荐使用混合模式：

```dotenv
BFF_MODE=mock
AUTH_BFF_MODE=java
JAVA_API_BASE_URL=http://api-dev.zroimg.com
```

含义：

- `BFF_MODE=mock`：未接 Java 的业务页面继续读取本地 mock，避免页面开发被后端进度卡住。
- `AUTH_BFF_MODE=java`：认证接口单独转发到 Java 后端，登录成功后使用 Java 返回的 `zroimg_user_token` Cookie。
- 混合模式只适合本地开发和联调，不代表项目已经具备上线条件。

### `mock`

- 只用于 `next dev` 下的页面开发和交互联调。
- 运行数据只存在于 `src/server/bff/`，不再维护第二份 `mock/*.json`。
- `NODE_ENV=production` 时始终关闭，即使环境变量写成 `mock` 也不会启用。

### `java`

- Route Handler 将已接入的接口转发到 `JAVA_API_BASE_URL`。
- Java 请求失败必须返回明确的 502，禁止静默回退到 mock。
- 服务端变量禁止使用 `NEXT_PUBLIC_*` 前缀。
- 本地联调 Java 后端时，在 `.env.local` 写入 `BFF_MODE=java` 和实际后端域名，例如 `JAVA_API_BASE_URL=http://api-dev.zroimg.com`。
- 如果只联调认证模块，不要把全局 `BFF_MODE` 切成 `java`，而是使用 `AUTH_BFF_MODE=java`。

当前 Java 模式尚未完成“当前用户、页面查询、订单、生成、收藏、反馈”等完整适配，因此仓库暂不具备生产部署条件。上线前必须让所有 `src/server/bff/*` facade 使用 Java 实现，并删除 `mock-store.ts`、`mock-db.ts` 和 `internal/*` mock。

## 4. 目录结构

```text
src/
  app/                 页面、布局、错误边界和 Route Handlers
  api/                 浏览器同源请求函数
  components/
    layout/            页面壳、导航和账户菜单
    ui/                业务无关 UI
  features/            按业务域组织的交互组件
  server/
    bff/               服务端业务 facade 和开发期 mock
    auth.ts            SSR 会话入口
    env.ts             服务端环境配置
    http.ts            BFF JSON 响应
    java-api.ts        Java 请求与代理
    validation.ts      Zod 请求解析
  style/               全局令牌、基础样式和公共组件样式
  types/               跨模块业务契约
  utils/               无 UI 副作用的纯函数
tests/                 纯业务规则单元测试
public/assets/         实际被页面引用的静态资源
```

不要为了目录对称创建空层、barrel 或“以后可能用到”的 helper。文件没有消费者时直接删除。

## 5. 模块边界

### `src/app`

- 页面默认是 Server Component。
- 页面负责鉴权、首屏数据组织和结构拼装，不承载长业务流程。
- Route Handler 是公开 HTTP 端点，必须独立完成鉴权、输入校验和错误映射。
- `page.tsx` 不直接读取 `mock-store`，统一通过 `src/server/bff/*`。
- 注册规范地址是 `/register`；`/signup` 只在 `next.config.ts` 保留 308 兼容重定向，不维护第二份页面。

### `src/api`

- 只包含浏览器请求函数，不包含 toast、跳转或组件状态。
- 统一调用 `src/utils/request.ts`，只请求同源 `/api/**`。
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

不得重新加入浏览器直连生成供应商、API Key `localStorage` 或 IndexedDB 任务分支。生成密钥和资产必须留在服务端。

### `src/server`

- 服务端文件使用 `import "server-only"` 建立编译边界。
- 鉴权与资源归属校验尽量靠近数据源，不能只在页面隐藏按钮。
- facade 返回页面 DTO，不向页面暴露 Java 原始 envelope 或数据库内部模型。
- Java 和 mock 的选择只由环境层决定，业务函数内部不得自行降级。

### `src/types` 与 `src/utils`

- 只跨模块复用的类型才进入 `src/types`。
- 页面私有类型留在 feature 内。
- `utils` 必须是纯函数或明确的基础设施工具，不能弹消息、导航或读写组件状态。
- 类型层不能反向依赖 UI 或 feature。

## 6. API 契约

本地 BFF 成功响应统一为：

```json
{
  "success": true,
  "data": {}
}
```

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
  "success": false,
  "message": "请求参数不合法",
  "code": "BAD_REQUEST"
}
```

规则：

- HTTP 状态码表达请求结果，`code` 用于程序判断，`message` 用于用户反馈。
- `request.ts` 只识别两种明确 envelope：本地 BFF 的布尔 `success`，Java 后端的数字 `code`。
- Java 后端 `code !== 200` 时，即使 HTTP 状态码是 200，前端也必须按失败处理并显示后端 `message`。
- 不使用 `data.token || data.sliderToken`、数组/对象双形态等兼容兜底。
- 不使用 `as { ... }` 代替运行时校验。
- JSON 请求使用 `parseJson()`，表单请求使用 `parseForm()`。
- Zod schema 只放在外部输入边界，不给内部可信对象重复校验。
- Java OpenAPI 稳定后，以后端契约为唯一来源生成共享类型。

## 7. 安全规则

- mock 登录、固定验证码、默认账号和内存数据只能存在于开发模式。
- 生产环境禁止 mock 回退。
- Session Cookie 必须由真实后端签名或绑定服务端会话，设置 `httpOnly`、`secure`、`sameSite` 和过期策略。
- 每个写操作都验证当前用户及目标资源归属，尤其是工单、图片、收藏、订单和积分。
- 管理员检查必须在服务端执行。
- 上传图片仅允许 PNG、JPEG、WebP；最多 4 张，单张不超过 10 MB。真实存储服务还必须校验文件内容而不只信任 MIME。
- 密钥、支付配置和 SMTP 密码只在服务端保存，页面只展示脱敏状态。
- 不向浏览器返回内部异常、堆栈、密钥或 Java 原始错误对象。
- 服务端代理失败必须记录不含敏感字段的请求方法、路径和错误摘要。

## 8. Server 与 Client Component

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

## 9. 命名与代码风格

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
- Route Handler 不重复手写 `try/catch`，统一使用 `handleApi(async () => { ... })`。
- 业务函数发现问题直接 `throw`，不要为了“看起来安全”每层都 `catch` 后原样抛出。
- `catch` 必须有明确作用：转换错误、记录必要日志、展示错误、执行备用方案或释放资源。
- 需要明确 HTTP 状态码时抛 `AppError`，例如 `throw new AppError("资源不存在", 404)`。
- 复杂条件先命名；简单 happy path 不做多层防御和嵌套。
- 不使用链式或嵌套三元表达式；多分支逻辑使用提前命名和 `if/else`。
- 不把三元表达式、数组查找、`|| null` 混在一行里；先取 id，再查对象，再用 `if` 处理空值。
- 长表达式拆成 2 到 4 个中间变量，变量名短而清楚，避免在局部作用域重复完整业务前缀。
- 函数名表达动作即可，不为了“看起来完整”堆很长；同一文件已有业务上下文时优先使用短名。
- 文件名、目录名、导入来源已经说明业务域时，不要在函数名里重复完整领域词。
- 例如 `generation-conversations.ts` 内部使用 `list`、`create`、`updateTitle`、`remove`，不要写 `listGenerationConversations`、`updateGenerationConversationTitle`。
- 跨模块 facade 可以补最少上下文，例如从 `src/server/bff/generation.ts` 导出 `listConversations`、`createTask`，不要堆成长串。
- 局部变量也按同样规则收口，例如函数参数用 `profileId`，对象字段仍保留数据模型里的 `userProfileId`。
- 排序回调只负责取值和比较；方向、默认值和可选参数在回调外先命名。
- 单文件超过约 400 行时检查是否混入多个职责，但不按行数机械拆文件。
- 注释只解释约束和原因，不复述代码。
- TypeScript 是唯一业务语言，`tsconfig` 不接受新增 JavaScript 业务文件。

Route Handler 推荐写法：

```ts
export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const parsed = await parseJson(request, schema);
    if (!parsed.ok) return jsonError(parsed.message);

    const data = await createSomething(parsed.data);
    return jsonOk({ data });
  });
}
```

## 10. 生成与积分规则

- 前端 `estimateGenerationCredits()` 只用于界面预估。
- mock 服务端复用相同纯函数，避免开发期两套算法漂移。
- Java 后端创建任务时返回的 `costCredits` 是最终权威值。
- 真实扣费、失败退款和并发一致性必须由 Java 后端事务保证。
- 前端不得根据本地估算直接修改积分余额。

## 11. UI 规范

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

当前全局样式入口是 `src/style/index.css`，导航实现是 `src/components/layout/product-top-nav.tsx`，应用壳是 `src/components/layout/app-shell.tsx`。

## 12. 开发流程

新增页面：

1. 在 `src/app` 创建路由，默认使用 Server Component。
2. 数据通过 `src/server/bff/*` 获取。
3. 交互拆到对应 `src/features/<domain>`。
4. 浏览器请求放到 `src/api/<domain>`。
5. 请求/响应类型放到对应 `src/types/<domain>.ts`。
6. Route Handler 使用 Zod 校验并完成鉴权。
7. 为纯业务规则、权限边界和回归风险补测试。
8. 运行 `pnpm check` 和 `pnpm audit:prod`。

提交要求：

- 不提交 `.idea`、构建缓存、环境密钥或真实用户数据。
- 不保留没有消费者的依赖、文件、导出和静态资源。
- 不同时维护两份 mock 数据源或平行规范文档。
- README 是仓库唯一开发规范；实现变化必须同步更新对应章节。

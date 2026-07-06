# ZroCodeImg 项目规范

## 1. 项目目标

ZroCodeImg 是一个图片生成 SaaS 项目，核心闭环是：用户注册登录、购买积分、创建图片生成任务、扣除积分、保存图片资产、查看历史记录、管理员配置生图服务和管理用户。

项目优先级是“真实可用的工具闭环”，不是展示型 Demo。所有积分、订单、任务、图片和权限都以后端数据库为准，前端只负责展示和交互。

## 2. 技术栈

- Next.js App Router，页面默认使用 Server Components。
- TypeScript 作为唯一业务开发语言。
- Tailwind CSS 作为样式系统。
- Better Auth 负责用户、密码和 Session。
- Prisma + PostgreSQL 负责业务数据。
- S3 兼容存储负责输入图、输出图和缩略图。
- Docker Compose 负责本地和自托管部署。
- Worker 负责异步生图任务执行。

## 3. 目录约定

- `src/app`：Next.js 页面、布局和 Route Handlers。
- `src/components`：跨业务复用组件。
- `src/features`：按业务域组织的 UI 和交互组件。
- `src/server`：数据库、鉴权、积分、支付、生图、存储、邮件等服务端逻辑。
- `src/worker`：异步任务执行入口。
- `prisma`：Schema、migration 和 seed。

不要把数据库、密钥、支付验签、生图请求等服务端逻辑写进 Client Component。

## 4. SSR 与组件边界

页面默认保持 Server Component，只有需要状态、点击、上传、轮询、弹窗、下拉、表单提交的部分才使用 `"use client"`。

Server Component 禁止访问：

- `window`
- `document`
- `localStorage`
- `indexedDB`
- `navigator`
- `Date.now()` 或 `Math.random()` 这类会导致 hydration 不稳定的渲染值

需要当前用户、积分、任务、订单等首屏数据时，优先在 Server Component 中读取，再传给 Client Component。

## 5. UI 风格规范

整体视觉参考 KoImg 的克制工具感：白底、黑字、细边框、低阴影、圆角适中、少渐变。

基础原则：

- 主色只使用黑白灰，状态色只在错误、警告、成功时出现。
- 页面不要堆叠大面积渐变、发光球、玻璃拟态和紫色 SaaS 模板元素。
- 大标题可以使用 serif 字体，工具按钮、表单、导航使用 sans 字体。
- 卡片靠细边框区分层级，默认不使用重阴影。
- 交互控件要紧凑、明确，避免无意义的装饰。

## 6. CSS 与样式组织规范

项目样式优先遵循“结构清楚、局部收敛、少全局污染”的原则。

页面或组件专属样式：

- 优先放在同目录的 `*.module.css` 文件里，例如 `src/app/docs/page.tsx` 对应 `src/app/docs/docs.module.css`。
- CSS Module 内使用接近 BEM 的命名方式：块名 `docs`，元素名 `docs__sidebar`、`docs__navLink`，状态名可用 `docs__navLinkActive`。
- 一个页面自己的布局、字号、间距、边框、文档排版等，不要长期堆在 `className` 里。
- Tailwind 可以用于少量一次性的布局和状态，但复杂页面不要写成一长串难维护的 utility class。
- 跨页面复用的基础 token、按钮、输入框、导航基础类，才放到 `src/app/globals.css`。
- 不要在全局 CSS 里写只服务某一个页面的类名，避免后续页面互相影响。

目录适用范围：

- `src/app/**` 的页面专属样式，放在当前路由目录。
- `src/features/**` 的业务组件专属样式，放在对应 feature 组件同目录。
- `src/components/**` 的可复用组件，如果样式复杂，也用同目录 CSS Module；如果只是简单组合，可继续使用现有基础类。

命名示例：

```tsx
import styles from "./docs.module.css";

export function DocsNav() {
  return <nav className={styles.docs__nav}>...</nav>;
}
```

```css
.docs {
  display: grid;
}

.docs__nav {
  display: grid;
  gap: 0.75rem;
}
```

## 7. 下拉框规范

项目内所有下拉选择都统一使用 `src/components/app-select.tsx` 的 `AppSelect`，不要再新增原生 `<select>`。

统一风格：

- 触发器使用圆角矩形、明显边框、右侧上下箭头。
- 展开层使用白色面板和细边框，不使用悬浮阴影。
- 选中项右侧显示对勾。
- 选项文案使用 `名称 · 附加信息` 格式，例如 `gpt-image-2 · 15`。
- 下拉项 hover 使用浅灰背景。

使用示例：

```tsx
<AppSelect
  value={model}
  onChange={setModel}
  options={[
    { value: "gpt-image-2", label: "gpt-image-2 · 15" },
  ]}
/>
```

## 8. 表单规范

表单标签要短，优先使用中文，如“套餐”“支付方式”“模型”“比例”“画质”。

错误提示要直接告诉用户原因，如“积分不足”“上传失败”“验证码已过期”。

禁止只显示“失败了”“未知错误”这种不可行动的文案。

上传类表单必须说明数量限制和文件格式限制。

## 9. 生成页规范

`/generate` 是核心创作工作台，必须保持轻、干净、工具感强。

当前交互约定：

- 左侧是生图设置入口、新建对话和会话列表。
- 主创作区顶部横线栏左侧放侧栏展开/收起按钮。
- 生图设置栏覆盖主创作区左侧，不改变中间创作布局。
- 点击主创作区空白处会收起生图设置栏。
- 会话列表支持改名和删除，会话删除不直接删除图片资产。

## 10. 代码清晰度规范

代码优先写给人看，其次才是机器执行。默认按“初学者也能读懂”的方式写业务逻辑。

核心原则：

- 先写主流程，再处理错误；不要一上来就把整段业务包进复杂 `try/catch`。
- 普通业务代码优先 happy path：取值、请求、判断结果、更新状态，按顺序展开。
- 复杂条件必须拆变量，例如 `const isOwner = ...`、`const isAdmin = ...`，不要把权限逻辑写成一长串布尔表达式。
- 不要写无意义防御，例如 `fetch` 返回值不需要判断 `if (!response)`。
- 不要为了“看起来生产级”重复解析响应、嵌套 try/catch、吞掉错误后返回模糊文案。
- 表单提交函数保持直线结构：`preventDefault` -> `setLoading(true)` -> 取值 -> `fetch` -> `res.json()` -> 错误提示或成功跳转。
- 能用清楚变量名表达的地方，不额外抽象工具函数；能用简单顺序代码表达的地方，不提前设计框架。

推荐写法：

```tsx
async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  setLoading(true);
  setError("");

  const formData = new FormData(event.currentTarget);
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const response = await fetch("/api/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();

  if (!response.ok) {
    setError(data.message || "登录失败");
    setLoading(false);
    return;
  }

  router.push("/dashboard");
  setLoading(false);
}
```

不推荐写法：

- 普通表单里多层 `try/catch/finally`。
- 先写大量 `typeof`、`null`、`undefined` 防御，再写业务。
- `const data = await response.json().catch(() => null)` 这种让主流程变难读的写法。
- `if (a && b !== c && d !== e)` 这种需要读者反复解码的业务判断。

例外：

- 支付回调、积分扣减/退款、权限校验、上传解析、外部模型调用、worker 任务执行，可以保留必要的错误处理和事务保护。
- 这些边界代码也要先拆清楚变量和业务含义，再做异常处理；不要把安全代码写成看不懂的代码。

每次写代码前先看本规范。AI 生成代码时默认按本节执行：写清晰，不写过度防御；写业务，不写炫技式健壮。

## 11. 数据与权限规范

后台权限只相信服务端数据库中的 `UserProfile.role`，不能相信前端传参。

用户状态只相信 `UserProfile.status`。封禁用户不能继续创建订单或生成任务。

积分余额以 `UserProfile.creditBalance` 为准，所有积分变动必须写 `CreditLedger`。

支付回调必须幂等，积分发放只依赖服务端回调，不依赖前端跳转页。

生成任务必须异步执行，接口只负责创建任务和扣积分，worker 负责调用模型、上传存储和落库结果。

## 12. 环境变量规范

真实密钥只放 `.env` 或部署 Secret，不提交到 Git。

必须配置的生产变量包括：

- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `DATABASE_URL`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `EASYPAY_API_BASE`
- `EASYPAY_PID`
- `EASYPAY_KEY`
- `ADMIN_EMAIL`
- `ADMIN_USERNAME`
- `ADMIN_INITIAL_PASSWORD`

生图模型的 URL、模型名和密钥优先由管理员后台配置，`.env` 只作为开发或兜底配置。

## 13. 验证命令

每次重要改动后至少运行：

```bash
pnpm lint
pnpm typecheck
pnpm build
```

涉及积分、支付、worker 或权限时，同时运行：

```bash
pnpm test
```

涉及 Prisma schema 时，需要运行：

```bash
pnpm db:generate
pnpm db:deploy
```

## 14. 迭代原则

优先完成可用闭环，再做视觉增强。

新增页面必须明确属于公开页、用户工作台、管理员后台或 API。

新增组件先判断是否能复用现有组件，尤其是按钮、表单、下拉、卡片、导航。

不要为了短期视觉效果破坏 SSR、权限、积分流水和任务状态机。

# 文档站（/docs）

用户端文档分两部分：

| 部分             | 来源                                                               | 语言                   | 位置                               |
| ---------------- | ------------------------------------------------------------------ | ---------------------- | ---------------------------------- |
| 内置文档（主体） | 仓库代码 `src/content/docs/`，随版本发布                           | zh-CN、en、ru 各一份   | `/docs/<slug>`                     |
| 公告与常见问题   | 后台「文档管理」（`/admin/docs`，Java `GET /content/public/docs`） | 后台填写的原文，不翻译 | `/docs` 首页底部，内容为空时不显示 |

## 1. 路由

```text
src/app/[locale]/docs/
  layout.tsx          顶栏 + 左侧导航（DocsSidebar），所有文档页共用
  page.tsx            /docs：分区卡片 + 公告与常见问题（后台内容）
  [...slug]/page.tsx  /docs/introduction、/docs/api/images …；未知 slug 返回 404
```

页面在 `[...slug]` 下按 `src/content/docs/navigation.ts` 的 slug 白名单渲染，`generateMetadata` 也会对未知 slug 调用 `notFound()`。文档段不使用 `loading.tsx`，否则流式响应会让 404 页面返回 200。

## 2. 内容

```text
src/content/docs/
  types.ts            DocsSlug、DocsPageContent（navTitle、title、description、body）
  navigation.ts       侧边栏分组、阅读顺序、docsLastModified（sitemap / JSON-LD 使用）
  examples.ts         多语言代码示例（cURL / Python / JavaScript），所有语言共用
  index.ts            server-only：按语言取内容、侧边栏数据、上一页/下一页
  zh-CN/  en/  ru/    每种语言每页一个 TS 模块，index.ts 汇总为 DocsLocaleContent
```

- 中文是源语言。修改中文含义时同步修改 en、ru；`DocsLocaleContent = Record<DocsSlug, DocsPageContent>`，漏掉某种语言的某一页会类型报错。
- 新增页面：在 `types.ts` 的 `DocsSlug` 和 `navigation.ts` 中登记，三种语言各加一个模块，更新 `docsLastModified`。sitemap 自动包含所有 slug。
- 页面标题、描述直接写在内容模块里（不是 `messages/*.json`），用于 `<title>`、meta description、页首导语、首页卡片。框架文案（侧边栏分组名、目录、上一页/下一页、复制按钮）在 `messages/<locale>/docs.json`。
- 开放 API 的 Base URL 来自 `src/lib/open-api.ts` 的 `openApiBaseUrl`（`NEXT_PUBLIC_OPEN_API_BASE_URL`，默认 `https://api.zroimg.com`）；正文里用 `${openApiBaseUrl}` 插值。示例密钥统一用 `placeholderApiKey`（`zk-xxxx…`）。

## 3. Markdown 语法

渲染器是 `src/features/docs/markdown.tsx`（内置文档和后台文档共用），只支持下面的子集，不支持 HTML：

| 语法                                                           | 说明                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `## 标题 {#id}`                                                | h2/h3 进入本页目录；内置文档必须写 `{#id}`，三种语言保持相同 id，站内链接才能共用锚点 |
| 一行一段                                                       | 每个非空行是一个段落，不要手动折行                                                    |
| `` `code` ``、`**粗体**`、`[文字](/docs/api/tasks#list-tasks)` | 以 `/` 开头的链接走 i18n `Link`（自动加语言前缀），外链新窗口打开                     |
| `- 列表`、`1. 步骤`                                            | 有序列表渲染为步骤                                                                    |
| `\| 表头 \| … \|` + 分隔行                                     | 表格；单元格内的 `\|` 写成 `\\                                                        | `；手机端每行变成一张卡片 |
| `> [!NOTE]`、`> [!TIP]`、`> [!WARNING]`                        | 提示框；普通 `>` 为引用                                                               |
| ` ``` ` 或 `~~~` 代码块                                        | 带语言标签和复制按钮；TS 模板字符串里用 `~~~`，免去转义反引号                         |
| `::: example <key>`                                            | 插入 `examples.ts` 中的多语言代码示例（标签页 + 复制，所选语言在页面间记住）          |

后台文档的 `#` 一级标题会降为 h2，保证页面只有一个 h1。

## 4. 布局与移动端

- 左侧导航复用应用侧边栏 `components/layout/side-nav.tsx`：「文档首页」是顶层入口，`navigation.ts` 的每个分区（使用指南 / API 基础 / API 接口）是带图标、可折叠的一级分组（折叠状态存 `localStorage`，进入分组内页面时自动展开），页面图标在 `docs-sidebar.tsx` 中按 slug 配置。
- ≥ 1024px：左侧导航固定；≥ 1280px：右侧「本页目录」。
- < 1024px：导航收进顶部吸顶条，点击打开 `Sheet`（手机底部弹出、平板右侧抽屉），里面是同一个 `SideNav`（`isVertical`，手机上也保持竖向分组）；< 1280px：本页目录是正文顶部的折叠面板（`DocsMobileToc`）。
- 代码块在手机上通栏、横向滚动；复制、标签等点击区域不小于 44px。

## 5. SEO

- 每页 `buildMetadata`（标题、描述来自内容模块），`TechArticle` JSON-LD（`src/lib/structured-data.ts`）。
- `src/lib/site-routes.ts` 把 `/docs` 和全部 slug 加入 `publicPages`，sitemap 按语言展开并带 hreflang。

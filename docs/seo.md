# SEO

## 1. 范围

**基础 SEO（已完成）**

- 每个公开页面、每种语言都有唯一的 `<title>` 和 description（`metadata.<page>.*` 文案）。
- canonical、hreflang（含 `x-default`）、OpenGraph、Twitter Card、robots 由 `buildMetadata` 统一生成。
- `sitemap.xml`（公开页 × 全部语言，带 hreflang）与 `robots.txt`。
- JSON-LD：首页 `Organization` + `WebSite`，画廊 `ImageGallery`（当前页作品的 `ImageObject`），文档页 `TechArticle`。
- 登录后的应用页、认证页、后台、404 一律 `noindex`。
- 爬虫访问无前缀地址时不做语言重定向（见 [docs/i18n.md](./i18n.md) 1.2）。

**深度 SEO（待做）**：见第 7 节。

## 2. 公开与不收录的页面

| 类型   | 路径（每种语言各一份）                                                                                                                    | robots            | 出现在 sitemap                                  |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ----------------------------------------------- |
| 公开页 | `/`、`/gallery`、`/pricing`、`/docs`、`/docs/<slug>`、`/licenses`                                                                         | index, follow     | 是                                              |
| 认证页 | `/login`、`/register`、`/forgot-password`                                                                                                 | noindex, nofollow | 否（允许抓取以便看到 noindex）                  |
| 应用页 | `/dashboard`、`/generate`、`/canvas`、`/video`、`/history`、`/favorites`、`/submissions`、`/credits`、`/billing`、`/tickets`、`/settings` | noindex, nofollow | 否；robots.txt Disallow（含 `/en`、`/ru` 前缀） |
| 后台   | `/admin/**`                                                                                                                               | noindex, nofollow | 否；Disallow                                    |
| 接口   | `/api/**`                                                                                                                                 | —                 | 否；Disallow                                    |

公开页列表和应用页列表都在 `src/lib/site-routes.ts`，sitemap 和 robots 从这里生成。

## 3. `buildMetadata`

`src/lib/seo.ts`：

```ts
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations("metadata.pricing");

  return buildMetadata({
    locale,
    path: "/pricing", // 不带语言前缀的内部路径
    title: t("title"), // 自动套用 "%s | ZroImg"
    description: t("description"),
    // images: [{ url: "/assets/xxx.png", width: 1200, height: 630, alt: "..." }],
    // noindex: true,           // 认证页等不收录页面
    // isAbsoluteTitle: true,   // 首页等不套模板
  });
}
```

输出内容：

- `title`（模板在 `[locale]/layout.tsx` 的 `buildSiteMetadata` 中：`default` = `metadata.site.title`，`template` = `%s | ZroImg`）；
- `description`；
- `alternates.canonical`：当前语言自己的地址（zh-CN 无前缀，`/en/...`、`/ru/...`）；
- `alternates.languages`：`zh-CN`、`en`、`ru` 各一条，外加 `x-default` → 无前缀的中文地址（普通用户访问时由 proxy 协商语言，爬虫拿到中文）；
- OpenGraph：`siteName`、`type: website`、`url`、`locale`（`zh_CN` / `en_US` / `ru_RU`）、`alternateLocale`、完整标题、图片（默认 `/assets/creative.png`）；
- Twitter：`summary_large_image`；
- robots：公开页 `index, follow`；`noindex: true` 时 `noindex, nofollow` 并且**不输出** canonical/hreflang。

`metadataBase` 来自环境变量 `NEXT_PUBLIC_SITE_URL`（默认 `https://zroimg.com`），在根布局中设置，相对图片地址会自动补全。测试环境请设置为对应域名，否则 canonical 会指向正式站。

根布局只放站点级默认值（`buildSiteMetadata`），**不设置 canonical/alternates**——否则没有自己 metadata 的页面会继承首页的 canonical。

注意 Next 的 metadata 合并是浅合并：页面设置了 `openGraph` 会整体替换布局的 `openGraph`，所以每个公开页都必须调用 `buildMetadata`，而不是只写 `title`。

## 4. canonical / hreflang 规则

- 每种语言的页面 canonical 指向自己，不指向中文版。
- hreflang 必须成对互相指向：三种语言 + `x-default` 在每个语言版本里都完整输出（`buildMetadata` 和 sitemap 共用 `languageAlternates()`）。
- 带查询参数的列表页（`/gallery?category=anime&page=2`）canonical 目前指向不带参数的 `/gallery`。如果以后希望分类页单独收录，给分类改为路径（`/gallery/anime`）并加入 sitemap。
- 只在部分语言存在的页面（例如只有中文的公告）不要用 `buildMetadata` 的默认 hreflang，需要只列出存在的语言。

## 5. sitemap 与 robots 维护

- `src/app/sitemap.ts`：对 `publicPages` 中每个页面 × `routing.locales` 生成条目，带 `alternates.languages`、`lastModified`、`changeFrequency`、`priority`。改版公开页时更新对应的 `lastModified`。
- 预留的 `listGallerySources()`：画廊详情页上线后在这里返回作品条目（含 `images`），届时改为 `revalidate` 按需生成，超过 5 万条用 `generateSitemaps` 分片。
- `src/app/robots.ts`：允许 `/`，禁止 `/admin`、`/api/` 和 `appPaths` × 全部语言前缀；声明 `Sitemap` 和 `Host`。新增登录后页面时把路径加入 `appPaths`。
- 两个文件都是元数据路由，不经过 proxy；构建产物中为静态 `○ /sitemap.xml`、`○ /robots.txt`。

## 6. 结构化数据（JSON-LD）

`src/lib/structured-data.ts`：

- `organization()`：名称、站点地址、logo；
- `website(locale)`：名称、当前语言首页、`inLanguage`。站内目前没有搜索功能，所以**不输出** `SearchAction`；
- `imageGallery({ locale, path, name, description, items })`：`ImageGallery` + 每张图片的 `ImageObject`（`contentUrl`、`name`、`description`、`author`、`datePublished`、宽高）。

渲染：

```tsx
import { JsonLd } from "@/components/seo/json-ld";

<JsonLd data={[organization(), website(locale)]} />;
```

`JsonLd` 把 `<` 转义为 `\u003c`，避免用户内容（作品标题、提示词）中的 `</script>` 提前闭合标签。时间先 `parseJavaDateTime(...).toISOString()`。

## 7. 新增公开页清单

1. 页面放在 `src/app/[locale]/...`，不在 `(product)`/`(auth)` 下。
2. `messages/*.json` 中新增 `metadata.<page>.title` 和 `metadata.<page>.description`（zh-CN 必填；标题 10–30 字，描述 60–120 字，各语言唯一）。
3. 导出 `generateMetadata` 并调用 `buildMetadata({ locale, path, title, description })`。
4. 页面只有一个 `<h1>`，与标题含义一致；图片有有意义的 `alt`（走翻译）。
5. 把路径加入 `src/lib/site-routes.ts` 的 `publicPages`。
6. 有合适的结构化数据时（文章、商品、图片集）用 `JsonLd` 输出。
7. 用 `curl -s http://localhost:3000/en/<path> | grep -E 'canonical|hreflang|<title>'` 检查。

## 8. 深度 SEO（后续）

- **画廊详情页** `/gallery/[id]`：每个作品独立 URL、`ImageObject`（含 `license`、`creator`、`acquireLicensePage`）、图片 sitemap、相关作品内链；作品标题/描述的多语言策略（原文 + 机器翻译或只收录原文语言）。
- **OG 图片生成**：用 `opengraph-image.tsx` 按页面/作品生成 1200×630 图片，替代默认的 `creative.png`。
- **每种语言的关键词研究**：中文（百度/必应中文）、英文（Google）、俄文（Yandex）分别做关键词与标题/描述优化，必要时本地化 URL slug（next-intl `pathnames`）。
- **搜索引擎平台**：Google Search Console、Bing Webmaster、Yandex.Webmaster、百度站长平台验证（`metadata.verification`），提交 sitemap、监控覆盖率与 hreflang 错误。
- **性能 / Core Web Vitals**：公开页目前因读取 Cookie（主题、登录态）全部是动态渲染；可把登录态区域改为客户端获取，让首页、定价、文档可静态生成或 ISR；图片使用 `next/image` 优化与正确尺寸；减少首屏客户端 JS。
- **内容**：定价、文档页的 FAQ（`FAQPage`）、教程文章与 `Article`/`HowTo` 结构化数据；落地页按场景的专题页。
- **服务条款 / 隐私 / Cookie 政策页**：首页页脚已链接 `/terms`、`/privacy`、`/cookies`，页面尚不存在（目前 404），上线后加入 `publicPages`。
- **百度适配**：百度对 hreflang 支持有限，必要时考虑中文独立域名或 `<meta http-equiv="content-language">`。

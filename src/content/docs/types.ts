// 内置文档的类型。正文是 Markdown 字符串（语法见 docs/docs-site.md），按语言分文件维护。

type DocsSlug =
  | "introduction"
  | "quickstart"
  | "billing"
  | "api/overview"
  | "api/models"
  | "api/images"
  | "api/videos"
  | "api/tasks"
  | "api/polish"
  | "api/balance"
  | "api/errors";

type DocsSectionKey = "guide" | "api" | "endpoints";

type DocsSection = {
  key: DocsSectionKey;
  slugs: DocsSlug[];
};

type DocsPageContent = {
  // 侧边栏、上一页/下一页使用的短标题
  navTitle: string;
  // 页面 <h1> 与 <title>
  title: string;
  // meta description（60–160 字符）和页首导语
  description: string;
  body: string;
};

type DocsLocaleContent = Record<DocsSlug, DocsPageContent>;

export type { DocsSlug, DocsSectionKey, DocsSection, DocsPageContent, DocsLocaleContent };

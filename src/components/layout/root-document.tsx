import type { ReactNode } from "react";
import { cookies } from "next/headers";
import Script from "next/script";
import "antd/dist/reset.css";
import "@/style/index.css";

// 用户端 app/[locale]/layout.tsx 与后台 app/admin/layout.tsx 是两个根布局，
// 全局样式、主题首屏脚本和 <html>/<body> 结构统一放在这里，避免两边漂移。

const themeBootstrapScript = `
(function () {
  try {
    var theme = window.localStorage.getItem("zroimg-theme") === "dark" ? "dark" : "light";
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    document.cookie = "zroimg-theme=" + theme + ";path=/;max-age=31536000;samesite=lax";
  } catch (error) {
  }
})();
`;

type RootDocumentProps = {
  lang: string;
  children: ReactNode;
};

function normalizeTheme(value?: string) {
  return value === "dark" ? "dark" : "light";
}

export async function RootDocument(props: RootDocumentProps) {
  const lang = props.lang;
  const children = props.children;
  const cookieStore = await cookies();
  const theme = normalizeTheme(cookieStore.get("zroimg-theme")?.value);

  return (
    <html lang={lang} data-theme={theme} className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col"
        style={{ colorScheme: theme }}
        suppressHydrationWarning
      >
        {children}
        {/* RootDocument 只由根布局渲染，等同于在根布局里放 beforeInteractive 脚本。 */}
        {/* eslint-disable-next-line @next/next/no-before-interactive-script-outside-document */}
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
      </body>
    </html>
  );
}

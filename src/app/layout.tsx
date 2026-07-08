import type { Metadata } from "next";
import Script from "next/script";
import "@/style/tokens.css";
import "@/style/base.css";
import "@/style/common.css";
import "@/style/media.css";
import "@/style/mixins.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZroCode SaaS",
  description: "Image generation SaaS powered by gpt-image-2.",
};

const themeBootstrapScript = `
  try {
    const theme = window.localStorage.getItem("zrocode-theme") === "dark" ? "dark" : "light";
    const locale = window.localStorage.getItem("zrocode-locale") === "EN" ? "en" : "zh-CN";
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
  } catch {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
        {children}
      </body>
    </html>
  );
}

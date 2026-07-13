import type { Metadata } from "next";
import "@/style/index.css";

export const metadata: Metadata = {
  title: "ZroCode SaaS",
  description: "Image generation SaaS powered by gpt-image-2.",
};

const themeBootstrapScript = `
  try {
    const theme = window.localStorage.getItem("zroimg-theme") === "dark" ? "dark" : "light";
    const locale = window.localStorage.getItem("zroimg-locale") === "EN" ? "en" : "zh-CN";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    document.documentElement.lang = locale;
  } catch {}
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="light" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

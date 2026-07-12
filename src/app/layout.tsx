import type { Metadata } from "next";
import Script from "next/script";
import "@/style/index.css";

export const metadata: Metadata = {
  title: "ZroImg",
  description: "Image generation SaaS powered by gpt-image-2.",
  icons: {
    icon: [{ url: "/assets/icon.png", sizes: "512x512", type: "image/png" }],
    apple: [{ url: "/assets/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

const themeBootstrapScript = `
  try {
    const theme = window.localStorage.getItem("zroimg-theme") === "dark" ? "dark" : "light";
    const locale = window.localStorage.getItem("zroimg-locale") === "EN" ? "en" : "zh-CN";
    document.documentElement.dataset.theme = theme;
    document.documentElement.lang = locale;
  } catch {}
`;

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function RootLayout(props: RootLayoutProps) {
  const children = props.children;

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

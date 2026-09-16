import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import "antd/dist/reset.css";
import "@/style/index.css";

export const metadata: Metadata = {
  title: "ZroImg",
  description: "Image generation SaaS powered by gpt-image-2.",
  icons: {
    icon: [
      {
        url: "/assets/day-icon.png",
        sizes: "512x512",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/assets/night-icon.png",
        sizes: "512x512",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple: [
      {
        url: "/assets/day-icon.png",
        sizes: "512x512",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/assets/night-icon.png",
        sizes: "512x512",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
  },
};

const themeBootstrapScript = `
(function () {
  try {
    var theme = window.localStorage.getItem("zroimg-theme") === "dark" ? "dark" : "light";
    var locale = window.localStorage.getItem("zroimg-locale") === "EN" ? "en" : "zh-CN";
    var root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
    root.lang = locale;
    document.cookie = "zroimg-theme=" + theme + ";path=/;max-age=31536000;samesite=lax";
    document.cookie = "zroimg-locale=" + locale + ";path=/;max-age=31536000;samesite=lax";
  } catch (error) {
  }
})();
`;

type RootLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

function normalizeTheme(value?: string) {
  return value === "dark" ? "dark" : "light";
}

function normalizeLocale(value?: string) {
  return value === "en" ? "en" : "zh-CN";
}

export default async function RootLayout(props: RootLayoutProps) {
  const children = props.children;
  const cookieStore = await cookies();
  const theme = normalizeTheme(cookieStore.get("zroimg-theme")?.value);
  const locale = normalizeLocale(cookieStore.get("zroimg-locale")?.value);

  return (
    <html lang={locale} data-theme={theme} className="h-full antialiased" suppressHydrationWarning>
      <body
        className="min-h-full flex flex-col"
        style={{ colorScheme: theme }}
        suppressHydrationWarning
      >
        {children}
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {themeBootstrapScript}
        </Script>
      </body>
    </html>
  );
}

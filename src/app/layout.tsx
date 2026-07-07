import type { Metadata } from "next";
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

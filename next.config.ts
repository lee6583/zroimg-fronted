import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const isDev = process.env.NODE_ENV === "development";
const javaApiBaseUrl = (process.env.JAVA_API_BASE_URL || "").replace(/\/+$/, "");

// 请求配置在 src/i18n/request.ts（插件默认路径）。
// createMessagesDeclaration 生成 messages/zh-CN.d.json.ts，让 ICU 参数也参与类型检查。
const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: "./messages/zh-CN.json",
  },
});

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // [locale] 和 admin 是两个根布局，未匹配任何路由的 404 由 app/global-not-found.tsx 渲染。
    globalNotFound: true,
  },
  async redirects() {
    return [
      {
        source: "/signup",
        destination: "/register",
        permanent: true,
      },
      {
        source: "/:locale(en|ru)/signup",
        destination: "/:locale/register",
        permanent: true,
      },
    ];
  },
  // 生产环境由 nginx 把 /api 直接转发到 Java，这里只在本地开发时模拟同样的路由。
  async rewrites() {
    if (!isDev || !javaApiBaseUrl) {
      return [];
    }

    return [
      {
        source: "/api/:path*",
        destination: `${javaApiBaseUrl}/:path*`,
      },
    ];
  },
};

export default withNextIntl(nextConfig);

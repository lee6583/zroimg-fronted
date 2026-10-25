import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";
const javaApiBaseUrl = (process.env.JAVA_API_BASE_URL || "").replace(/\/+$/, "");

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/signup",
        destination: "/register",
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

export default nextConfig;

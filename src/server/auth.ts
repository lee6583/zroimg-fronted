import "server-only";

import { getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { redirect as redirectLocalized } from "@/i18n/navigation";
import { requestJavaOrNull } from "@/server/java-api";
import type { CurrentUser } from "@/types/auth";

// Java 登录后写入的会话 Cookie
const SESSION_COOKIE = "zroimg_user_token";

export const getCurrentUser = cache(async function getCurrentUser() {
  const cookieStore = await cookies();
  if (!cookieStore.get(SESSION_COOKIE)) {
    return null;
  }

  return requestJavaOrNull<CurrentUser>("/auth/user/me");
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    // 跳到当前语言的登录页：/en/dashboard -> /en/login；后台（无 [locale]）回退为 zh-CN 的 /login。
    const locale = await getLocale();
    return redirectLocalized({ href: "/login", locale });
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    // 后台不做多语言，这里保持无前缀地址，由 proxy 按用户语言偏好落到对应语言的概览页。
    redirect("/dashboard");
  }
  return user;
}

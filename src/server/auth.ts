import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
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
    redirect("/login");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  return user;
}

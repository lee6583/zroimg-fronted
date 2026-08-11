import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { z } from "zod";
import { findUserBundleByUserId } from "@/server/bff/auth";
import { createMockUser, findUserByEmail } from "@/server/bff/mock-store";
import { isJavaAuthEnabled, isMockBffEnabled } from "@/server/env";
import { getJavaApiData, JavaApiError } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import type { MockRole } from "@/server/bff/mock-store";

export const MOCK_SESSION_COOKIE = "zroimg-mock-session";
export const JAVA_SESSION_COOKIE = "zroimg_user_token";

const javaUserSchema = z.object({
  id: javaIdSchema,
  username: z.string(),
  email: z.string(),
  bio: z.string().nullable().optional(),
  avatarUrl: z.string().nullable().optional(),
  role: z.enum(["user", "admin"]),
  status: z.number(),
  totalPoints: z.number(),
  createdAt: z.string(),
});

type JavaUser = z.infer<typeof javaUserSchema>;

function readRole(role: string | undefined): MockRole {
  if (role === "admin") {
    return "admin";
  }

  return "user";
}

function getMockProfile(javaUser: JavaUser) {
  if (!isMockBffEnabled()) {
    return null;
  }

  let bundle = findUserByEmail(javaUser.email);

  if (!bundle) {
    bundle = createMockUser({
      username: javaUser.username,
      email: javaUser.email,
      password: "",
    });
  }

  bundle.profile.username = javaUser.username;
  bundle.profile.role = readRole(javaUser.role);
  bundle.profile.status = "active";
  bundle.profile.creditBalance = javaUser.totalPoints;
  bundle.profile.avatarUrl = javaUser.avatarUrl ?? null;
  return bundle;
}

async function getJavaUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JAVA_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  let payload: unknown;
  try {
    payload = await getJavaApiData<unknown>("/auth/user/me");
  } catch (error) {
    if (error instanceof JavaApiError && error.status === 401) {
      return null;
    }

    throw error;
  }

  const parsed = javaUserSchema.safeParse(payload);
  if (!parsed.success) {
    throw new Error("当前用户接口返回格式不正确");
  }

  const javaUser = parsed.data;
  const mockBundle = getMockProfile(javaUser);
  if (mockBundle) {
    return mockBundle;
  }

  const userId = javaUser.id;
  const createdAt = new Date(javaUser.createdAt);

  return {
    user: {
      id: userId,
      email: javaUser.email,
      password: "",
      name: javaUser.username,
      createdAt,
    },
    profile: {
      id: userId,
      userId,
      username: javaUser.username,
      role: readRole(javaUser.role),
      status: "active" as const,
      creditBalance: javaUser.totalPoints,
      bio: javaUser.bio ?? "",
      avatarUrl: javaUser.avatarUrl ?? null,
      createdAt,
    },
  };
}

export const getCurrentUserProfile = cache(async function getCurrentUserProfile() {
  if (isJavaAuthEnabled()) {
    return getJavaUser();
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get(MOCK_SESSION_COOKIE)?.value;
  if (!userId) return null;
  return findUserBundleByUserId(userId);
});

export async function requireUser() {
  const current = await getCurrentUserProfile();
  if (!current || current.profile.status !== "active") {
    redirect("/login");
  }
  return current;
}

export async function requireAdmin() {
  const current = await requireUser();
  if (current.profile.role !== "admin") {
    redirect("/dashboard");
  }
  return current;
}

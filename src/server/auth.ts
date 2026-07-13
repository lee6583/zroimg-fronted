import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserBundleByUserId } from "@/server/bff/auth";
import { createMockUser, findUserByEmail } from "@/server/bff/mock-store";
import { isJavaAuthEnabled, isMockBffEnabled } from "@/server/env";
import type { MockRole } from "@/server/bff/mock-store";

export const MOCK_SESSION_COOKIE = "zroimg-mock-session";
export const JAVA_SESSION_COOKIE = "zroimg_user_token";

type JavaTokenPayload = {
  userId?: number;
  email?: string;
  username?: string;
  role?: string;
  exp?: number;
};

function parseJavaToken(token: string) {
  const parts = token.split(".");
  const payloadText = parts[1];

  if (!payloadText) {
    return null;
  }

  try {
    const jsonText = Buffer.from(payloadText, "base64url").toString("utf8");
    return JSON.parse(jsonText) as JavaTokenPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: JavaTokenPayload) {
  if (!payload.exp) {
    return false;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}

function readRole(role: string | undefined): MockRole {
  if (role === "admin") {
    return "admin";
  }

  return "user";
}

function getMockProfile(payload: JavaTokenPayload) {
  if (!isMockBffEnabled()) {
    return null;
  }

  const email = payload.email || `${payload.userId}@java-user.local`;
  const username = payload.username || email;
  let bundle = findUserByEmail(email);

  if (!bundle) {
    bundle = createMockUser({
      username,
      email,
      password: "",
    });
  }

  bundle.profile.username = username;
  bundle.profile.role = readRole(payload.role);
  bundle.profile.status = "active";
  return bundle;
}

async function getJavaUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(JAVA_SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = parseJavaToken(token);
  if (!payload || !payload.userId || isExpired(payload)) {
    return null;
  }

  const mockBundle = getMockProfile(payload);
  if (mockBundle) {
    return mockBundle;
  }

  const userId = String(payload.userId);
  const username = payload.username || payload.email || "用户";
  const email = payload.email || "";

  return {
    user: {
      id: userId,
      email,
      password: "",
      name: username,
      createdAt: new Date(0),
    },
    profile: {
      id: userId,
      userId,
      username,
      role: readRole(payload.role),
      status: "active" as const,
      creditBalance: 0,
      bio: "",
      createdAt: new Date(0),
    },
  };
}

export async function getCurrentUserProfile() {
  if (isJavaAuthEnabled()) {
    return getJavaUser();
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get(MOCK_SESSION_COOKIE)?.value;
  if (!userId) return null;
  return findUserBundleByUserId(userId);
}

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

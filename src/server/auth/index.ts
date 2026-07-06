import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserBundleByUserId } from "@/server/mock-store";

export const MOCK_SESSION_COOKIE = "zroimg-mock-session";

export async function getCurrentUserProfile() {
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

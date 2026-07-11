import { JAVA_SESSION_COOKIE, MOCK_SESSION_COOKIE } from "@/server/auth";
import { isJavaAuthEnabled } from "@/server/env";
import { jsonOk } from "@/server/http";

export async function POST() {
  const response = jsonOk({ ok: true as const });
  const cookieName = isJavaAuthEnabled() ? JAVA_SESSION_COOKIE : MOCK_SESSION_COOKIE;

  response.cookies.set(cookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

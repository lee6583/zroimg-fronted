import { MOCK_SESSION_COOKIE } from "@/server/auth";
import { isMockBffEnabled } from "@/server/env";
import { jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";

export async function POST(request: Request) {
  if (!isMockBffEnabled()) {
    return proxyRequestToJavaApi(request, "/auth/user/logout");
  }

  const response = jsonOk({ ok: true as const });
  response.cookies.set(MOCK_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

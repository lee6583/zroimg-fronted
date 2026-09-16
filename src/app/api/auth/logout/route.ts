import { MOCK_SESSION_COOKIE } from "@/server/auth";
import { isJavaAuthEnabled } from "@/server/env";
import { handleApi, jsonOk } from "@/server/http";
import { proxyRequestToJavaApi } from "@/server/java-api";

export async function POST(request: Request) {
  return handleApi(async () => {
    if (isJavaAuthEnabled()) {
      return proxyRequestToJavaApi(request, "/auth/user/logout");
    }

    const response = jsonOk({ message: "退出登录成功" });
    response.cookies.set(MOCK_SESSION_COOKIE, "", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
    return response;
  });
}

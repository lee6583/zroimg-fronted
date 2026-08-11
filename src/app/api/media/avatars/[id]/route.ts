import { proxyRequestToJavaApi } from "@/server/java-api";

export async function GET(request: Request, context: RouteContext<"/api/media/avatars/[id]">) {
  const { id } = await context.params;
  return proxyRequestToJavaApi(request, `/media/public/avatars/${encodeURIComponent(id)}/content`);
}

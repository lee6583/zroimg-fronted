import { proxyRequestToJavaApi } from "@/server/java-api";

export async function GET(
  request: Request,
  context: RouteContext<"/api/media/public-assets/[id]">,
) {
  const { id } = await context.params;
  return proxyRequestToJavaApi(request, `/media/public/assets/${encodeURIComponent(id)}/content`);
}

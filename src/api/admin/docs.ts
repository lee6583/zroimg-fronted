import { request } from "@/utils/request";

export function saveDocsConfig(data: { title: string; description: string; groups: unknown }) {
  return request<{ docs: { title: string; description: string; groups: unknown } }>({
    url: "/api/admin/docs",
    method: "POST",
    data,
  });
}

import { request } from "@/utils/request";
import type { SaveDocsConfigRequest, SaveDocsConfigResponse } from "@/types/content";

function saveDocsConfig(data: SaveDocsConfigRequest) {
  return request<SaveDocsConfigResponse>({
    url: "/api/admin/docs",
    method: "POST",
    data,
  });
}

export const adminDocsApi = {
  saveDocsConfig,
};

import { request } from "@/utils/request";
import type { AdminGenerationModelResponse, SaveAdminGenerationModelRequest } from "@/types/admin";
import type { AdminGenerationModel } from "@/types/admin";

function list() {
  return request<{ models: AdminGenerationModel[] }>({
    url: "/api/admin/models",
  });
}

function create(data: SaveAdminGenerationModelRequest) {
  return request<AdminGenerationModelResponse>({
    url: "/api/admin/models",
    method: "POST",
    data,
  });
}

function update(id: string, data: SaveAdminGenerationModelRequest) {
  return request<AdminGenerationModelResponse>({
    url: `/api/admin/models/${encodeURIComponent(id)}`,
    method: "PUT",
    data,
  });
}

function updateStatus(id: string, status: "enabled" | "disabled") {
  return request<AdminGenerationModelResponse>({
    url: `/api/admin/models/${encodeURIComponent(id)}/status`,
    method: "PATCH",
    data: { status },
  });
}

function setDefault(id: string) {
  return request<AdminGenerationModelResponse>({
    url: `/api/admin/models/${encodeURIComponent(id)}/default`,
    method: "PATCH",
  });
}

function remove(id: string) {
  return request<{ ok: boolean }>({
    url: `/api/admin/models/${encodeURIComponent(id)}`,
    method: "DELETE",
  });
}

export const adminModelsApi = {
  create,
  list,
  remove,
  setDefault,
  update,
  updateStatus,
};

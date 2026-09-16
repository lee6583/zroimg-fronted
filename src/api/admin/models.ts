import { request } from "@/utils/request";
import type {
  AdminGenerationModelsResponse,
  AdminGenerationModelResponse,
  DiscoverProviderModelsRequest,
  DiscoveredProviderModelsResponse,
  ProviderConnectionResponse,
  ProviderConnectionsResponse,
  SaveAdminGenerationModelRequest,
  SaveProviderConnectionRequest,
} from "@/types/admin";

function list() {
  return request<AdminGenerationModelsResponse>({
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

function listConnections() {
  return request<ProviderConnectionsResponse>({
    url: "/api/admin/provider-connections",
  });
}

function createConnection(data: SaveProviderConnectionRequest) {
  return request<ProviderConnectionResponse>({
    url: "/api/admin/provider-connections",
    method: "POST",
    data,
  });
}

function updateConnection(id: string, data: SaveProviderConnectionRequest) {
  return request<ProviderConnectionResponse>({
    url: `/api/admin/provider-connections/${encodeURIComponent(id)}`,
    method: "PUT",
    data,
  });
}

function removeConnection(id: string) {
  return request<{ ok: boolean }>({
    url: `/api/admin/provider-connections/${encodeURIComponent(id)}`,
    method: "DELETE",
  });
}

function discoverConnection(data: DiscoverProviderModelsRequest) {
  return request<DiscoveredProviderModelsResponse>({
    url: "/api/admin/provider-connections/discover",
    method: "POST",
    data,
  });
}

function discoverSavedConnection(id: string) {
  return request<DiscoveredProviderModelsResponse>({
    url: `/api/admin/provider-connections/${encodeURIComponent(id)}/discover`,
    method: "POST",
  });
}

export const adminModelsApi = {
  create,
  createConnection,
  discoverConnection,
  discoverSavedConnection,
  list,
  listConnections,
  remove,
  removeConnection,
  setDefault,
  update,
  updateConnection,
  updateStatus,
};

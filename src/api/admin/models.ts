import { request } from "@/utils/request";
import type {
  AdminGenerationModel,
  DiscoveredProviderModel,
  DiscoverProviderModelsRequest,
  GenerationProviderConnection,
  SaveModelRequest,
  SaveProviderConnectionRequest,
} from "@/types/admin";

const modelsUrl = "/api/generation/admin/models";
const connectionsUrl = "/api/generation/admin/provider-connections";

function create(data: SaveModelRequest) {
  return request<AdminGenerationModel>({
    url: modelsUrl,
    method: "POST",
    data,
  });
}

function update(id: string, data: SaveModelRequest) {
  return request<AdminGenerationModel>({
    url: `${modelsUrl}/${id}`,
    method: "PUT",
    data,
  });
}

function updateStatus(id: string, status: "enabled" | "disabled") {
  return request<AdminGenerationModel>({
    url: `${modelsUrl}/${id}/status`,
    method: "PATCH",
    data: { status },
  });
}

function setDefault(id: string) {
  return request<AdminGenerationModel>({
    url: `${modelsUrl}/${id}/default`,
    method: "PATCH",
  });
}

function remove(id: string) {
  return request<null>({
    url: `${modelsUrl}/${id}`,
    method: "DELETE",
  });
}

function createConnection(data: SaveProviderConnectionRequest) {
  return request<GenerationProviderConnection>({
    url: connectionsUrl,
    method: "POST",
    data,
  });
}

function updateConnection(id: string, data: SaveProviderConnectionRequest) {
  return request<GenerationProviderConnection>({
    url: `${connectionsUrl}/${id}`,
    method: "PUT",
    data,
  });
}

function removeConnection(id: string) {
  return request<null>({
    url: `${connectionsUrl}/${id}`,
    method: "DELETE",
  });
}

function discover(data: DiscoverProviderModelsRequest) {
  return request<DiscoveredProviderModel[]>({
    url: `${connectionsUrl}/discover`,
    method: "POST",
    data,
  });
}

function discoverSaved(id: string) {
  return request<DiscoveredProviderModel[]>({
    url: `${connectionsUrl}/${id}/discover`,
    method: "POST",
  });
}

export const adminModelsApi = {
  create,
  update,
  updateStatus,
  setDefault,
  remove,
  createConnection,
  updateConnection,
  removeConnection,
  discover,
  discoverSaved,
};

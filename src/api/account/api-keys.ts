import { request } from "@/utils/request";
import type {
  ApiKey,
  CreateApiKeyRequest,
  CreateApiKeyResponse,
  RevokeApiKeyResponse,
} from "@/types/api-keys";

function list() {
  return request<ApiKey[]>({ url: "/api/auth/user/api-keys" });
}

function create(data: CreateApiKeyRequest) {
  return request<CreateApiKeyResponse>({
    url: "/api/auth/user/api-keys",
    method: "POST",
    data,
  });
}

function revoke(id: string) {
  return request<RevokeApiKeyResponse>({
    url: `/api/auth/user/api-keys/${encodeURIComponent(id)}`,
    method: "DELETE",
  });
}

export const apiKeysApi = {
  list,
  create,
  revoke,
};

import { request } from "@/utils/request";
import type { AdminPackage, SavePackageRequest } from "@/types/admin";

const baseUrl = "/api/order/admin/packages";

function create(data: SavePackageRequest) {
  return request<AdminPackage>({
    url: baseUrl,
    method: "POST",
    data,
  });
}

function update(id: string, data: SavePackageRequest) {
  return request<AdminPackage>({
    url: `${baseUrl}/${id}`,
    method: "PUT",
    data,
  });
}

function updateStatus(id: string, enabled: boolean) {
  return request<AdminPackage>({
    url: `${baseUrl}/${id}/status`,
    method: "PATCH",
    data: { enabled },
  });
}

function updateRecommend(id: string, recommended: boolean) {
  return request<AdminPackage>({
    url: `${baseUrl}/${id}/recommend`,
    method: "PATCH",
    data: { recommended },
  });
}

function updateSort(id: string, sort: number) {
  return request<AdminPackage>({
    url: `${baseUrl}/${id}/sort`,
    method: "PATCH",
    data: { sort },
  });
}

function remove(id: string) {
  return request<null>({
    url: `${baseUrl}/${id}`,
    method: "DELETE",
  });
}

export const adminPackagesApi = {
  create,
  update,
  updateStatus,
  updateRecommend,
  updateSort,
  remove,
};

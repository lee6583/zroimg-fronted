import { request } from "@/utils/request";
import type { AdminCreditPackageInput, CreditPackage } from "@/types/orders";

type PackageResponse = {
  package: CreditPackage;
};

type PackageListResponse = {
  packages: CreditPackage[];
};

function list() {
  return request<PackageListResponse>({
    url: "/api/admin/packages",
  });
}

function create(data: AdminCreditPackageInput) {
  return request<PackageResponse>({
    url: "/api/admin/packages",
    method: "POST",
    data,
  });
}

function update(id: string, data: AdminCreditPackageInput) {
  return request<PackageResponse>({
    url: `/api/admin/packages/${encodeURIComponent(id)}`,
    method: "PUT",
    data,
  });
}

function updateStatus(id: string, enabled: boolean) {
  return request<PackageResponse>({
    url: `/api/admin/packages/${encodeURIComponent(id)}/status`,
    method: "PATCH",
    data: { enabled },
  });
}

function updateRecommend(id: string, recommended: boolean) {
  return request<PackageResponse>({
    url: `/api/admin/packages/${encodeURIComponent(id)}/recommend`,
    method: "PATCH",
    data: { recommended },
  });
}

function updateSort(id: string, sort: number) {
  return request<PackageResponse>({
    url: `/api/admin/packages/${encodeURIComponent(id)}/sort`,
    method: "PATCH",
    data: { sort },
  });
}

function remove(id: string) {
  return request<{ ok: boolean }>({
    url: `/api/admin/packages/${encodeURIComponent(id)}`,
    method: "DELETE",
  });
}

export const adminPackagesApi = {
  create,
  list,
  remove,
  update,
  updateRecommend,
  updateSort,
  updateStatus,
};

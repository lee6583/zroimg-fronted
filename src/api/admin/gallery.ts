import { request } from "@/utils/request";
import type { PageResult } from "@/types/api";
import type {
  AdminGalleryCategory,
  AdminGallerySubmission,
  AdminGallerySubmissionQuery,
  ApproveGallerySubmissionRequest,
  BatchApproveGalleryRequest,
  BatchApproveGalleryResult,
  ChangeGalleryCategoryRequest,
  GalleryReviewReasonRequest,
  GalleryReviewStats,
  ReorderGalleryCategoriesRequest,
  SaveGalleryCategoryRequest,
} from "@/types/admin";

const baseUrl = "/api/gallery/admin/submissions";

function list(params: AdminGallerySubmissionQuery = {}) {
  return request<PageResult<AdminGallerySubmission>>({ url: baseUrl, params });
}

function approve(id: string, data: ApproveGallerySubmissionRequest = {}) {
  return request<AdminGallerySubmission>({
    url: `${baseUrl}/${encodeURIComponent(id)}/approve`,
    method: "POST",
    data,
  });
}

// 修改任意状态作品的分类（已公开的作品也可以改）
function changeCategory(id: string, data: ChangeGalleryCategoryRequest) {
  return request<AdminGallerySubmission>({
    url: `${baseUrl}/${encodeURIComponent(id)}/category`,
    method: "POST",
    data,
  });
}

function reject(id: string, data: GalleryReviewReasonRequest) {
  return request<AdminGallerySubmission>({
    url: `${baseUrl}/${encodeURIComponent(id)}/reject`,
    method: "POST",
    data,
  });
}

function remove(id: string, data: GalleryReviewReasonRequest) {
  return request<AdminGallerySubmission>({
    url: `${baseUrl}/${encodeURIComponent(id)}/remove`,
    method: "POST",
    data,
  });
}

function batchApprove(data: BatchApproveGalleryRequest) {
  return request<BatchApproveGalleryResult>({
    url: `${baseUrl}/batch-approve`,
    method: "POST",
    data,
  });
}

function stats() {
  return request<GalleryReviewStats>({ url: `${baseUrl}/stats` });
}

export const adminGalleryApi = {
  list,
  approve,
  changeCategory,
  reject,
  remove,
  batchApprove,
  stats,
};

const categoryUrl = "/api/gallery/admin/categories";

function listCategories() {
  return request<AdminGalleryCategory[]>({ url: categoryUrl });
}

function createCategory(data: SaveGalleryCategoryRequest) {
  return request<AdminGalleryCategory>({ url: categoryUrl, method: "POST", data });
}

function updateCategory(id: string, data: SaveGalleryCategoryRequest) {
  return request<AdminGalleryCategory>({
    url: `${categoryUrl}/${encodeURIComponent(id)}`,
    method: "PUT",
    data,
  });
}

function reorderCategories(data: ReorderGalleryCategoriesRequest) {
  return request<AdminGalleryCategory[]>({ url: `${categoryUrl}/reorder`, method: "POST", data });
}

// 分类下有作品时必须传 reassignTo，作品会先转到该分类
function removeCategory(id: string, reassignTo?: string) {
  return request<void>({
    url: `${categoryUrl}/${encodeURIComponent(id)}`,
    method: "DELETE",
    params: { reassignTo },
  });
}

export const adminGalleryCategoryApi = {
  list: listCategories,
  create: createCategory,
  update: updateCategory,
  reorder: reorderCategories,
  remove: removeCategory,
};

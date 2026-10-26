import { request } from "@/utils/request";
import type { PageResult } from "@/types/api";
import type {
  AdminGallerySubmission,
  AdminGallerySubmissionQuery,
  ApproveGallerySubmissionRequest,
  BatchApproveGalleryRequest,
  BatchApproveGalleryResult,
  GalleryReviewReasonRequest,
  GalleryReviewStats,
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
  reject,
  remove,
  batchApprove,
  stats,
};

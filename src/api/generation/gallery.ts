import { request } from "@/utils/request";
import type { PageResult } from "@/types/api";
import type {
  GalleryImage,
  GalleryImageQuery,
  GallerySubmission,
  GallerySubmissionQuery,
  PublishGalleryRequest,
} from "@/types/gallery";

function listPublicImages(params: GalleryImageQuery = {}) {
  return request<PageResult<GalleryImage>>({ url: "/api/gallery/public/images", params });
}

function publishImage(data: PublishGalleryRequest) {
  return request<GalleryImage>({ url: "/api/gallery/user/publish", method: "POST", data });
}

function withdrawImage(generatedImageId: string) {
  return request<void>({
    url: `/api/gallery/user/publish/${encodeURIComponent(generatedImageId)}`,
    method: "DELETE",
  });
}

function listSubmissions(params: GallerySubmissionQuery = {}) {
  return request<PageResult<GallerySubmission>>({
    url: "/api/gallery/user/submissions",
    params,
  });
}

export const galleryApi = {
  listPublicImages,
  publishImage,
  withdrawImage,
  listSubmissions,
};

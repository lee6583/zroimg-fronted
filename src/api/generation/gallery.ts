import { request } from "@/utils/request";
import type { PageResult } from "@/types/api";
import type {
  GalleryCategoryOption,
  GalleryCreator,
  GalleryCursorPage,
  GalleryImage,
  GalleryImageQuery,
  GalleryLikeResult,
  GallerySubmission,
  GallerySubmissionQuery,
  PublishGalleryRequest,
} from "@/types/gallery";

function listPublicImages(params: GalleryImageQuery = {}) {
  return request<GalleryCursorPage<GalleryImage>>({ url: "/api/gallery/public/images", params });
}

function getPublicImage(id: string) {
  return request<GalleryImage>({ url: `/api/gallery/public/images/${encodeURIComponent(id)}` });
}

function listCategories() {
  return request<GalleryCategoryOption[]>({ url: "/api/gallery/public/categories" });
}

function getCreator(userId: string) {
  return request<GalleryCreator>({
    url: `/api/gallery/public/creators/${encodeURIComponent(userId)}`,
  });
}

function like(id: string) {
  return request<GalleryLikeResult>({
    url: `/api/gallery/user/images/${encodeURIComponent(id)}/like`,
    method: "POST",
  });
}

function unlike(id: string) {
  return request<GalleryLikeResult>({
    url: `/api/gallery/user/images/${encodeURIComponent(id)}/like`,
    method: "DELETE",
  });
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
  getPublicImage,
  listCategories,
  getCreator,
  like,
  unlike,
  publishImage,
  withdrawImage,
  listSubmissions,
};

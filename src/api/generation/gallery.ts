import { request } from "@/utils/request";
import type { PageResult } from "@/types/api";
import type { GalleryImage, GalleryImageQuery, PublishGalleryRequest } from "@/types/gallery";

function listPublicImages(params: GalleryImageQuery = {}) {
  return request<PageResult<GalleryImage>>({ url: "/api/gallery/public/images", params });
}

function publishImage(data: PublishGalleryRequest) {
  return request<GalleryImage>({ url: "/api/gallery/user/publish", method: "POST", data });
}

function unpublishImage(generatedImageId: string) {
  return request<void>({
    url: `/api/gallery/user/publish/${encodeURIComponent(generatedImageId)}`,
    method: "DELETE",
  });
}

export const galleryApi = {
  listPublicImages,
  publishImage,
  unpublishImage,
};

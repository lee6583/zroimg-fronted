import { request } from "@/utils/request";
import type { PublishGalleryImageRequest, PublishGalleryImageResponse } from "@/types/generation";

function publishImage(data: PublishGalleryImageRequest) {
  return request<PublishGalleryImageResponse>({
    url: "/api/gallery/publish",
    method: "POST",
    data,
  });
}

export const galleryApi = {
  publishImage,
};

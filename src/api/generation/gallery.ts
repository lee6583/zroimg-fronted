import { request } from "@/utils/request";

export function publishGalleryImage(data: { generatedImageId: string }) {
  return request<{ ok?: boolean }>({
    url: "/api/gallery/publish",
    method: "POST",
    data,
  });
}

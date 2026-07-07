import { request } from "@/utils/request";

export function createFavoriteCollection(data: { name: string }) {
  return request<{ collection: unknown }>({
    url: "/api/favorite-collections",
    method: "POST",
    data,
  });
}

export function updateFavoriteCollection(collectionId: string, data: { name: string }) {
  return request<{ collection: unknown }>({
    url: `/api/favorite-collections/${collectionId}`,
    method: "PATCH",
    data,
  });
}

export function deleteFavoriteCollection(collectionId: string) {
  return request<{ ok?: boolean }>({
    url: `/api/favorite-collections/${collectionId}`,
    method: "DELETE",
  });
}

export function addImageToFavoriteCollection(collectionId: string, data: { generatedImageId: string }) {
  return request<{ ok?: boolean }>({
    url: `/api/favorite-collections/${collectionId}/images`,
    method: "POST",
    data,
  });
}

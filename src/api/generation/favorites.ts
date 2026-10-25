import { request } from "@/utils/request";
import type {
  FavoriteCollection,
  FavoriteCollectionRequest,
  FavoriteImageRequest,
} from "@/types/favorites";

const baseUrl = "/api/favorite/user/collections";

function listCollections() {
  return request<FavoriteCollection[]>({ url: baseUrl });
}

function getCollection(collectionId: string) {
  return request<FavoriteCollection>({
    url: `${baseUrl}/${encodeURIComponent(collectionId)}`,
  });
}

function createCollection(data: FavoriteCollectionRequest) {
  return request<FavoriteCollection>({ url: baseUrl, method: "POST", data });
}

function updateCollection(collectionId: string, data: FavoriteCollectionRequest) {
  return request<FavoriteCollection>({
    url: `${baseUrl}/${encodeURIComponent(collectionId)}`,
    method: "PATCH",
    data,
  });
}

function deleteCollection(collectionId: string) {
  return request<void>({
    url: `${baseUrl}/${encodeURIComponent(collectionId)}`,
    method: "DELETE",
  });
}

function addImage(collectionId: string, data: FavoriteImageRequest) {
  return request<void>({
    url: `${baseUrl}/${encodeURIComponent(collectionId)}/images`,
    method: "POST",
    data,
  });
}

function removeImage(collectionId: string, data: FavoriteImageRequest) {
  return request<void>({
    url: `${baseUrl}/${encodeURIComponent(collectionId)}/images`,
    method: "DELETE",
    data,
  });
}

export const favoriteCollectionsApi = {
  listCollections,
  getCollection,
  createCollection,
  updateCollection,
  deleteCollection,
  addImage,
  removeImage,
};

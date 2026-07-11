import { request } from "@/utils/request";
import type {
  AddImageToFavoriteCollectionRequest,
  AddImageToFavoriteCollectionResponse,
  CreateFavoriteCollectionRequest,
  DeleteFavoriteCollectionResponse,
  FavoriteCollectionMutationResponse,
  UpdateFavoriteCollectionRequest,
} from "@/types/generation";

function createCollection(data: CreateFavoriteCollectionRequest) {
  return request<FavoriteCollectionMutationResponse>({
    url: "/api/favorite-collections",
    method: "POST",
    data,
  });
}

function updateCollection(collectionId: string, data: UpdateFavoriteCollectionRequest) {
  return request<FavoriteCollectionMutationResponse>({
    url: `/api/favorite-collections/${collectionId}`,
    method: "PATCH",
    data,
  });
}

function deleteCollection(collectionId: string) {
  return request<DeleteFavoriteCollectionResponse>({
    url: `/api/favorite-collections/${collectionId}`,
    method: "DELETE",
  });
}

function addImage(collectionId: string, data: AddImageToFavoriteCollectionRequest) {
  return request<AddImageToFavoriteCollectionResponse>({
    url: `/api/favorite-collections/${collectionId}/images`,
    method: "POST",
    data,
  });
}

export const favoriteCollectionsApi = {
  createCollection,
  updateCollection,
  deleteCollection,
  addImage,
};

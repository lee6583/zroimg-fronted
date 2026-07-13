import { getStore, nextId } from "@/server/bff/mock-store";

export async function listFavoriteCollections(userProfileId: string) {
  const store = getStore();

  return store.favoriteCollections
    .filter((item) => item.userProfileId === userProfileId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .map((collection) => ({
      ...collection,
      _count: {
        items: store.favoriteCollectionItems.filter((item) => item.collectionId === collection.id).length,
      },
    }));
}

export async function createFavoriteCollection(userProfileId: string, name: string) {
  const store = getStore();
  const collection = {
    id: nextId("favoriteCollection"),
    userProfileId,
    name: name.trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.favoriteCollections.unshift(collection);
  return collection;
}

export async function updateFavoriteCollectionName(userProfileId: string, collectionId: string, name: string) {
  const store = getStore();
  const collection = store.favoriteCollections.find((item) => item.id === collectionId && item.userProfileId === userProfileId);
  if (!collection) {
    throw new Error("合集不存在");
  }
  collection.name = name.trim();
  return collection;
}

export async function deleteFavoriteCollection(userProfileId: string, collectionId: string) {
  const store = getStore();
  const index = store.favoriteCollections.findIndex((item) => item.id === collectionId && item.userProfileId === userProfileId);
  if (index < 0) {
    throw new Error("合集不存在");
  }
  store.favoriteCollections.splice(index, 1);
  store.favoriteCollectionItems = store.favoriteCollectionItems.filter((item) => item.collectionId !== collectionId);
}

export async function addImageToFavoriteCollection(userProfileId: string, collectionId: string, generatedImageId: string) {
  const store = getStore();
  const collection = store.favoriteCollections.find((item) => item.id === collectionId && item.userProfileId === userProfileId);
  if (!collection) {
    throw new Error("合集不存在");
  }
  const exists = store.favoriteCollectionItems.find((item) => item.collectionId === collectionId && item.generatedImageId === generatedImageId);
  if (exists) return exists;

  const item = {
    id: nextId("favoriteCollectionItem"),
    collectionId,
    generatedImageId,
    createdAt: new Date(),
  };
  store.favoriteCollectionItems.unshift(item);
  collection.updatedAt = new Date();
  return item;
}

export async function getFavoriteCollectionForUser(userProfileId: string, collectionId: string) {
  const store = getStore();
  const collection = store.favoriteCollections.find((item) => item.id === collectionId && item.userProfileId === userProfileId);
  if (!collection) return null;

  const items = store.favoriteCollectionItems
    .filter((item) => item.collectionId === collectionId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((item) => {
      const generatedImage = store.generatedImages.find((image) => image.id === item.generatedImageId)!;
      const outputAsset = store.mediaAssets.find((asset) => asset.id === generatedImage.outputAssetId)!;
      const thumbnailAsset = generatedImage.thumbnailAssetId
        ? store.mediaAssets.find((asset) => asset.id === generatedImage.thumbnailAssetId) || null
        : null;
      const task = store.generationTasks.find((entry) => entry.id === generatedImage.taskId)!;

      return {
        ...item,
        generatedImage: {
          ...generatedImage,
          outputAsset,
          thumbnailAsset,
          task,
        },
      };
    });

  return {
    ...collection,
    _count: {
      items: items.length,
    },
    items,
  };
}

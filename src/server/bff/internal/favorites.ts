import { getStore, nextId } from "@/server/bff/mock-store";

function findThumbnail(thumbnailId: string | null) {
  if (!thumbnailId) {
    return null;
  }

  const store = getStore();
  const asset = store.mediaAssets.find((item) => item.id === thumbnailId);
  if (!asset) {
    return null;
  }

  return asset;
}

export async function listCollections(profileId: string) {
  const store = getStore();

  return store.favoriteCollections
    .filter((item) => item.userProfileId === profileId)
    .sort((a, b) => {
      const timeA = a.updatedAt.getTime();
      const timeB = b.updatedAt.getTime();
      return timeB - timeA;
    })
    .map((collection) => {
      const items = store.favoriteCollectionItems.filter(
        (item) => item.collectionId === collection.id,
      );
      const count = items.length;

      return {
        ...collection,
        _count: {
          items: count,
        },
      };
    });
}

export async function createCollection(profileId: string, name: string) {
  const store = getStore();
  const collection = {
    id: nextId("favoriteCollection"),
    userProfileId: profileId,
    name: name.trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  store.favoriteCollections.unshift(collection);
  return collection;
}

export async function updateName(profileId: string, collectionId: string, name: string) {
  const store = getStore();
  const collection = store.favoriteCollections.find(
    (item) => item.id === collectionId && item.userProfileId === profileId,
  );
  if (!collection) {
    throw new Error("合集不存在");
  }
  collection.name = name.trim();
  collection.updatedAt = new Date();
  return collection;
}

export async function deleteCollection(profileId: string, collectionId: string) {
  const store = getStore();
  const index = store.favoriteCollections.findIndex(
    (item) => item.id === collectionId && item.userProfileId === profileId,
  );
  if (index < 0) {
    throw new Error("合集不存在");
  }
  store.favoriteCollections.splice(index, 1);
  store.favoriteCollectionItems = store.favoriteCollectionItems.filter(
    (item) => item.collectionId !== collectionId,
  );
}

export async function addImage(profileId: string, collectionId: string, imageId: string) {
  const store = getStore();
  const collection = store.favoriteCollections.find(
    (item) => item.id === collectionId && item.userProfileId === profileId,
  );
  if (!collection) {
    throw new Error("合集不存在");
  }
  const image = store.generatedImages.find(
    (item) => item.id === imageId && item.userProfileId === profileId,
  );
  if (!image) {
    throw new Error("作品不存在");
  }
  const exists = store.favoriteCollectionItems.find(
    (item) => item.collectionId === collectionId && item.generatedImageId === imageId,
  );
  if (exists) return exists;

  const item = {
    id: nextId("favoriteCollectionItem"),
    collectionId,
    generatedImageId: imageId,
    createdAt: new Date(),
  };
  store.favoriteCollectionItems.unshift(item);
  collection.updatedAt = new Date();
  return item;
}

export async function getCollection(profileId: string, collectionId: string) {
  const store = getStore();
  const collection = store.favoriteCollections.find(
    (item) => item.id === collectionId && item.userProfileId === profileId,
  );
  if (!collection) return null;

  const items = store.favoriteCollectionItems
    .filter((item) => item.collectionId === collectionId)
    .sort((a, b) => {
      const timeA = a.createdAt.getTime();
      const timeB = b.createdAt.getTime();
      return timeB - timeA;
    })
    .map((item) => {
      const generatedImage = store.generatedImages.find(
        (image) => image.id === item.generatedImageId,
      )!;
      const outputAsset = store.mediaAssets.find(
        (asset) => asset.id === generatedImage.outputAssetId,
      )!;
      const thumbnailAsset = findThumbnail(generatedImage.thumbnailAssetId);
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

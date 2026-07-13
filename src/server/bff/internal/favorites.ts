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

  // 第一步：找出当前用户自己的收藏合集。
  const collections = store.favoriteCollections.filter((collection) => {
    return collection.userProfileId === profileId;
  });

  // 第二步：按照更新时间，从新到旧排序。
  collections.sort((collectionA, collectionB) => {
    const timeA = collectionA.updatedAt.getTime();
    const timeB = collectionB.updatedAt.getTime();

    return timeB - timeA;
  });

  // 第三步：给每个合集补充收藏数量。
  const collectionsWithCount = collections.map((collection) => {
    const items = store.favoriteCollectionItems.filter((item) => {
      return item.collectionId === collection.id;
    });
    const count = items.length;

    const collectionCount = {
      items: count,
    };

    const result = {
      ...collection,
      _count: collectionCount,
    };

    return result;
  });

  return collectionsWithCount;
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

  // 第一步：找出当前合集里的收藏项。
  const items = store.favoriteCollectionItems.filter((item) => {
    return item.collectionId === collectionId;
  });

  // 第二步：按照收藏时间，从新到旧排序。
  items.sort((itemA, itemB) => {
    const timeA = itemA.createdAt.getTime();
    const timeB = itemB.createdAt.getTime();

    return timeB - timeA;
  });

  // 第三步：给每个收藏项补充图片、资源和任务信息。
  const itemsWithImage = items.map((item) => {
    const generatedImage = store.generatedImages.find((image) => {
      return image.id === item.generatedImageId;
    });

    if (!generatedImage) {
      throw new Error(`没有找到收藏图片：${item.generatedImageId}`);
    }

    const outputAsset = store.mediaAssets.find((asset) => {
      return asset.id === generatedImage.outputAssetId;
    });

    if (!outputAsset) {
      throw new Error(`没有找到图片资源：${generatedImage.outputAssetId}`);
    }

    const thumbnailAsset = findThumbnail(generatedImage.thumbnailAssetId);
    const task = store.generationTasks.find((entry) => {
      return entry.id === generatedImage.taskId;
    });

    if (!task) {
      throw new Error(`没有找到生成任务：${generatedImage.taskId}`);
    }

    const imageWithAssets = {
      ...generatedImage,
      outputAsset: outputAsset,
      thumbnailAsset: thumbnailAsset,
      task: task,
    };

    const result = {
      ...item,
      generatedImage: imageWithAssets,
    };

    return result;
  });

  const count = {
    items: itemsWithImage.length,
  };

  const result = {
    ...collection,
    _count: count,
    items: itemsWithImage,
  };

  return result;
}

import { getStore } from "@/server/bff/mock-store";

function getCurrentMonthRange(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  return { start, end };
}

function isInRange(date: Date, start: Date, end: Date) {
  const time = date.getTime();
  const startTime = start.getTime();
  const endTime = end.getTime();

  return time >= startTime && time < endTime;
}

export async function getDashboardStats(profileId: string) {
  const store = getStore();
  const monthRange = getCurrentMonthRange();

  // 第一步：找出当前用户生成过的全部图片。
  const generatedImages = store.generatedImages.filter((image) => {
    return image.userProfileId === profileId;
  });

  // 第二步：从全部生成图片里筛出本月生成的图片。
  const monthlyImages = generatedImages.filter((image) => {
    return isInRange(image.createdAt, monthRange.start, monthRange.end);
  });

  // 第三步：找出当前用户自己的收藏合集。
  const collections = store.favoriteCollections.filter((collection) => {
    return collection.userProfileId === profileId;
  });

  const collectionIds = collections.map((collection) => {
    return collection.id;
  });

  // 第四步：统计这些合集里一共收藏了多少张图片。
  const favoriteItems = store.favoriteCollectionItems.filter((item) => {
    return collectionIds.includes(item.collectionId);
  });

  const result = {
    generatedCount: generatedImages.length,
    monthlyGeneratedCount: monthlyImages.length,
    favoriteCount: favoriteItems.length,
  };

  return result;
}

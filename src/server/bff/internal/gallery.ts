import { getStore, type MockGalleryCategory } from "@/server/bff/mock-store";

export type GalleryCategory = MockGalleryCategory;

export function normalizeCategory(input?: string | string[]) {
  let value = input;
  if (Array.isArray(input)) {
    value = input[0];
  }

  if (value === "realistic" || value === "anime" || value === "art" || value === "other") {
    return value;
  }

  return undefined;
}

function categoryFromPrompt(prompt: string): GalleryCategory {
  const isAnime = /动漫|二次元|anime/i.test(prompt);
  if (isAnime) {
    return "anime";
  }

  const isArt = /画|插画|art|水彩|油画/i.test(prompt);
  if (isArt) {
    return "art";
  }

  const isRealistic = /写实|realistic|产品|摄影/i.test(prompt);
  if (isRealistic) {
    return "realistic";
  }

  return "other";
}

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

export async function listPublicImages(category?: GalleryCategory) {
  const store = getStore();

  // 第一步：只保留公开展示的画廊图片。
  let items = store.galleryImages.filter((item) => {
    return item.isPublic;
  });

  // 第二步：如果选择了分类，只保留对应分类。
  if (category) {
    items = items.filter((item) => {
      return item.category === category;
    });
  }

  // 第三步：按照发布时间，从新到旧排序。
  items.sort((itemA, itemB) => {
    const timeA = itemA.createdAt.getTime();
    const timeB = itemB.createdAt.getTime();

    return timeB - timeA;
  });

  // 第四步：给画廊图片补充原图资源和用户信息。
  const images = items.map((item) => {
    const image = store.generatedImages.find((generatedImage) => {
      return generatedImage.id === item.generatedImageId;
    });

    if (!image) {
      throw new Error(`没有找到画廊原图：${item.generatedImageId}`);
    }

    const outputAsset = store.mediaAssets.find((asset) => {
      return asset.id === image.outputAssetId;
    });

    if (!outputAsset) {
      throw new Error(`没有找到图片资源：${image.outputAssetId}`);
    }

    const thumbnailAsset = findThumbnail(image.thumbnailAssetId);
    const userProfile = store.profiles.find((profile) => {
      return profile.id === item.userProfileId;
    });

    if (!userProfile) {
      throw new Error(`没有找到画廊用户资料：${item.userProfileId}`);
    }

    const user = store.users.find((entry) => {
      return entry.id === userProfile.userId;
    });

    if (!user) {
      throw new Error(`没有找到画廊用户：${userProfile.userId}`);
    }

    const generatedImage = {
      ...image,
      outputAsset: outputAsset,
      thumbnailAsset: thumbnailAsset,
    };

    const profileWithUser = {
      ...userProfile,
      user: user,
    };

    const result = {
      ...item,
      generatedImage: generatedImage,
      userProfile: profileWithUser,
    };

    return result;
  });

  return images;
}

export async function publishImage(imageId: string, userId: string) {
  const store = getStore();
  const existing = store.galleryImages.find((item) => item.generatedImageId === imageId);
  if (existing) return existing;

  const image = store.generatedImages.find((item) => item.id === imageId);
  if (!image) {
    throw new Error("作品不存在");
  }

  const task = store.generationTasks.find((item) => item.id === image.taskId);
  if (!task) {
    throw new Error("生成任务不存在");
  }

  const galleryImage = {
    id: `gallery-${Date.now()}`,
    generatedImageId: imageId,
    userProfileId: userId,
    prompt: task.prompt,
    title: task.prompt.slice(0, 18),
    category: categoryFromPrompt(task.prompt),
    isPublic: true,
    createdAt: new Date(),
  } as const;

  store.galleryImages.unshift(galleryImage);
  return galleryImage;
}

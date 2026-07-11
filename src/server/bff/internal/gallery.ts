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
  if (/动漫|二次元|anime/i.test(prompt)) return "anime";
  if (/画|插画|art|水彩|油画/i.test(prompt)) return "art";
  if (/写实|realistic|产品|摄影/i.test(prompt)) return "realistic";
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

  return store.galleryImages
    .filter((item) => item.isPublic)
    .filter((item) => {
      if (!category) {
        return true;
      }

      return item.category === category;
    })
    .sort((a, b) => {
      const timeA = a.createdAt.getTime();
      const timeB = b.createdAt.getTime();
      return timeB - timeA;
    })
    .map((item) => {
      const image = store.generatedImages.find((image) => image.id === item.generatedImageId)!;
      const outputAsset = store.mediaAssets.find((asset) => asset.id === image.outputAssetId)!;
      const thumbnailAsset = findThumbnail(image.thumbnailAssetId);
      const userProfile = store.profiles.find((profile) => profile.id === item.userProfileId)!;
      const user = store.users.find((entry) => entry.id === userProfile.userId)!;

      return {
        ...item,
        generatedImage: {
          ...image,
          outputAsset,
          thumbnailAsset,
        },
        userProfile: {
          ...userProfile,
          user,
        },
      };
    });
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

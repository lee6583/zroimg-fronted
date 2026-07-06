import { getStore, type MockGalleryCategory } from "@/server/mock-store";

export type GalleryCategory = MockGalleryCategory;

export function normalizeGalleryCategory(input?: string | string[]) {
  const value = Array.isArray(input) ? input[0] : input;
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

export async function listPublicGalleryImages(category?: GalleryCategory) {
  const store = getStore();

  return store.galleryImages
    .filter((item) => item.isPublic)
    .filter((item) => (category ? item.category === category : true))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((item) => {
      const generatedImage = store.generatedImages.find((image) => image.id === item.generatedImageId)!;
      const outputAsset = store.mediaAssets.find((asset) => asset.id === generatedImage.outputAssetId)!;
      const thumbnailAsset = generatedImage.thumbnailAssetId
        ? store.mediaAssets.find((asset) => asset.id === generatedImage.thumbnailAssetId) || null
        : null;
      const userProfile = store.profiles.find((profile) => profile.id === item.userProfileId)!;
      const user = store.users.find((entry) => entry.id === userProfile.userId)!;

      return {
        ...item,
        generatedImage: {
          ...generatedImage,
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

export async function publishGeneratedImage(generatedImageId: string, userProfileId: string) {
  const store = getStore();
  const existing = store.galleryImages.find((item) => item.generatedImageId === generatedImageId);
  if (existing) return existing;

  const generatedImage = store.generatedImages.find((item) => item.id === generatedImageId);
  if (!generatedImage) {
    throw new Error("作品不存在");
  }
  const task = store.generationTasks.find((item) => item.id === generatedImage.taskId);
  if (!task) {
    throw new Error("生成任务不存在");
  }

  const galleryImage = {
    id: `gallery-${Date.now()}`,
    generatedImageId,
    userProfileId,
    prompt: task.prompt,
    title: task.prompt.slice(0, 18),
    category: categoryFromPrompt(task.prompt),
    isPublic: true,
    createdAt: new Date(),
  } as const;

  store.galleryImages.unshift(galleryImage);
  return galleryImage;
}

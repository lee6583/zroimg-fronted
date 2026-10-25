type GalleryCategory = "realistic" | "anime" | "art" | "other";

type GalleryImageAsset = {
  id: string;
  fileName: string;
  width: number | null;
  height: number | null;
};

/** Java GalleryImageVO */
type GalleryImage = {
  id: string;
  generatedImageId: string;
  userId: string;
  prompt: string;
  title: string;
  category: GalleryCategory;
  isPublic: boolean;
  createdAt: string;
  generatedImage: {
    id: string;
    width: number | null;
    height: number | null;
    outputAsset: GalleryImageAsset;
    thumbnailAsset: GalleryImageAsset | null;
  };
  userProfile: {
    username: string | null;
    user: {
      name: string | null;
    } | null;
  };
};

/** Java GalleryImageQuery */
type GalleryImageQuery = {
  pageNo?: number;
  pageSize?: number;
  category?: GalleryCategory;
};

/** Java PublishGalleryDTO */
type PublishGalleryRequest = {
  generatedImageId: string;
};

export type {
  GalleryCategory,
  GalleryImageAsset,
  GalleryImage,
  GalleryImageQuery,
  PublishGalleryRequest,
};

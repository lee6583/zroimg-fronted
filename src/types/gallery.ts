type GalleryCategory = "realistic" | "anime" | "art" | "other";

type GalleryStatus = "pending" | "approved" | "rejected" | "withdrawn" | "removed";

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
  status: GalleryStatus;
  rejectReason: string | null;
  submitTime: string | null;
  reviewTime: string | null;
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

/** Java GallerySubmissionVO */
type GallerySubmission = {
  id: string;
  generatedImageId: string;
  prompt: string;
  category: GalleryCategory;
  status: GalleryStatus;
  rejectReason: string | null;
  submitTime: string | null;
  reviewTime: string | null;
  imageUrl: string;
};

/** Java GallerySubmissionQuery */
type GallerySubmissionQuery = {
  pageNo?: number;
  pageSize?: number;
  status?: GalleryStatus;
};

export type {
  GalleryCategory,
  GalleryStatus,
  GallerySubmission,
  GallerySubmissionQuery,
  GalleryImageAsset,
  GalleryImage,
  GalleryImageQuery,
  PublishGalleryRequest,
};

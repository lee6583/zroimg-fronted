// 分类由后台管理（gallery_category），前端只把 code 当作字符串使用
type GalleryCategory = string;

type GalleryStatus = "pending" | "approved" | "rejected" | "withdrawn" | "removed";

/** Java GalleryCategoryVO：启用中的分类，name 已按 Accept-Language 本地化 */
type GalleryCategoryOption = {
  code: GalleryCategory;
  name: string;
};

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
  // 列表接口截断到 300 字（只用于 alt / 结构化数据），详情接口返回完整提示词
  prompt: string;
  title: string;
  category: GalleryCategory;
  categoryName: string;
  modelName: string | null;
  likeCount: number;
  liked: boolean;
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
    // 原图（查看原图）/ 缩略图（最长边 768，卡片）/ 预览图（最长边 1600，详情）
    imageUrl: string;
    thumbnailUrl: string;
    previewUrl: string;
    thumbWidth: number | null;
    thumbHeight: number | null;
    // 模糊占位 data URI，首次请求时可能为 null（后台异步补齐）
    lqip: string | null;
  };
  userProfile: {
    username: string | null;
    avatarUrl: string | null;
    user: {
      name: string | null;
    } | null;
  };
};

/** Java GalleryImageQuery（游标分页） */
type GalleryImageQuery = {
  category?: GalleryCategory;
  cursor?: string;
  limit?: number;
};

/** Java GalleryCursorPageVO */
type GalleryCursorPage<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

/** Java GalleryLikeVO */
type GalleryLikeResult = {
  galleryImageId: string;
  liked: boolean;
  likeCount: number;
};

/** Java GalleryCreatorVO：只含公开信息 */
type GalleryCreator = {
  userId: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  joinedAt: string;
  imageCount: number;
  videoCount: number;
  publishedCount: number;
};

/** Java PublishGalleryDTO */
type PublishGalleryRequest = {
  generatedImageId: string;
  // 用户建议的分类，审核员最终决定
  category?: GalleryCategory;
};

/** Java GallerySubmissionVO */
type GallerySubmission = {
  id: string;
  generatedImageId: string;
  prompt: string;
  category: GalleryCategory;
  categoryName: string;
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
  GalleryCategoryOption,
  GalleryCreator,
  GalleryCursorPage,
  GalleryLikeResult,
  GalleryStatus,
  GallerySubmission,
  GallerySubmissionQuery,
  GalleryImageAsset,
  GalleryImage,
  GalleryImageQuery,
  PublishGalleryRequest,
};

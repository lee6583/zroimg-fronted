export const maxImageFiles = 4;
export const maxImageBytes = 10 * 1024 * 1024;
export const imageMimeTypes = ["image/png", "image/jpeg", "image/webp"] as const;

export function isSupportedImageType(type: string) {
  return imageMimeTypes.some((item) => item === type);
}

// 浏览器访问 Java 媒体接口的地址（经 nginx /api 转发，不经过 Next）
export function userAssetUrl(assetId: string) {
  return `/api/media/user/assets/${encodeURIComponent(assetId)}/content`;
}

export function userAssetDownloadUrl(assetId: string) {
  return `/api/media/user/assets/${encodeURIComponent(assetId)}/download`;
}

export function publicAssetUrl(resultId: string) {
  return `/api/media/public/assets/${encodeURIComponent(resultId)}/content`;
}

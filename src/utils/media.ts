export const maxImageFiles = 4;
export const maxImageBytes = 20 * 1024 * 1024;
export const imageMimeTypes = ["image/png", "image/jpeg", "image/webp"] as const;

export function isSupportedImageType(type: string) {
  return imageMimeTypes.some((item) => item === type);
}

// 浏览器访问 Java 媒体接口的地址（经 nginx /api 转发，不经过 Next）
export function userAssetUrl(assetId: string) {
  return `/api/media/user/assets/${encodeURIComponent(assetId)}/content`;
}

// 缩略图（最长边 768）：画布、列表、卡片等小尺寸展示一律用它，不加载原图
export function userAssetThumbnailUrl(assetId: string) {
  return `/api/media/user/assets/${encodeURIComponent(assetId)}/thumbnail`;
}

// 预览图（最长边 1600）：画布放大查看时替换缩略图
export function userAssetPreviewUrl(assetId: string) {
  return `/api/media/user/assets/${encodeURIComponent(assetId)}/preview`;
}

export function userAssetDownloadUrl(assetId: string) {
  return `/api/media/user/assets/${encodeURIComponent(assetId)}/download`;
}

export function publicAssetUrl(resultId: string) {
  return `/api/media/public/assets/${encodeURIComponent(resultId)}/content`;
}

export function publicAssetThumbnailUrl(resultId: string) {
  return `/api/media/public/assets/${encodeURIComponent(resultId)}/thumbnail`;
}

const userContentPattern = /^\/api\/media\/user\/assets\/([^/?#]+)\/content$/;

// 后端只返回原图地址（.../content）的列表，把它换成同一资源的缩略图地址；其他地址原样返回
export function toThumbnailUrl(url: string) {
  const match = userContentPattern.exec(url);
  if (!match) {
    return url;
  }

  return `/api/media/user/assets/${match[1]}/thumbnail`;
}

export const maxPreviewIds = 100;

// 批量查询预览信息时按接口上限分批，去掉空值和重复
export function chunkIds(ids: string[], size = maxPreviewIds) {
  const unique = Array.from(new Set(ids.filter(Boolean)));
  const chunks: string[][] = [];
  for (let index = 0; index < unique.length; index += size) {
    chunks.push(unique.slice(index, index + size));
  }

  return chunks;
}

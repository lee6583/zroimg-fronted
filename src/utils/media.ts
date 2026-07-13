export const maxImageFiles = 4;
export const maxImageBytes = 10 * 1024 * 1024;
export const imageMimeTypes = ["image/png", "image/jpeg", "image/webp"] as const;

export function isSupportedImageType(type: string) {
  return imageMimeTypes.some((item) => item === type);
}

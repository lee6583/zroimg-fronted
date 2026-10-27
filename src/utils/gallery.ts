import type { GalleryStatus } from "@/types/gallery";

export const galleryStatusLabels: Record<GalleryStatus, string> = {
  pending: "审核中",
  approved: "已公开",
  rejected: "未通过",
  withdrawn: "已撤回",
  removed: "已下架",
};

export function isGalleryStatus(value: string | undefined): value is GalleryStatus {
  return value !== undefined && Object.hasOwn(galleryStatusLabels, value);
}

export function formatGalleryTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return value.slice(0, 16).replace("T", " ");
}

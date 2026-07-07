import { createMediaAsset, getStore } from "@/server/bff/mock-store";

export async function uploadMedia(input: {
  ownerUserProfileId: string;
  fileName: string | null;
  kind: "input" | "output";
}) {
  return createMediaAsset({
    ownerUserProfileId: input.ownerUserProfileId,
    fileName: input.fileName,
    kind: input.kind,
    label: input.fileName || "上传图片",
  });
}

export async function getMediaSignedUrl(assetId: string) {
  // TODO(java-backend): replace this mock signed URL with real OSS/MinIO temporary URLs.
  const asset = getStore().mediaAssets.find((item) => item.id === assetId);
  return asset?.url || "";
}

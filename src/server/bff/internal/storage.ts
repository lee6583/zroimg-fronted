import { createMediaAsset, getStore } from "@/server/bff/mock-store";

function normalizeMockSvgDataUrl(url: string) {
  const prefix = "data:image/svg+xml;base64,";
  const safeDescription =
    '<text x="96" y="622" font-size="24" fill="#525252" font-family="Inter, sans-serif">Frontend preview</text>\n      <text x="96" y="658" font-size="24" fill="#525252" font-family="Inter, sans-serif">Before Java backend integration</text>';

  if (!url.startsWith(prefix)) {
    return url;
  }

  try {
    let svg = Buffer.from(url.slice(prefix.length), "base64").toString("utf8");
    if (!svg.includes("ZroImg Mock Output")) {
      return url;
    }

    svg = svg
      .replace(
        '<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768">',
        '<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768" overflow="hidden">',
      )
      .replace(
        '<text x="96" y="628" font-size="28" fill="#525252" font-family="Inter, sans-serif">Frontend preview before Java backend integration</text>',
        safeDescription,
      )
      .replace(
        '<text x="96" y="622" font-size="26" fill="#525252" font-family="Inter, sans-serif">Mock preview before Java backend</text>\n      <text x="96" y="660" font-size="26" fill="#525252" font-family="Inter, sans-serif">and real image storage integration</text>',
        safeDescription,
      )
      .replace(
        '<text x="96" y="628" font-size="26" fill="#525252" font-family="Inter, sans-serif">Mock preview</text>',
        safeDescription,
      );

    return `${prefix}${Buffer.from(svg, "utf8").toString("base64")}`;
  } catch {
    return url;
  }
}

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
  if (!asset) {
    return "";
  }

  asset.url = normalizeMockSvgDataUrl(asset.url);
  return asset.url;
}

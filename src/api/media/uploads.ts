import { request } from "@/utils/request";
import type { MediaAsset, MediaUploadPresign } from "@/types/generation";

const directUploadThreshold = 5 * 1024 * 1024;
const assetsUrl = "/api/media/user/assets";

function uploadForm(file: File) {
  const body = new FormData();
  body.set("file", file);
  return request<MediaAsset>({
    url: assetsUrl,
    method: "POST",
    body,
  });
}

async function cancelUpload(assetId: string) {
  await request<null>({
    url: `${assetsUrl}/uploads/${encodeURIComponent(assetId)}`,
    method: "DELETE",
  }).catch(() => undefined);
}

async function uploadDirectly(file: File) {
  const upload = await request<MediaUploadPresign>({
    url: `${assetsUrl}/uploads/presign`,
    method: "POST",
    data: {
      originalName: file.name,
      contentType: file.type,
      size: file.size,
    },
  });

  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: upload.requiredHeaders,
    body: file,
  }).catch(() => null);
  if (!response?.ok) {
    await cancelUpload(upload.assetId);
    throw new Error("文件上传失败，请重试");
  }

  try {
    return await request<MediaAsset>({
      url: `${assetsUrl}/uploads/${encodeURIComponent(upload.assetId)}/complete`,
      method: "POST",
    });
  } catch (error) {
    await cancelUpload(upload.assetId);
    throw error;
  }
}

export function uploadMediaFile(file: File): Promise<MediaAsset> {
  if (file.size > directUploadThreshold) {
    return uploadDirectly(file);
  }

  return uploadForm(file);
}

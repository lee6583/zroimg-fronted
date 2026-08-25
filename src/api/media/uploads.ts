import { request } from "@/utils/request";
import type { UploadMediaResponse } from "@/types/generation";

const directUploadThreshold = 5 * 1024 * 1024;

type PresignResponse = {
  upload: {
    assetId: string;
    uploadUrl: string;
    requiredHeaders: Record<string, string>;
    expiresAt: string;
    originalName: string;
  };
};

async function uploadThroughBff(file: File) {
  const body = new FormData();
  body.set("file", file);
  return request<UploadMediaResponse>({
    url: "/api/media/upload",
    method: "POST",
    body,
  });
}

async function uploadDirectly(file: File) {
  const presigned = await request<PresignResponse>({
    url: "/api/media/uploads/presign",
    method: "POST",
    data: {
      originalName: file.name,
      contentType: file.type,
      size: file.size,
    },
  });

  const { upload } = presigned;
  const response = await fetch(upload.uploadUrl, {
    method: "PUT",
    headers: upload.requiredHeaders,
    body: file,
  });
  if (!response.ok) {
    await fetch(`/api/media/uploads/${encodeURIComponent(upload.assetId)}`, {
      method: "DELETE",
    }).catch(() => undefined);
    throw new Error("文件上传失败，请重试");
  }

  try {
    return await request<UploadMediaResponse>({
      url: `/api/media/uploads/${encodeURIComponent(upload.assetId)}/complete`,
      method: "POST",
    });
  } catch (error) {
    await fetch(`/api/media/uploads/${encodeURIComponent(upload.assetId)}`, {
      method: "DELETE",
    }).catch(() => undefined);
    throw error;
  }
}

export async function uploadMediaFile(file: File) {
  return file.size > directUploadThreshold ? uploadDirectly(file) : uploadThroughBff(file);
}

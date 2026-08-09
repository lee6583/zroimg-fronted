import { z } from "zod";
import { getCurrentUserProfile } from "@/server/auth";
import { createVideoTask, listVideoTasks } from "@/server/bff/video";
import { handleApi, jsonError, jsonOk } from "@/server/http";
import { parseJson } from "@/server/validation";

const createSchema = z.object({
  modelCode: z.string().trim().min(1),
  mode: z.enum(["text_to_video", "image_to_video"]),
  prompt: z.string().trim().min(1, "请输入视频提示词").max(4000),
  ratio: z.string().trim().min(1).max(32),
  resolution: z.string().trim().min(1).max(32),
  quality: z.string().trim().min(1).max(32),
  durationSeconds: z.number().int().min(1).max(60),
  audio: z.boolean(),
  priceVersion: z.string().trim().min(1),
  referenceMediaId: z.string().trim().min(1).optional(),
});

function readPageNumber(value: string | null, defaultValue: number) {
  const number = Number(value || defaultValue);
  if (!Number.isInteger(number) || number < 1) {
    return defaultValue;
  }
  return number;
}

function readPageSize(value: string | null) {
  const pageSize = readPageNumber(value, 20);
  return Math.min(pageSize, 100);
}

export async function GET(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const url = new URL(request.url);
    const pageNo = readPageNumber(url.searchParams.get("pageNo"), 1);
    const pageSize = readPageSize(url.searchParams.get("pageSize"));
    const page = await listVideoTasks({ pageNo, pageSize });
    return jsonOk({ page });
  });
}

export async function POST(request: Request) {
  return handleApi(async () => {
    const current = await getCurrentUserProfile();
    if (!current) {
      return jsonError("请先登录", 401);
    }

    const parsed = await parseJson(request, createSchema);
    if (!parsed.ok) {
      return jsonError(parsed.message);
    }

    const task = await createVideoTask({
      ...parsed.data,
      referenceMediaId: parsed.data.referenceMediaId
        ? Number(parsed.data.referenceMediaId)
        : undefined,
    });
    return jsonOk({ task });
  });
}

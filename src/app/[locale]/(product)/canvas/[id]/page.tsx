import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { CanvasDisabled } from "@/features/canvas/canvas-list";
import { CanvasEditor } from "@/features/canvas/canvas-editor";
import { resolveOptions, type GeneratorOptions } from "@/features/canvas/canvas-model";
import { requireUser } from "@/server/auth";
import { JavaApiError, requestJava } from "@/server/java-api";
import type { CanvasBoardDetail, CanvasConfig } from "@/types/canvas";
import type { FavoriteCollection } from "@/types/favorites";
import type { GenerationMode, GenerationModel, MediaPreview } from "@/types/generation";
import { maxPreviewIds } from "@/utils/media";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("canvas.meta");

  return { title: t("title") };
}

type PageParams = Promise<{ id: string }>;
type CanvasBoardPageProps = {
  params: PageParams;
};

async function readBoard(id: string) {
  try {
    return await requestJava<CanvasBoardDetail>(`/canvas/user/boards/${encodeURIComponent(id)}`);
  } catch (error) {
    // Java 对不存在或不属于当前用户的画布返回 400
    if (error instanceof JavaApiError && (error.status === 400 || error.status === 404)) {
      return null;
    }

    throw error;
  }
}

// 首屏 HTML 直接带上图片的 LQIP 和尺寸，浏览器不用等客户端请求就能显示模糊占位
async function readPreviews(board: CanvasBoardDetail) {
  const ids: string[] = [];
  for (const node of board.scene?.nodes ?? []) {
    if (node.type === "image" && node.data.mediaAssetId && !ids.includes(node.data.mediaAssetId)) {
      ids.push(node.data.mediaAssetId);
    }
  }
  if (ids.length === 0) return [];

  try {
    const params = { ids: ids.slice(0, maxPreviewIds).join(","), wait: "false" };
    return await requestJava<MediaPreview[]>("/media/user/assets/previews", { params });
  } catch {
    // 占位信息只影响加载体验，失败时由客户端再取
    return [];
  }
}

function pickModels(models: GenerationModel[], allowed: string[]) {
  if (allowed.length === 0) {
    return models;
  }

  return models.filter((model) => allowed.includes(model.modelCode));
}

function pickDefaults(models: GenerationModel[]) {
  let preferred = models.find((model) => model.defaultFlag === 1);
  if (!preferred) {
    preferred = models[0];
  }
  if (!preferred) {
    return null;
  }

  const base: GeneratorOptions = {
    modelCode: preferred.modelCode,
    ratio: "",
    quality: "",
    count: 0,
  };
  const modes: GenerationMode[] = ["text_to_image", "image_to_image", "inpaint"];
  for (const mode of modes) {
    const options = resolveOptions(base, models, mode);
    if (options) return options;
  }

  return null;
}

export default async function CanvasBoardPage(props: CanvasBoardPageProps) {
  const params = props.params;

  const user = await requireUser();
  const { id } = await params;
  const config = await requestJava<CanvasConfig>("/canvas/user/config");
  if (!config.enabled) {
    return <CanvasDisabled />;
  }

  const [board, allModels, collections] = await Promise.all([
    readBoard(id),
    requestJava<GenerationModel[]>("/generation/user/models", { params: { modelType: "image" } }),
    requestJava<FavoriteCollection[]>("/favorite/user/collections"),
  ]);
  if (!board) notFound();

  const initialPreviews = await readPreviews(board);

  const models = pickModels(allModels, config.allowedModelCodes);

  return (
    <CanvasEditor
      key={board.id}
      board={board}
      config={config}
      models={models}
      collections={collections}
      balance={user.totalPoints}
      defaults={pickDefaults(models)}
      initialPreviews={initialPreviews}
    />
  );
}

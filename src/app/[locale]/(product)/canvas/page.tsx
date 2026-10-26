import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { CanvasList } from "@/features/canvas/canvas-list";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { CanvasBoard, CanvasConfig } from "@/types/canvas";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.canvas");

  return { title: t("title") };
}

export default async function CanvasPage() {
  await requireUser();
  const config = await requestJava<CanvasConfig>("/canvas/user/config");

  let boards: CanvasBoard[] = [];
  if (config.enabled) {
    boards = await requestJava<CanvasBoard[]>("/canvas/user/boards");
  }

  return <CanvasList initialBoards={boards} config={config} />;
}

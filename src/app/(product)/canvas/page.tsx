import type { Metadata } from "next";
import { CanvasList } from "@/features/canvas/canvas-list";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { CanvasBoard, CanvasConfig } from "@/types/canvas";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "无限画布 | ZroImg",
};

export default async function CanvasPage() {
  await requireUser();
  const config = await requestJava<CanvasConfig>("/canvas/user/config");

  let boards: CanvasBoard[] = [];
  if (config.enabled) {
    boards = await requestJava<CanvasBoard[]>("/canvas/user/boards");
  }

  return <CanvasList initialBoards={boards} config={config} />;
}

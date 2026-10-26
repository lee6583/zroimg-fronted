import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { VideoModel, VideoTaskPage } from "@/types/video";
import { VideoWorkspace } from "./video-workspace";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("video.meta");
  return { title: t("title") };
}

export default async function VideoPage() {
  await requireUser();
  const models = await requestJava<VideoModel[]>("/generation/user/video/models");
  let taskPage: VideoTaskPage = { total: 0, pages: 0, list: [] };
  if (models.length > 0) {
    taskPage = await requestJava<VideoTaskPage>("/generation/user/video/tasks", {
      params: { pageNo: 1, pageSize: 20, isAsc: false, sortBy: "create_time" },
    });
  }

  return <VideoWorkspace initialModels={models} initialPage={taskPage} />;
}

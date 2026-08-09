import { requireUser } from "@/server/auth";
import { listVideoModels, listVideoTasks } from "@/server/bff/video";
import { VideoWorkspace } from "./video-workspace";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  await requireUser();
  const [models, taskPage] = await Promise.all([
    listVideoModels(),
    listVideoTasks({ pageNo: 1, pageSize: 20 }),
  ]);

  return <VideoWorkspace initialModels={models} initialPage={taskPage} />;
}

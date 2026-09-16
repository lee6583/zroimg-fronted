import { requireUser } from "@/server/auth";
import { listVideoModels, listVideoTasks } from "@/server/bff/video";
import { VideoWorkspace } from "./video-workspace";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  await requireUser();
  const models = await listVideoModels();
  const taskPage = models.length
    ? await listVideoTasks({ pageNo: 1, pageSize: 20 })
    : { total: 0, pages: 1, list: [] };

  return <VideoWorkspace initialModels={models} initialPage={taskPage} />;
}

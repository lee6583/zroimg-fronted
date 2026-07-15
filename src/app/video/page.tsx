import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth";
import { VideoWorkspace } from "./video-workspace";

export const dynamic = "force-dynamic";

export default async function VideoPage() {
  await requireUser();

  return (
    <AppShell active="video" flush>
      <VideoWorkspace />
    </AppShell>
  );
}

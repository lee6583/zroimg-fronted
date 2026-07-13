import { AppShell } from "@/components/layout/app-shell";
import { GenerateForm } from "@/features/generation/generate-form";
import { requireUser } from "@/server/auth";
import { ensureDefaultConversation, listConversations, listTasks } from "@/server/bff/generation";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const current = await requireUser();
  await ensureDefaultConversation(current.profile.id);
  const conversations = await listConversations(current.profile.id);
  const activeId = conversations[0]?.id;
  const tasks = activeId ? await listTasks(current.profile.id, activeId) : [];
  const items = conversations.map((conversation) => {
    const latestTask = conversation.tasks[0];
    return {
      id: conversation.id,
      title: conversation.title,
      taskCount: conversation._count.tasks,
      latestTaskStatus: latestTask?.status ?? null,
      latestTaskCost: latestTask?.costCredits ?? null,
      lastTaskAt: conversation.lastTaskAt?.toISOString() ?? null,
      updatedAt: conversation.updatedAt.toISOString(),
      createdAt: conversation.createdAt.toISOString(),
    };
  });
  const taskList = tasks.map((task) => ({
    id: task.id,
    prompt: task.prompt,
    mode: task.mode,
    status: task.status,
    size: task.size,
    imageCount: task.imageCount,
    costCredits: task.costCredits,
    createdAt: task.createdAt.toISOString(),
  }));

  return (
    <AppShell active="generate" flush>
      <GenerateForm initialChats={items} initialId={activeId} initialTasks={taskList} />
    </AppShell>
  );
}

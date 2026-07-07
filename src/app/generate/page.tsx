import { AppShell } from "@/components/layout/app-shell";
import { GenerateForm } from "@/features/generation/generate-form";
import { requireUser } from "@/server/auth";
import { getOrCreateDefaultConversation, listGenerationConversations } from "@/server/bff/generation";
import { listGenerationTasks } from "@/server/bff/generation";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const current = await requireUser();
  await getOrCreateDefaultConversation(current.profile.id);
  const conversations = await listGenerationConversations(current.profile.id);
  const activeConversationId = conversations[0]?.id;
  const tasks = activeConversationId ? await listGenerationTasks(current.profile.id, activeConversationId) : [];
  const conversationItems = conversations.map((conversation) => {
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
  const taskItems = tasks.map((task) => ({
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
    <AppShell flush>
      <GenerateForm initialConversations={conversationItems} initialConversationId={activeConversationId} initialTasks={taskItems} />
    </AppShell>
  );
}

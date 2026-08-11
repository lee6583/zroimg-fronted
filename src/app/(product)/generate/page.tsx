import { GenerateForm } from "@/features/generation/generate-form";
import { getDefaultOptions } from "@/features/generation/generation-model";
import { requireUser } from "@/server/auth";
import {
  ensureDefaultConversation,
  estimatePrice,
  listConversations,
  listModels,
  listTasks,
} from "@/server/bff/generation";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  const current = await requireUser();
  const modelOptions = await listModels();
  const initialOptions = getDefaultOptions(modelOptions);
  const initialPrice = await estimatePrice(current.profile.id, {
    model: initialOptions.model,
    mode: initialOptions.mode,
    ratio: initialOptions.ratio,
    quality: initialOptions.quality,
    count: initialOptions.count,
  });
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
    <GenerateForm
      initialChats={items}
      initialId={activeId}
      initialTasks={taskList}
      initialBalance={initialPrice.currentPoints}
      initialOptions={initialOptions}
      initialEstimate={initialPrice.requiredPoints}
      modelOptions={modelOptions}
    />
  );
}

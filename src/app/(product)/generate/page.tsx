import { cookies } from "next/headers";
import { GenerateForm } from "@/features/generation/generate-form";
import {
  activeConversationCookieName,
  getDefaultOptions,
  resolveActiveConversationId,
} from "@/features/generation/generation-model";
import { requireUser } from "@/server/auth";
import {
  ensureDefaultConversation,
  estimatePrice,
  listConversations,
  listModels,
  listTasks,
  serializeTask,
} from "@/server/bff/generation";
import { listCollections } from "@/server/bff/account";

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
  const cookieStore = await cookies();
  const rememberedId = cookieStore.get(activeConversationCookieName)?.value;
  const activeId = resolveActiveConversationId(conversations, rememberedId);
  const tasksPromise = activeId ? listTasks(current.profile.id, activeId) : Promise.resolve([]);
  const [tasks, collections] = await Promise.all([
    tasksPromise,
    listCollections(current.profile.id),
  ]);
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
  const taskList = await Promise.all(tasks.map(serializeTask));
  const collectionItems = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    imageCount: collection._count.items,
  }));

  return (
    <GenerateForm
      initialChats={items}
      initialId={activeId}
      initialTasks={taskList}
      initialBalance={initialPrice.currentPoints}
      initialOptions={initialOptions}
      initialEstimate={initialPrice.requiredPoints}
      initialCollections={collectionItems}
      modelOptions={modelOptions}
    />
  );
}

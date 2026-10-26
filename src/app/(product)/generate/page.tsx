import { cookies } from "next/headers";
import { GenerateForm } from "@/features/generation/generate-form";
import {
  activeConversationCookieName,
  findDefaultOptions,
  resolveActiveConversationId,
} from "@/features/generation/generation-model";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import { GenerateUnavailable } from "./generate-unavailable";
import type { FavoriteCollection } from "@/types/favorites";
import type {
  GenerationConversation,
  GenerationModel,
  GenerationPriceEstimate,
  GenerationTask,
} from "@/types/generation";

export const dynamic = "force-dynamic";

export default async function GeneratePage() {
  await requireUser();
  const [models, conversations, collections] = await Promise.all([
    requestJava<GenerationModel[]>("/generation/user/models", { params: { modelType: "image" } }),
    requestJava<GenerationConversation[]>("/generation/user/conversations"),
    requestJava<FavoriteCollection[]>("/favorite/user/collections"),
  ]);
  const options = findDefaultOptions(models);
  if (!options) {
    return <GenerateUnavailable />;
  }

  const cookieStore = await cookies();
  const rememberedId = cookieStore.get(activeConversationCookieName)?.value;
  const activeId = resolveActiveConversationId(conversations, rememberedId);

  let tasksPromise = Promise.resolve<GenerationTask[]>([]);
  if (activeId) {
    const path = `/generation/user/conversations/${encodeURIComponent(activeId)}/tasks`;
    tasksPromise = requestJava<GenerationTask[]>(path);
  }
  const pricePromise = requestJava<GenerationPriceEstimate>("/generation/user/price/estimate", {
    method: "POST",
    data: options,
  });
  const [tasks, price] = await Promise.all([tasksPromise, pricePromise]);

  return (
    <GenerateForm
      initialChats={conversations}
      initialId={activeId}
      initialTasks={tasks}
      initialBalance={price.currentPoints}
      initialOptions={options}
      initialEstimate={price.requiredPoints}
      initialCollections={collections}
      modelOptions={models}
    />
  );
}

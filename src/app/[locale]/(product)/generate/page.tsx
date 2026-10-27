import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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

// robots（noindex）继承自 (product) 布局。
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("generate.meta");

  return { title: t("title") };
}

type GeneratePageProps = {
  searchParams: Promise<{ prompt?: string | string[] }>;
};

// 画廊带过来的提示词只用于预填输入框，过长时截断，避免地址栏塞入超大内容
const maxPrefillLength = 4000;

function readPrompt(value?: string | string[]) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) {
    return undefined;
  }

  return raw.slice(0, maxPrefillLength);
}

export default async function GeneratePage(props: GeneratePageProps) {
  await requireUser();
  const params = await props.searchParams;
  const initialPrompt = readPrompt(params.prompt);
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
      initialPrompt={initialPrompt}
    />
  );
}

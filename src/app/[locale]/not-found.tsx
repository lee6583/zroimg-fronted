import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { NotFoundView } from "@/components/layout/not-found-view";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.notFound");

  return { title: t("title") };
}

export default async function NotFoundPage() {
  const locale = await getLocale();

  return <NotFoundView locale={locale} />;
}

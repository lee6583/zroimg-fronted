import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { FavoriteCollection } from "@/types/favorites";
import { FavoriteCollectionsView } from "./favorites-view";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("favorites.meta");
  return { title: t("title") };
}

export default async function FavoritesPage() {
  await requireUser();
  const collections = await requestJava<FavoriteCollection[]>("/favorite/user/collections");

  return <FavoriteCollectionsView collections={collections} />;
}

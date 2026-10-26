import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { FavoriteCollection } from "@/types/favorites";
import { FavoriteCollectionsView } from "./favorites-view";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  await requireUser();
  const collections = await requestJava<FavoriteCollection[]>("/favorite/user/collections");

  return <FavoriteCollectionsView collections={collections} />;
}

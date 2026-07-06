import { AppShell } from "@/components/app-shell";
import { FavoriteCollectionsView } from "@/app/favorites/favorites-view";
import { requireUser } from "@/server/auth";
import { listFavoriteCollections } from "@/server/favorites";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const current = await requireUser();
  const collections = await listFavoriteCollections(current.profile.id);
  const collectionItems = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    imageCount: collection._count.items,
  }));

  return (
    <AppShell active="favorites">
      <FavoriteCollectionsView collections={collectionItems} />
    </AppShell>
  );
}

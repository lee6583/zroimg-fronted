import { requireUser } from "@/server/auth";
import { listCollections } from "@/server/bff/account";
import { FavoriteCollectionsView } from "./favorites-view";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const current = await requireUser();
  const collections = await listCollections(current.profile.id);
  const collectionItems = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    imageCount: collection._count.items,
  }));

  return <FavoriteCollectionsView collections={collectionItems} />;
}

import { ModelManager } from "@/features/admin/model-manager";
import { requireAdmin } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type {
  AdminGenerationModel,
  GenerationModelCatalogItem,
  GenerationProviderConnection,
} from "@/types/admin";

export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  await requireAdmin();
  const [models, catalog, connections] = await Promise.all([
    requestJava<AdminGenerationModel[]>("/generation/admin/models"),
    requestJava<GenerationModelCatalogItem[]>("/generation/admin/models/catalog"),
    requestJava<GenerationProviderConnection[]>("/generation/admin/provider-connections"),
  ]);

  return <ModelManager initialModels={models} catalog={catalog} initialConnections={connections} />;
}

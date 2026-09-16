import { ModelManager } from "@/features/admin/model-manager";
import {
  listAdminModels,
  listGenerationModelCatalog,
  listProviderConnections,
} from "@/server/bff/admin-models";

export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  const [models, catalog, connections] = await Promise.all([
    listAdminModels(),
    listGenerationModelCatalog(),
    listProviderConnections(),
  ]);

  return <ModelManager initialModels={models} catalog={catalog} initialConnections={connections} />;
}

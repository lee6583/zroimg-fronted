import { ModelManager } from "@/features/admin/model-manager";
import { listAdminModels, listImageModelCatalog } from "@/server/bff/admin-models";

export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  const [models, catalog] = await Promise.all([listAdminModels(), listImageModelCatalog()]);

  return <ModelManager initialModels={models} catalog={catalog} />;
}

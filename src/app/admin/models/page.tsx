import { ModelManager } from "@/features/admin/model-manager";
import { listAdminModels } from "@/server/bff/admin-models";

export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  const models = await listAdminModels();

  return <ModelManager initialModels={models} />;
}

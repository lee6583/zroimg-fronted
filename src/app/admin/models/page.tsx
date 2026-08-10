import { ModelManager } from "@/features/admin/model-manager";
import { listAdminModels } from "@/server/bff/admin-models";

export const dynamic = "force-dynamic";

export default async function AdminModelsPage() {
  const models = await listAdminModels();

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="page-title">模型配置</h1>
      </section>
      <ModelManager initialModels={models} />
    </div>
  );
}

import Link from "next/link";
import { listAdminGenerations } from "@/server/bff/admin";

export const dynamic = "force-dynamic";

const generationStatuses = ["queued", "running", "succeeded", "failed"] as const;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminGenerationsPageProps = {
  searchParams: SearchParams;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string | null) {
  return value ? new Date(value).toISOString().slice(0, 16).replace("T", " ") : "-";
}

function href(input: { q?: string; status?: string; page: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  params.set("page", String(input.page));
  return `/admin/generations?${params.toString()}`;
}

export default async function AdminGenerationsPage(props: AdminGenerationsPageProps) {
  const searchParams = props.searchParams;

  const params = await searchParams;
  const q = readParam(params, "q")?.trim();
  const status = readParam(params, "status");
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const pageSize = 20;
  const taskPage = await listAdminGenerations({
    page,
    pageSize,
    q,
    status: generationStatuses.includes(status as (typeof generationStatuses)[number])
      ? status
      : undefined,
  });
  const tasks = taskPage.list;
  const total = taskPage.total;
  const totalPages = Math.max(1, taskPage.pages);

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="page-title">生成任务</h1>
      </section>

      <section className="surface rounded-xl p-5">
        <form className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className="field text-sm"
            name="q"
            defaultValue={q || ""}
            placeholder="搜索提示词、模型或用户邮箱"
          />
          <button className="btn-primary" type="submit">
            搜索
          </button>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Link className={`btn-secondary ${!status ? "bg-soft" : ""}`} href="/admin/generations">
              全部
            </Link>
            {generationStatuses.map((item) => (
              <Link
                key={item}
                className={`btn-secondary ${status === item ? "bg-soft" : ""}`}
                href={href({ q, status: item, page: 1 })}
              >
                {item}
              </Link>
            ))}
          </div>
        </form>
      </section>

      <section className="grid gap-2">
        {tasks.map((task) => (
          <article key={task.id} className="surface rounded-xl p-4">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-semibold">{task.userEmail}</p>
                <p className="mt-1 text-sm text-muted">
                  {task.status} / {task.mode} / {task.model} / {task.size} / {task.quality}
                </p>
              </div>
              <p className="text-sm text-muted">
                {task.requiredPoints} 积分 / {task.outputCount} 张 / {formatDate(task.createdAt)}
              </p>
            </div>
            <p className="mt-3 text-sm leading-6">{task.prompt}</p>
            {task.failReason ? (
              <p className="mt-2 rounded-lg bg-soft p-3 text-sm text-danger">{task.failReason}</p>
            ) : null}
          </article>
        ))}
        {tasks.length === 0 ? (
          <p className="surface rounded-xl p-8 text-center text-sm text-muted">没有匹配任务</p>
        ) : null}
      </section>

      <nav className="flex items-center justify-between">
        <Link className="btn-secondary" href={href({ q, status, page: Math.max(1, page - 1) })}>
          上一页
        </Link>
        <p className="text-sm text-muted">
          第 {page} / {totalPages} 页，共 {total} 个任务
        </p>
        <Link
          className="btn-secondary"
          href={href({ q, status, page: Math.min(totalPages, page + 1) })}
        >
          下一页
        </Link>
      </nav>
    </div>
  );
}

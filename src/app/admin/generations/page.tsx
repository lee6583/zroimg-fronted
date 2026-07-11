import Link from "next/link";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdmin } from "@/server/auth";
import { prisma } from "@/server/bff/orders";

export const dynamic = "force-dynamic";

const generationStatuses = ["queued", "running", "succeeded", "failed"] as const;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: Date | null) {
  return value ? value.toISOString().slice(0, 16).replace("T", " ") : "-";
}

function href(input: { q?: string; status?: string; page: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  params.set("page", String(input.page));
  return `/admin/generations?${params.toString()}`;
}

export default async function AdminGenerationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const params = await searchParams;
  const q = readParam(params, "q")?.trim();
  const status = readParam(params, "status");
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const pageSize = 20;
  const where = {
    ...(generationStatuses.includes(status as (typeof generationStatuses)[number])
      ? { status: status as (typeof generationStatuses)[number] }
      : {}),
    ...(q
      ? {
          OR: [
            { prompt: { contains: q, mode: "insensitive" as const } },
            { model: { contains: q, mode: "insensitive" as const } },
            { userProfile: { user: { email: { contains: q, mode: "insensitive" as const } } } },
          ],
        }
      : {}),
  };
  const [tasks, total] = await Promise.all([
    prisma.generationTask.findMany({
      where,
      include: { userProfile: { include: { user: true } }, outputs: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.generationTask.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <AdminShell active="generations">
      <div className="grid gap-6">
        <section>
          <p className="label">Generation tasks</p>
          <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight md:text-5xl">
            生成任务
          </h1>
          <p className="mt-3 text-sm text-muted">排查失败任务、查看用户消耗积分和模型参数。</p>
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
              <Link
                className={`btn-secondary ${!status ? "bg-soft" : ""}`}
                href="/admin/generations"
              >
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
                  <p className="font-semibold">{task.userProfile?.user?.email || "-"}</p>
                  <p className="mt-1 text-sm text-muted">
                    {task.status} / {task.mode} / {task.model} / {task.size} / {task.quality}
                  </p>
                </div>
                <p className="text-sm text-muted">
                  {task.costCredits} 积分 / {task.outputs?.length || 0} 张 /{" "}
                  {formatDate(task.createdAt)}
                </p>
              </div>
              <p className="mt-3 text-sm leading-6">{task.prompt}</p>
              {task.error ? (
                <p className="mt-2 rounded-lg bg-soft p-3 text-sm text-danger">{task.error}</p>
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
    </AdminShell>
  );
}

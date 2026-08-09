import Link from "next/link";
import { requireUser } from "@/server/auth";
import { listPointsFlows } from "@/server/bff/points";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type PointsPageProps = {
  searchParams: SearchParams;
};

function readPage(params: Record<string, string | string[] | undefined>) {
  const value = params.page;
  const text = Array.isArray(value) ? value[0] : value;
  const page = Number(text || 1);
  if (!Number.isInteger(page) || page < 1) return 1;
  return page;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function pageHref(page: number) {
  return `/points?page=${page}`;
}

export default async function PointsPage(props: PointsPageProps) {
  const current = await requireUser();
  const params = await props.searchParams;
  const page = readPage(params);
  const pageSize = 20;
  const result = await listPointsFlows(current.profile.id, { page, pageSize });
  const totalPages = Math.max(1, result.pages);

  return (
    <div className="page-stack">
      <section className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="page-title">积分明细</h1>
        <p className="text-sm text-muted">当前余额 {current.profile.creditBalance} 积分</p>
      </section>

      <section className="grid gap-2">
        {result.list.map((flow) => (
          <article
            key={flow.id}
            className="surface grid gap-3 rounded-xl p-4 md:grid-cols-[1fr_auto]"
          >
            <div>
              <h2 className="font-medium">{flow.remark}</h2>
              <p className="mt-1 text-sm text-muted">
                {flow.sourceType} / {formatDate(flow.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <p className={flow.amount >= 0 ? "font-semibold" : "font-semibold text-danger"}>
                {flow.amount > 0 ? `+${flow.amount}` : flow.amount}
              </p>
              <p className="mt-1 text-sm text-muted">余额 {flow.afterPoints}</p>
            </div>
          </article>
        ))}
        {result.list.length === 0 ? (
          <p className="surface rounded-xl p-8 text-center text-sm text-muted">暂无积分明细</p>
        ) : null}
      </section>

      <nav className="flex items-center justify-between">
        <Link className="btn-secondary" href={pageHref(Math.max(1, page - 1))}>
          上一页
        </Link>
        <p className="text-sm text-muted">
          第 {page} / {totalPages} 页，共 {result.total} 条
        </p>
        <Link className="btn-secondary" href={pageHref(Math.min(totalPages, page + 1))}>
          下一页
        </Link>
      </nav>
    </div>
  );
}

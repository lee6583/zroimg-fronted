import Link from "next/link";
import { AppPagination } from "@/components/ui/app-pagination";
import { listAdminRechargeOrders } from "@/server/bff/orders";
import { ReissueButton } from "./reissue-button";

export const dynamic = "force-dynamic";

const orderStatuses = ["pending", "confirming", "paid", "credited", "closed", "failed"] as const;
const pageSizeOptions = [10, 20, 50];

const orderStatusLabels: Record<string, string> = {
  pending: "待支付",
  confirming: "支付确认中",
  paid: "已支付",
  credited: "已到账",
  closed: "已关闭",
  failed: "支付失败",
  fulfilled: "已到账",
  expired: "已过期",
  cancelled: "已取消",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;
type AdminOrdersPageProps = {
  searchParams: SearchParams;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function formatDateText(value?: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 16).replace("T", " ");
}

function readStatusLabel(status: string) {
  return orderStatusLabels[status] ?? status;
}

function href(input: { q?: string; status?: string; page?: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  return `/admin/orders?${params.toString()}`;
}

export default async function AdminOrdersPage(props: AdminOrdersPageProps) {
  const searchParams = props.searchParams;

  const params = await searchParams;
  const q = readParam(params, "q")?.trim();
  const status = readParam(params, "status");
  const page = Math.max(1, Number(readParam(params, "page") || 1));
  const requestedPageSize = Number(readParam(params, "pageSize") || 20);
  const pageSize = pageSizeOptions.includes(requestedPageSize) ? requestedPageSize : 20;
  const isKnownStatus = orderStatuses.includes(status as (typeof orderStatuses)[number]);

  const orderPage = await listAdminRechargeOrders({
    page,
    pageSize,
    orderNo: q || undefined,
    status: isKnownStatus ? status : undefined,
  });

  const orders = orderPage.list;
  const total = orderPage.total;

  return (
    <div className="grid gap-6">
      <section>
        <h1 className="page-title">订单管理</h1>
      </section>

      <section className="surface rounded-xl p-5">
        <form className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            className="field text-sm"
            name="q"
            defaultValue={q || ""}
            placeholder="搜索订单号"
          />
          <button className="btn-primary" type="submit">
            搜索
          </button>
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Link className={`btn-secondary ${!status ? "bg-soft" : ""}`} href="/admin/orders">
              全部
            </Link>
            {orderStatuses.map((item) => (
              <Link
                key={item}
                className={`btn-secondary ${status === item ? "bg-soft" : ""}`}
                href={href({ q, status: item, page: 1 })}
              >
                {readStatusLabel(item)}
              </Link>
            ))}
          </div>
        </form>
      </section>

      <section className="grid gap-2">
        {orders.map((order) => (
          <article key={order.orderNo} className="surface rounded-xl p-4">
            <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr_1fr_auto]">
              <div>
                <p className="font-semibold">{order.orderNo}</p>
                <p className="mt-1 text-sm text-muted">用户 {order.userText}</p>
              </div>
              <div>
                <p>{order.packageName}</p>
                <p className="mt-1 text-sm text-muted">
                  {order.credits} 积分 / {order.amountText}
                </p>
              </div>
              <div>
                <p>{readStatusLabel(order.displayStatus)}</p>
                <p className="mt-1 text-sm text-muted">
                  {order.payChannelText || order.payChannel || "—"} /{" "}
                  {order.thirdTradeNo || "无交易号"}
                </p>
                {order.creditsErrorReason ? (
                  <p className="mt-1 text-sm text-red-600">发放失败：{order.creditsErrorReason}</p>
                ) : null}
              </div>
              <div className="grid gap-2 text-sm text-muted lg:justify-items-end lg:text-right">
                <div>
                  <p>创建 {formatDateText(order.createTime)}</p>
                  <p>支付 {formatDateText(order.payTime)}</p>
                </div>
                {order.creditsStatus === "failed" ? (
                  <ReissueButton orderNo={order.orderNo} />
                ) : null}
              </div>
            </div>
          </article>
        ))}
        {orders.length === 0 ? (
          <p className="surface rounded-xl p-8 text-center text-sm text-muted">没有匹配订单</p>
        ) : null}
      </section>

      <AppPagination current={page} pageSize={pageSize} total={total} />
    </div>
  );
}

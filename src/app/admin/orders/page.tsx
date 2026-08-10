import clsx from "clsx";
import { Search } from "lucide-react";
import Link from "next/link";
import { AppPagination } from "@/components/ui/app-pagination";
import workspace from "@/features/admin/admin-workspace.module.css";
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

function href(input: { q?: string; status?: string; page?: number; pageSize?: number }) {
  const params = new URLSearchParams();
  if (input.q) params.set("q", input.q);
  if (input.status) params.set("status", input.status);
  if (input.page && input.page > 1) params.set("page", String(input.page));
  if (input.pageSize && input.pageSize !== 20) params.set("pageSize", String(input.pageSize));
  const query = params.toString();
  return query ? `/admin/orders?${query}` : "/admin/orders";
}

function statusClass(status: string) {
  if (status === "credited" || status === "fulfilled") return workspace.statusSuccess;
  if (status === "confirming" || status === "paid") return workspace.statusInfo;
  if (status === "pending") return workspace.statusWarning;
  if (status === "failed") return workspace.statusDanger;
  return undefined;
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
    <div className={workspace.workspace}>
      <header className={workspace.header}>
        <div className={workspace.headerCopy}>
          <h1 className="page-title">订单管理</h1>
        </div>
      </header>

      <section className={workspace.panel}>
        <div className={workspace.toolbar}>
          <form className={workspace.search}>
            <Search size={15} aria-hidden="true" />
            <input name="q" defaultValue={q || ""} placeholder="搜索订单号" />
            {isKnownStatus ? <input type="hidden" name="status" value={status} /> : null}
            {pageSize !== 20 ? <input type="hidden" name="pageSize" value={pageSize} /> : null}
            <button type="submit">搜索</button>
          </form>

          <nav className={workspace.filters} aria-label="订单状态筛选">
            <Link
              className={!isKnownStatus ? workspace.filterActive : undefined}
              href={href({ q, pageSize })}
            >
              全部
            </Link>
            {orderStatuses.map((item) => (
              <Link
                key={item}
                className={status === item ? workspace.filterActive : undefined}
                href={href({ q, status: item, page: 1, pageSize })}
              >
                {readStatusLabel(item)}
              </Link>
            ))}
          </nav>
        </div>

        {orders.length > 0 ? (
          <div className={workspace.tableWrap}>
            <table className={clsx(workspace.table, workspace.ordersTable)}>
              <thead>
                <tr>
                  <th>订单号</th>
                  <th>用户</th>
                  <th>套餐</th>
                  <th>支付信息</th>
                  <th>状态</th>
                  <th>时间</th>
                  <th aria-label="操作" />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.orderNo}>
                    <td data-label="订单号">
                      <div className={workspace.primaryCell}>
                        <span className={workspace.primaryText}>{order.orderNo}</span>
                        <span className={workspace.secondaryText}>充值订单</span>
                      </div>
                    </td>
                    <td data-label="用户">{order.userText}</td>
                    <td data-label="套餐">
                      <div className={workspace.primaryCell}>
                        <span>{order.packageName}</span>
                        <span className={workspace.secondaryText}>
                          {order.credits.toLocaleString("zh-CN")} 积分
                        </span>
                      </div>
                    </td>
                    <td data-label="支付信息">
                      <div className={workspace.primaryCell}>
                        <span className={workspace.numeric}>{order.amountText}</span>
                        <span className={workspace.secondaryText}>
                          {order.payChannelText || order.payChannel || "未选择支付渠道"}
                        </span>
                        {order.thirdTradeNo ? (
                          <span className={workspace.monoText} title={order.thirdTradeNo}>
                            {order.thirdTradeNo}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td data-label="状态">
                      <div className={workspace.primaryCell}>
                        <span className={clsx(workspace.status, statusClass(order.displayStatus))}>
                          {readStatusLabel(order.displayStatus)}
                        </span>
                        {order.creditsErrorReason ? (
                          <span
                            className={workspace.secondaryText}
                            title={order.creditsErrorReason}
                          >
                            积分发放失败
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td data-label="时间">
                      <div className={workspace.primaryCell}>
                        <span className={workspace.dateText}>
                          创建 {formatDateText(order.createTime)}
                        </span>
                        <span className={workspace.secondaryText}>
                          支付 {formatDateText(order.payTime)}
                        </span>
                      </div>
                    </td>
                    <td data-label="操作">
                      <div className={workspace.rowActions}>
                        {order.creditsStatus === "failed" ? (
                          <ReissueButton orderNo={order.orderNo} />
                        ) : (
                          <span className={workspace.secondaryText}>—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={workspace.empty}>没有匹配的订单</div>
        )}

        <footer className={workspace.footer}>
          <AppPagination current={page} pageSize={pageSize} total={total} />
        </footer>
      </section>
    </div>
  );
}

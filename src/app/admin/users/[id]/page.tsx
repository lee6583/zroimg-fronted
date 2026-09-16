import clsx from "clsx";
import { ArrowLeft, CalendarDays, Coins, Mail, ReceiptText, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { UserAvatar } from "@/components/ui/user-avatar";
import { UserActions } from "@/features/admin/user-actions";
import { listAdminRechargeOrders } from "@/server/bff/orders";
import { getAdminUser, listAdminFlows, listAdminTasks } from "@/server/bff/users";
import { normalizeOrderDisplayStatus, orderDisplayStatusLabels } from "@/utils/order-status";
import styles from "./user-detail.module.css";

export const dynamic = "force-dynamic";

type AdminUserDetailPageProps = {
  params: Promise<{ id: string }>;
};

const generationStatusLabels: Record<string, string> = {
  pending: "生成中",
  processing: "生成中",
  queued: "生成中",
  running: "生成中",
  succeeded: "已完成",
  failed: "失败",
};

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}

function roleLabel(role: string) {
  if (role === "admin") return "管理员";
  if (role === "user") return "普通用户";
  return role;
}

function generationType(modelType: "image" | "video", mode: string) {
  if (modelType === "video" || mode.includes("video")) return "视频";
  if (mode === "image_to_image" || mode === "edit") return "图生图";
  return "文生图";
}

function generationStatusClass(status: string) {
  if (status === "succeeded") return styles.userDetail__statusSuccess;
  if (["pending", "processing", "queued", "running"].includes(status)) {
    return styles.userDetail__statusInfo;
  }
  if (status === "failed") return styles.userDetail__statusDanger;
  return undefined;
}

function orderStatusClass(status: string) {
  if (status === "paid") return styles.userDetail__statusSuccess;
  if (status === "pending") return styles.userDetail__statusWarning;
  if (status === "cancelled") return styles.userDetail__statusDanger;
  return undefined;
}

export default async function AdminUserDetailPage(props: AdminUserDetailPageProps) {
  const params = props.params;
  const { id } = await params;
  const profile = await getAdminUser(id);

  if (!profile) notFound();

  const [flows, orderPage, tasks] = await Promise.all([
    listAdminFlows(id),
    listAdminRechargeOrders({ page: 1, pageSize: 20, userId: id }),
    listAdminTasks(id),
  ]);
  const orders = orderPage.list;

  return (
    <main className={styles.userDetail}>
      <header className={styles.userDetail__toolbar}>
        <Link href="/admin/users" className={styles.userDetail__backLink}>
          <ArrowLeft size={15} />
          <span>用户管理</span>
        </Link>
        <UserActions user={profile} variant="button" />
      </header>

      <section className={styles.userDetail__profile} aria-labelledby="user-detail-title">
        <div className={styles.userDetail__identity}>
          <UserAvatar name={profile.username} src={profile.avatarUrl} size={56} decorative />
          <div className={styles.userDetail__identityCopy}>
            <div className={styles.userDetail__nameRow}>
              <h1 id="user-detail-title" className="page-title">
                {profile.username}
              </h1>
              <span
                className={clsx(
                  styles.userDetail__status,
                  profile.status === "active"
                    ? styles.userDetail__statusSuccess
                    : styles.userDetail__statusDanger,
                )}
              >
                {profile.status === "active" ? "正常" : "已封禁"}
              </span>
            </div>
            <span className={styles.userDetail__email}>
              <Mail size={14} aria-hidden="true" />
              {profile.email || "未填写邮箱"}
            </span>
          </div>
        </div>

        <div className={styles.userDetail__metrics}>
          <div className={styles.userDetail__metric}>
            <span className={styles.userDetail__metricIcon}>
              <Coins size={17} aria-hidden="true" />
            </span>
            <div>
              <span>积分余额</span>
              <strong>{profile.totalPoints.toLocaleString("zh-CN")}</strong>
            </div>
          </div>
          <div className={styles.userDetail__metric}>
            <span className={styles.userDetail__metricIcon}>
              <ReceiptText size={17} aria-hidden="true" />
            </span>
            <div>
              <span>充值订单</span>
              <strong>{orderPage.total.toLocaleString("zh-CN")}</strong>
            </div>
          </div>
        </div>

        <dl className={styles.userDetail__facts}>
          <div>
            <dt>用户 ID</dt>
            <dd className={styles.userDetail__mono} title={profile.id}>
              {profile.id}
            </dd>
          </div>
          <div>
            <dt>
              <ShieldCheck size={14} aria-hidden="true" />
              角色
            </dt>
            <dd>{roleLabel(profile.role)}</dd>
          </div>
          <div>
            <dt>
              <CalendarDays size={14} aria-hidden="true" />
              注册时间
            </dt>
            <dd>{formatDate(profile.createdAt)}</dd>
          </div>
          <div>
            <dt>个人简介</dt>
            <dd>{profile.bio || "未填写"}</dd>
          </div>
        </dl>
      </section>

      <div className={styles.userDetail__content}>
        <section className={styles.userDetail__panel} aria-labelledby="generation-title">
          <header className={styles.userDetail__panelHeader}>
            <h2 id="generation-title">最近生成</h2>
            <span>{tasks.length} 条</span>
          </header>

          {tasks.length > 0 ? (
            <div className={styles.userDetail__tableWrap}>
              <table className={styles.userDetail__table}>
                <thead>
                  <tr>
                    <th>提示词</th>
                    <th>类型</th>
                    <th>模型配置</th>
                    <th>消耗</th>
                    <th>状态</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <div className={styles.userDetail__primaryCell}>
                          <span className={styles.userDetail__prompt} title={task.prompt}>
                            {task.prompt}
                          </span>
                          {task.failReason ? (
                            <span className={styles.userDetail__error} title={task.failReason}>
                              {task.failReason}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td>{generationType(task.modelType, task.mode)}</td>
                      <td>
                        <div className={styles.userDetail__primaryCell}>
                          <span>{task.model}</span>
                          <span className={styles.userDetail__secondaryText}>
                            {task.size} · {task.quality}
                          </span>
                        </div>
                      </td>
                      <td className={styles.userDetail__number}>
                        {task.requiredPoints.toLocaleString("zh-CN")} 积分
                      </td>
                      <td>
                        <span
                          className={clsx(
                            styles.userDetail__status,
                            generationStatusClass(task.status),
                          )}
                        >
                          {generationStatusLabels[task.status] || task.status}
                        </span>
                      </td>
                      <td className={styles.userDetail__date}>{formatDate(task.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.userDetail__empty}>暂无生成任务</div>
          )}
        </section>

        <aside className={styles.userDetail__aside}>
          <section className={styles.userDetail__panel} aria-labelledby="orders-title">
            <header className={styles.userDetail__panelHeader}>
              <h2 id="orders-title">最近订单</h2>
              <span>{orderPage.total} 笔</span>
            </header>

            {orders.length > 0 ? (
              <div className={styles.userDetail__list}>
                {orders.map((order) => {
                  const displayStatus = normalizeOrderDisplayStatus(order.displayStatus);

                  return (
                    <article key={order.orderNo} className={styles.userDetail__listRow}>
                      <div className={styles.userDetail__listMain}>
                        <span className={styles.userDetail__listTitle}>
                          {order.packageName || "自定义充值"}
                        </span>
                        <span className={styles.userDetail__listMeta}>
                          {order.amountText} · {formatDate(order.createTime)}
                        </span>
                      </div>
                      <span
                        className={clsx(styles.userDetail__status, orderStatusClass(displayStatus))}
                      >
                        {orderDisplayStatusLabels[displayStatus]}
                      </span>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className={styles.userDetail__empty}>暂无订单</div>
            )}
          </section>

          <section className={styles.userDetail__panel} aria-labelledby="flows-title">
            <header className={styles.userDetail__panelHeader}>
              <h2 id="flows-title">积分流水</h2>
              <span>{flows.length} 条</span>
            </header>

            {flows.length > 0 ? (
              <div className={styles.userDetail__list}>
                {flows.map((item) => (
                  <article key={item.id} className={styles.userDetail__listRow}>
                    <div className={styles.userDetail__listMain}>
                      <span className={styles.userDetail__listTitle}>{item.remark}</span>
                      <span className={styles.userDetail__listMeta}>
                        余额 {item.afterPoints.toLocaleString("zh-CN")} ·{" "}
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <strong
                      className={clsx(
                        styles.userDetail__flowAmount,
                        item.amount >= 0
                          ? styles.userDetail__flowAmountPositive
                          : styles.userDetail__flowAmountNegative,
                      )}
                    >
                      {item.amount > 0 ? "+" : ""}
                      {item.amount.toLocaleString("zh-CN")}
                    </strong>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.userDetail__empty}>暂无流水</div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

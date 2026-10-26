import type { LucideIcon } from "lucide-react";
import { CheckCircle2, Coins, ReceiptText, WalletCards } from "lucide-react";
import type { Metadata } from "next";
import { getFormatter, getTranslations } from "next-intl/server";
import { OrderForm } from "@/features/billing/order-form";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { CreditPackage, RechargeOverview } from "@/types/orders";
import styles from "./credits.module.css";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("credits.meta");

  return { title: t("title") };
}

type StatCardProps = {
  label: string;
  value: string;
  icon: LucideIcon;
};

function StatCard(props: StatCardProps) {
  const Icon = props.icon;

  return (
    <div className={`surface ${styles.credits__stat}`}>
      <span className={styles.credits__statIcon}>
        <Icon size={18} />
      </span>
      <div className={styles.credits__statText}>
        <p className={`label ${styles.credits__statLabel}`} title={props.label}>
          {props.label}
        </p>
        <p className={styles.credits__statValue}>{props.value}</p>
      </div>
    </div>
  );
}

export default async function CreditsPage() {
  await requireUser();
  const t = await getTranslations("credits");
  const format = await getFormatter();
  const [packages, overview] = await Promise.all([
    requestJava<CreditPackage[]>("/order/user/packages"),
    requestJava<RechargeOverview>("/order/user/recharge-orders/overview"),
  ]);

  function formatCount(value: number) {
    return format.number(value, "points");
  }

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">{t("title")}</h1>
      </section>

      <div className={styles.credits__body}>
        <section className={styles.credits__stats} aria-label={t("overview.label")}>
          <StatCard
            label={t("overview.pendingOrders")}
            value={formatCount(overview.pendingOrderCount)}
            icon={ReceiptText}
          />
          <StatCard
            label={t("overview.completedOrders")}
            value={formatCount(overview.completedOrderCount)}
            icon={CheckCircle2}
          />
          <StatCard
            label={t("overview.packages")}
            value={formatCount(overview.enabledPackageCount)}
            icon={Coins}
          />
          <StatCard
            label={t("overview.balance")}
            value={formatCount(overview.totalPoints)}
            icon={WalletCards}
          />
        </section>

        <section>
          <OrderForm packages={packages} rules={overview.rechargeRules} allowCustomOrder />
        </section>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ArrowUpRight, ImageIcon, WalletCards } from "lucide-react";
import { useState } from "react";
import { CheckInCard } from "@/features/dashboard/check-in-card";
import type { CheckInStatus } from "@/server/checkins";
import styles from "./dashboard.module.css";

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  icon: typeof WalletCards;
}) {
  return (
    <div className={styles.dashboard__metric}>
      <div className={styles.dashboard__metricHeader}>
        <div>
          <p className={styles.dashboard__eyebrow}>{label}</p>
          <p className={styles.dashboard__metricValue}>{value}</p>
        </div>
        <span className={styles.dashboard__metricIcon}>
          <Icon size={20} />
        </span>
      </div>
    </div>
  );
}

export function DashboardOverview({
  generatedCount,
  initialCreditBalance,
  checkInStatus,
}: {
  generatedCount: number;
  initialCreditBalance: number;
  checkInStatus: CheckInStatus;
}) {
  const [creditBalance, setCreditBalance] = useState(initialCreditBalance);

  function onCheckInClaimed(credits: number) {
    setCreditBalance((current) => current + credits);
  }

  return (
    <section className={styles.dashboard__summary}>
      <div className={styles.dashboard__summaryMain}>
        <div className={styles.dashboard__metrics}>
          <MetricCard label="生成总数" value={generatedCount} icon={ImageIcon} />
          <MetricCard label="剩余积分" value={creditBalance} icon={WalletCards} />
        </div>

        <section className={styles.dashboard__creationCard}>
          <div>
            <p className={styles.dashboard__eyebrow}>Create</p>
            <h2 className={styles.dashboard__creationTitle}>创作起点</h2>
          </div>
          <div className={styles.dashboard__creationActions}>
            <Link href="/generate" className="btn-primary">
              开始创作
              <ArrowUpRight size={16} />
            </Link>
            <Link href="/history" className="btn-secondary">
              查看历史
            </Link>
          </div>
        </section>
      </div>

      <CheckInCard initialStatus={checkInStatus} onClaimed={onCheckInClaimed} />
    </section>
  );
}

"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarDays, Heart, ImageIcon, WalletCards } from "lucide-react";
import { useState } from "react";
import { CheckInCard } from "@/features/dashboard/check-in-card";
import type { CheckInStatus } from "@/types/checkin";
import styles from "./dashboard.module.css";

type MetricCardProps = {
  label: string;
  value: string | number;
  icon: typeof WalletCards;
};

function MetricCard(props: MetricCardProps) {
  const label = props.label;
  const value = props.value;
  const Icon = props.icon;

  return (
    <div className={styles.dashboard__metric}>
      <div className={styles.dashboard__metricHeader}>
        <span className={styles.dashboard__metricIcon}>
          <Icon size={18} />
        </span>
        <div>
          <p className={styles.dashboard__eyebrow}>{label}</p>
          <p className={styles.dashboard__metricValue}>{value}</p>
        </div>
      </div>
    </div>
  );
}

type DashboardOverviewProps = {
  generatedCount: number;
  monthlyGeneratedCount: number;
  favoriteCount: number;
  initialBalance: number;
  checkInStatus: CheckInStatus;
};

export function DashboardOverview(props: DashboardOverviewProps) {
  const generatedCount = props.generatedCount;
  const monthlyGeneratedCount = props.monthlyGeneratedCount;
  const favoriteCount = props.favoriteCount;
  const initialBalance = props.initialBalance;
  const checkInStatus = props.checkInStatus;

  const [balance, setBalance] = useState(initialBalance);

  function onCheckInClaimed(credits: number, totalCredits?: number) {
    if (typeof totalCredits === "number") {
      setBalance(totalCredits);
      return;
    }

    setBalance((current) => current + credits);
  }

  return (
    <section className={styles.dashboard__summary}>
      <div className={styles.dashboard__summaryMain}>
        <div className={styles.dashboard__metrics}>
          <MetricCard label="生成总数" value={generatedCount} icon={ImageIcon} />
          <MetricCard label="本月生成" value={monthlyGeneratedCount} icon={CalendarDays} />
          <MetricCard label="收藏总数" value={favoriteCount} icon={Heart} />
          <MetricCard label="剩余积分" value={balance} icon={WalletCards} />
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

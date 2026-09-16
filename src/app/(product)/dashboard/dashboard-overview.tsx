"use client";

import Image from "next/image";
import { CalendarDays, Heart, ImageIcon, WalletCards } from "lucide-react";
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
  recentCreations: RecentCreation[];
};

type RecentCreation = {
  id: string;
  prompt: string;
  imageUrl: string;
  width: number;
  height: number;
};

export function DashboardOverview(props: DashboardOverviewProps) {
  const generatedCount = props.generatedCount;
  const monthlyGeneratedCount = props.monthlyGeneratedCount;
  const favoriteCount = props.favoriteCount;
  const initialBalance = props.initialBalance;
  const checkInStatus = props.checkInStatus;
  const recentCreations = props.recentCreations;

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
      <div className={styles.dashboard__topRow}>
        <div className={styles.dashboard__metrics}>
          <MetricCard label="生成总数" value={generatedCount} icon={ImageIcon} />
          <MetricCard label="本月生成" value={monthlyGeneratedCount} icon={CalendarDays} />
          <MetricCard label="收藏总数" value={favoriteCount} icon={Heart} />
          <MetricCard label="剩余积分" value={balance} icon={WalletCards} />
        </div>

        <CheckInCard initialStatus={checkInStatus} onClaimed={onCheckInClaimed} />
      </div>

      <section className={styles.dashboard__recent}>
        <h2 className={styles.dashboard__sectionTitle}>最近创作</h2>
        {recentCreations.length > 0 ? (
          <div className={styles.dashboard__recentGrid}>
            {recentCreations.map((item) => (
              <article key={item.id} className={styles.dashboard__recentItem}>
                <Image
                  className={styles.dashboard__recentImage}
                  src={item.imageUrl}
                  alt={item.prompt}
                  width={item.width}
                  height={item.height}
                  unoptimized
                />
                <p className={styles.dashboard__recentPrompt}>{item.prompt}</p>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.dashboard__recentEmpty}>还没有最近创作。</p>
        )}
      </section>
    </section>
  );
}

"use client";

import Image from "next/image";
import {
  CalendarDays,
  Clapperboard,
  Coins,
  Heart,
  ImageIcon,
  ImagePlus,
  ReceiptText,
  WalletCards,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { CheckInCard } from "@/features/dashboard/check-in-card";
import { HoverText } from "@/components/ui/hover-text";
import { Link } from "@/i18n/navigation";
import type { SignCard } from "@/types/checkin";
import styles from "./dashboard.module.css";

type MetricCardProps = {
  label: string;
  value: string;
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
        <div className={styles.dashboard__metricText}>
          <p className={styles.dashboard__eyebrow} title={label}>
            {label}
          </p>
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
  signCard: SignCard;
  recentCreations: RecentCreation[];
};

type RecentCreation = {
  id: string;
  prompt: string;
  imageUrl: string;
};

const previewSize = 768;

const quickActions = [
  { key: "generate", href: "/generate", icon: ImagePlus },
  { key: "video", href: "/video", icon: Clapperboard },
  { key: "credits", href: "/credits", icon: Coins },
  { key: "orders", href: "/billing", icon: ReceiptText },
] as const;

export function DashboardOverview(props: DashboardOverviewProps) {
  const generatedCount = props.generatedCount;
  const monthlyGeneratedCount = props.monthlyGeneratedCount;
  const favoriteCount = props.favoriteCount;
  const initialBalance = props.initialBalance;
  const signCard = props.signCard;
  const recentCreations = props.recentCreations;

  const t = useTranslations("dashboard");
  const format = useFormatter();
  const [balance, setBalance] = useState(initialBalance);

  function onCheckInClaimed(totalPoints: number) {
    setBalance(totalPoints);
  }

  function formatCount(value: number) {
    return format.number(value, "points");
  }

  return (
    <section className={styles.dashboard__summary}>
      <div className={styles.dashboard__topRow}>
        <div className={styles.dashboard__metrics}>
          <MetricCard
            label={t("metrics.generated")}
            value={formatCount(generatedCount)}
            icon={ImageIcon}
          />
          <MetricCard
            label={t("metrics.monthlyGenerated")}
            value={formatCount(monthlyGeneratedCount)}
            icon={CalendarDays}
          />
          <MetricCard
            label={t("metrics.favorites")}
            value={formatCount(favoriteCount)}
            icon={Heart}
          />
          <MetricCard
            label={t("metrics.balance")}
            value={formatCount(balance)}
            icon={WalletCards}
          />
        </div>

        <CheckInCard signCard={signCard} onClaimed={onCheckInClaimed} />
      </div>

      <nav className={styles.dashboard__quickActions} aria-label={t("quickActions.label")}>
        {quickActions.map((action) => {
          const Icon = action.icon;
          const label = t(`quickActions.${action.key}`);

          return (
            <Link key={action.key} href={action.href} className={styles.dashboard__quickAction}>
              <Icon size={18} />
              <span className={styles.dashboard__quickActionLabel} title={label}>
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      <section className={styles.dashboard__recent}>
        <h2 className={styles.dashboard__sectionTitle}>{t("recent.title")}</h2>
        {recentCreations.length > 0 ? (
          <div className={styles.dashboard__recentGrid}>
            {recentCreations.map((item) => (
              <article key={item.id} className={styles.dashboard__recentItem}>
                <Image
                  className={styles.dashboard__recentImage}
                  src={item.imageUrl}
                  alt={item.prompt}
                  width={previewSize}
                  height={previewSize}
                  unoptimized
                />
                <div className={styles.dashboard__recentBody}>
                  <HoverText as="p" className={styles.dashboard__recentPrompt} text={item.prompt} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className={styles.dashboard__recentEmpty}>{t("recent.empty")}</p>
        )}
      </section>
    </section>
  );
}

export type { RecentCreation };

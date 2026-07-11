import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth";
import { getCheckInDateInfo, getCheckInStatus } from "@/server/bff/account";
import { prisma } from "@/server/bff/orders";
import { isMockBffEnabled } from "@/server/env";
import type { CheckInStatus } from "@/types/checkin";
import { DashboardOverview } from "./dashboard-overview";
import styles from "./dashboard.module.css";

export const dynamic = "force-dynamic";

function buildEmptyCheckInStatus(): CheckInStatus {
  return {
    date: getCheckInDateInfo(),
    dailyCredits: 0,
    checkedIn: false,
    checkedAt: null,
    streakDays: 0,
    totalCheckIns: 0,
    checkedDayKeys: [],
  };
}

export default async function DashboardPage() {
  const current = await requireUser();
  let generatedCount = 0;
  let checkInStatus = buildEmptyCheckInStatus();

  if (isMockBffEnabled()) {
    generatedCount = await prisma.generatedImage.count({
      where: { userProfileId: current.profile.id },
    });
    checkInStatus = await getCheckInStatus(current.profile.id);
  }

  return (
    <AppShell active="overview">
      <div className={styles.dashboard}>
        <section className={styles.dashboard__hero}>
          <div className={styles.dashboard__heroGrid}>
            <div>
              <p className={styles.dashboard__eyebrow}>概览</p>
              <h1 className={styles.dashboard__title}>你好，{current.profile.username}</h1>
            </div>
            <div className={styles.dashboard__heroActions}>
              <Link href="/generate" className="btn-primary">
                开始创作
                <ArrowUpRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        <DashboardOverview
          generatedCount={generatedCount}
          initialBalance={current.profile.creditBalance}
          checkInStatus={checkInStatus}
        />
      </div>
    </AppShell>
  );
}

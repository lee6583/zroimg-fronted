import { AppShell } from "@/components/layout/app-shell";
import { requireUser } from "@/server/auth";
import { getCheckInDateInfo, getCheckInStatus, getDashboardStats } from "@/server/bff/account";
import { isJavaAuthEnabled, isMockBffEnabled } from "@/server/env";
import { getJavaCheckInStatus } from "@/server/bff/internal/java-checkins";
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
    weekSignDays: 0,
    totalCheckIns: 0,
    checkedDayKeys: [],
  };
}

function buildEmptyStats() {
  return {
    generatedCount: 0,
    monthlyGeneratedCount: 0,
    favoriteCount: 0,
  };
}

export default async function DashboardPage() {
  const current = await requireUser();
  let stats = buildEmptyStats();
  let checkInStatus = buildEmptyCheckInStatus();

  if (isMockBffEnabled()) {
    stats = await getDashboardStats(current.profile.id);
    checkInStatus = await getCheckInStatus(current.profile.id);
  }

  if (isJavaAuthEnabled()) {
    checkInStatus = await getJavaCheckInStatus();
  }

  return (
    <AppShell active="overview">
      <div className={styles.dashboard}>
        <section>
          <h1 className="page-title">概览</h1>
        </section>

        <DashboardOverview
          generatedCount={stats.generatedCount}
          monthlyGeneratedCount={stats.monthlyGeneratedCount}
          favoriteCount={stats.favoriteCount}
          initialBalance={current.profile.creditBalance}
          checkInStatus={checkInStatus}
        />
      </div>
    </AppShell>
  );
}

import { requireUser } from "@/server/auth";
import { getCheckInDateInfo, getCheckInStatus, getDashboardStats } from "@/server/bff/account";
import { getMediaSignedUrl, listHistoryTasks } from "@/server/bff/generation";
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

type RecentCreation = {
  id: string;
  prompt: string;
  imageUrl: string;
  width: number;
  height: number;
};

type RecentTask = Awaited<ReturnType<typeof listHistoryTasks>>[number];
type RecentOutput = RecentTask["outputs"][number];

function getPreviewAsset(output: RecentOutput) {
  if (output.thumbnailAsset) {
    return output.thumbnailAsset;
  }

  return output.outputAsset;
}

async function getRecentCreations(profileId: string) {
  const tasks = await listHistoryTasks(profileId, { sort: "desc" });
  const recentItems: Array<{
    task: RecentTask;
    output: RecentOutput;
  }> = [];

  for (const task of tasks) {
    for (const output of task.outputs) {
      recentItems.push({ task, output });

      if (recentItems.length >= 4) {
        break;
      }
    }

    if (recentItems.length >= 4) {
      break;
    }
  }

  const creations = await Promise.all(
    recentItems.map(async (item): Promise<RecentCreation> => {
      const asset = getPreviewAsset(item.output);
      const imageUrl = await getMediaSignedUrl(asset.id);
      const width = item.output.width || asset.width || 768;
      const height = item.output.height || asset.height || 768;

      return {
        id: item.output.id,
        prompt: item.task.prompt,
        imageUrl,
        width,
        height,
      };
    }),
  );

  return creations.filter((item) => {
    return Boolean(item.imageUrl);
  });
}

export default async function DashboardPage() {
  const current = await requireUser();
  let stats = buildEmptyStats();
  let checkInStatus = buildEmptyCheckInStatus();
  let recentCreations: RecentCreation[] = [];

  if (isMockBffEnabled()) {
    [stats, checkInStatus, recentCreations] = await Promise.all([
      getDashboardStats(current.profile.id),
      getCheckInStatus(current.profile.id),
      getRecentCreations(current.profile.id),
    ]);
  }

  if (isJavaAuthEnabled()) {
    checkInStatus = await getJavaCheckInStatus();
  }

  return (
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
        recentCreations={recentCreations}
      />
    </div>
  );
}

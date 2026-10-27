import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { PageResult } from "@/types/api";
import type { DashboardStats, SignCard } from "@/types/checkin";
import { userAssetThumbnailUrl } from "@/utils/media";
import { DashboardOverview } from "./dashboard-overview";
import type { RecentCreation } from "./dashboard-overview";
import styles from "./dashboard.module.css";

export const dynamic = "force-dynamic";

const recentLimit = 4;

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("dashboard.meta");

  return { title: t("title") };
}

// Java GenerationTaskVO 中概览页用到的字段。
type TaskResult = {
  id: string;
  resultType: string;
  mediaAssetId: string | null;
  resultUrl: string | null;
};

type Task = {
  taskNo: string;
  prompt: string;
  results: TaskResult[] | null;
};

async function listRecentCreations() {
  const page = await requestJava<PageResult<Task>>("/generation/user/tasks", {
    params: {
      pageNo: 1,
      pageSize: recentLimit,
      status: "succeeded",
      sortBy: "create_time",
      isAsc: false,
    },
  });

  // 按任务顺序收集图片结果，最多取 recentLimit 张。
  const creations: RecentCreation[] = [];

  for (const task of page.list) {
    const results = task.results ?? [];

    for (const result of results) {
      const isImage = result.resultType === "image";
      if (!isImage || !result.resultUrl) {
        continue;
      }

      // 概览卡片很小，用缩略图而不是原图
      let imageUrl = result.resultUrl;
      if (result.mediaAssetId) {
        imageUrl = userAssetThumbnailUrl(result.mediaAssetId);
      }

      creations.push({
        id: result.id,
        prompt: task.prompt,
        imageUrl,
      });
    }
  }

  return creations.slice(0, recentLimit);
}

export default async function DashboardPage() {
  const user = await requireUser();
  const t = await getTranslations("dashboard");
  const [stats, signCard, recentCreations] = await Promise.all([
    requestJava<DashboardStats>("/points/user/dashboard"),
    requestJava<SignCard>("/points/user/sign-card"),
    listRecentCreations(),
  ]);

  return (
    <div className={styles.dashboard}>
      <section>
        <h1 className="page-title">{t("title")}</h1>
      </section>

      <DashboardOverview
        generatedCount={stats.generatedCount}
        monthlyGeneratedCount={stats.monthlyGeneratedCount}
        favoriteCount={stats.favoriteCount}
        initialBalance={user.totalPoints}
        signCard={signCard}
        recentCreations={recentCreations}
      />
    </div>
  );
}

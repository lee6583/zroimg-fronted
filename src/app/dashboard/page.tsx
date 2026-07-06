import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireUser } from "@/server/auth";
import { getCheckInStatus } from "@/server/checkins";
import { prisma } from "@/server/db";
import { DashboardOverview } from "./dashboard-overview";
import styles from "./dashboard.module.css";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const current = await requireUser();

  const [generatedCount, checkInStatus] = await Promise.all([
    prisma.generatedImage.count({ where: { userProfileId: current.profile.id } }),
    getCheckInStatus(current.profile.id),
  ]);

  return (
    <AppShell active="overview">
      <div className={styles.dashboard}>
        <section className={styles.dashboard__hero}>
          <div className={styles.dashboard__heroGrid}>
            <div>
              <p className={styles.dashboard__eyebrow}>概览</p>
              <h1 className={styles.dashboard__title}>
                你好，{current.profile.username}
              </h1>
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
          initialCreditBalance={current.profile.creditBalance}
          checkInStatus={checkInStatus}
        />
      </div>
    </AppShell>
  );
}

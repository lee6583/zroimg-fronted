import Link from "next/link";
import { Coins, ReceiptText, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { OrderForm } from "@/features/billing/order-form";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/bff/orders";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const current = await requireUser();
  const [packages, pendingOrders] = await Promise.all([
    prisma.creditPackage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.paymentOrder.count({
      where: {
        userProfileId: current.profile.id,
        status: "pending",
      },
    }),
  ]);

  return (
    <AppShell active="credits">
      <div className="grid gap-6">
        <section className="surface rounded-xl p-6 md:p-8">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="label">积分购买</p>
              <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight md:text-5xl">购买积分</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted">
                给灵感多留一点余量。选择适合你的积分包，用于图片生成、编辑与更多版本探索。
              </p>
            </div>
            <Link href="/billing" className="btn-secondary">
              查看订单
            </Link>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="surface rounded-xl p-5">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-soft">
              <WalletCards size={20} />
            </span>
            <p className="mt-4 label">当前余额</p>
            <p className="mt-2 font-serif text-3xl font-medium tracking-tight">{current.profile.creditBalance}</p>
          </div>
          <div className="surface rounded-xl p-5">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-soft">
              <Coins size={20} />
            </span>
            <p className="mt-4 label">可购买套餐</p>
            <p className="mt-2 font-serif text-3xl font-medium tracking-tight">{packages.length}</p>
          </div>
          <div className="surface rounded-xl p-5">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-soft">
              <ReceiptText size={20} />
            </span>
            <p className="mt-4 label">待支付订单</p>
            <p className="mt-2 font-serif text-3xl font-medium tracking-tight">{pendingOrders}</p>
          </div>
        </section>

        <section className="max-w-xl">
          <OrderForm
            packages={packages.map((item) => ({
              code: item.code,
              name: item.name,
              credits: item.credits,
              priceCny: item.priceCny.toString(),
            }))}
          />
        </section>
      </div>
    </AppShell>
  );
}

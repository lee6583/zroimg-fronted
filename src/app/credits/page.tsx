import { CheckCircle2, Coins, ReceiptText, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { OrderForm } from "@/features/billing/order-form";
import { requireUser } from "@/server/auth";
import { prisma } from "@/server/bff/orders";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const current = await requireUser();
  const [packages, pendingOrders, completedOrders] = await Promise.all([
    prisma.creditPackage.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    prisma.paymentOrder.count({
      where: {
        userProfileId: current.profile.id,
        status: "pending",
      },
    }),
    prisma.paymentOrder.count({
      where: {
        userProfileId: current.profile.id,
        status: "fulfilled",
      },
    }),
  ]);

  return (
    <AppShell active="credits">
      <div className="grid gap-6">
        <section>
          <h1 className="page-title">购买积分</h1>
        </section>

        <section className="grid gap-3 md:grid-cols-4">
          <div className="surface flex items-start justify-between gap-3 rounded-xl p-4">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-soft">
              <ReceiptText size={18} />
            </span>
            <div className="grid min-w-20 justify-items-center text-center">
              <p className="label">待支付订单</p>
              <p className="mt-1.5 font-serif text-2xl font-medium tracking-tight">
                {pendingOrders}
              </p>
            </div>
          </div>

          <div className="surface flex items-start justify-between gap-3 rounded-xl p-4">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-soft">
              <CheckCircle2 size={18} />
            </span>
            <div className="grid min-w-20 justify-items-center text-center">
              <p className="label">已完成订单</p>
              <p className="mt-1.5 font-serif text-2xl font-medium tracking-tight">
                {completedOrders}
              </p>
            </div>
          </div>

          <div className="surface flex items-start justify-between gap-3 rounded-xl p-4">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-soft">
              <Coins size={18} />
            </span>
            <div className="grid min-w-20 justify-items-center text-center">
              <p className="label">可购买套餐</p>
              <p className="mt-1.5 font-serif text-2xl font-medium tracking-tight">
                {packages.length}
              </p>
            </div>
          </div>

          <div className="surface flex items-start justify-between gap-3 rounded-xl p-4">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-soft">
              <WalletCards size={18} />
            </span>
            <div className="grid min-w-20 justify-items-center text-center">
              <p className="label">当前余额</p>
              <p className="mt-1.5 font-serif text-2xl font-medium tracking-tight">
                {current.profile.creditBalance}
              </p>
            </div>
          </div>
        </section>

        <section>
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

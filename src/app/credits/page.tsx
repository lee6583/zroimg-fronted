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
        <section>
          <h1 className="page-title">购买积分</h1>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="surface rounded-xl p-5">
            <span className="grid h-11 w-11 place-items-center rounded-md bg-soft">
              <WalletCards size={20} />
            </span>
            <p className="mt-4 label">当前余额</p>
            <p className="mt-2 font-serif text-3xl font-medium tracking-tight">
              {current.profile.creditBalance}
            </p>
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

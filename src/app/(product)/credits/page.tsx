import { CheckCircle2, Coins, ReceiptText, WalletCards } from "lucide-react";
import { OrderForm } from "@/features/billing/order-form";
import { requireUser } from "@/server/auth";
import { getRechargeOverview, listCreditPackages } from "@/server/bff/orders";
import { isMockBffEnabled } from "@/server/env";

export const dynamic = "force-dynamic";

export default async function CreditsPage() {
  const current = await requireUser();
  const allowCustomOrder = isMockBffEnabled();
  const [packages, overview] = await Promise.all([
    listCreditPackages(),
    getRechargeOverview({
      userProfileId: current.profile.id,
      totalPoints: current.profile.creditBalance,
    }),
  ]);

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">购买积分</h1>
      </section>

      <div className="grid gap-6">
        <section className="grid gap-3 md:grid-cols-4">
          <div className="surface flex items-start justify-between gap-3 rounded-xl p-4">
            <span className="grid h-10 w-10 place-items-center rounded-md bg-soft">
              <ReceiptText size={18} />
            </span>
            <div className="grid min-w-20 justify-items-center text-center">
              <p className="label">待支付订单</p>
              <p className="mt-1.5 font-serif text-2xl font-medium tracking-tight">
                {overview.pendingOrderCount}
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
                {overview.completedOrderCount}
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
                {overview.enabledPackageCount}
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
                {overview.totalPoints}
              </p>
            </div>
          </div>
        </section>

        <section>
          <OrderForm packages={packages} allowCustomOrder={allowCustomOrder} />
        </section>
      </div>
    </div>
  );
}

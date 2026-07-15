import Link from "next/link";
import { ProductTopNav } from "@/components/layout/product-top-nav";

export default function BillingResultPage() {
  return (
    <>
      <ProductTopNav />
      <main className="mx-auto w-full max-w-xl px-4 py-16">
        <div className="surface rounded-md p-6">
          <h1 className="page-title">支付处理中</h1>
          <p className="page-description">积分以易支付异步回调为准，到账后会显示在账单页。</p>
          <Link href="/billing" className="btn-primary mt-6">
            查看账单
          </Link>
        </div>
      </main>
    </>
  );
}

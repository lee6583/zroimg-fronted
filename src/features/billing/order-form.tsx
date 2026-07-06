"use client";

import { useState } from "react";
import { AppSelect } from "@/components/app-select";
import {
  calculateCustomCredits,
  CUSTOM_CREDITS_PER_CNY,
  CUSTOM_MAX_AMOUNT_CNY,
  CUSTOM_MIN_AMOUNT_CNY,
} from "@/shared/credits";

type Package = {
  code: string;
  name: string;
  credits: number;
  priceCny: string;
};

export function OrderForm({ packages }: { packages: Package[] }) {
  const [mode, setMode] = useState<"package" | "custom">("package");
  const [packageCode, setPackageCode] = useState(packages[0]?.code || "");
  const [paymentType, setPaymentType] = useState<"alipay" | "wxpay">("alipay");
  const [customAmount, setCustomAmount] = useState("29");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const customAmountNumber = Number(customAmount);
  const normalizedCustomAmount = Number.isFinite(customAmountNumber) ? Math.round(customAmountNumber * 100) / 100 : 0;
  const customCredits = calculateCustomCredits(normalizedCustomAmount);

  async function createOrder() {
    setLoading(true);
    setMessage("");
    if (mode === "custom" && (!Number.isFinite(customAmountNumber) || customAmountNumber < CUSTOM_MIN_AMOUNT_CNY || customAmountNumber > CUSTOM_MAX_AMOUNT_CNY)) {
      setMessage(`请输入 ¥${CUSTOM_MIN_AMOUNT_CNY} - ¥${CUSTOM_MAX_AMOUNT_CNY} 之间的金额`);
      setLoading(false);
      return;
    }
    const response = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        mode === "package"
          ? { mode, packageCode, paymentType }
          : {
              mode,
              amountCny: normalizedCustomAmount,
              paymentType,
            },
      ),
    });
    const data = await response.json();
    setLoading(false);
    if (!response.ok) {
      setMessage(data.error || "创建订单失败");
      return;
    }
    if (data.order?.payUrl) {
      window.location.href = data.order.payUrl;
    } else {
      setMessage("订单已创建，但支付地址为空，请检查易支付配置。");
    }
  }

  return (
    <div className="surface rounded-xl p-5">
      <p className="label">Recharge</p>
      <h2 className="mt-1 font-serif text-2xl font-medium tracking-tight">选择你的灵感额度</h2>
      <p className="mt-2 text-sm leading-6 text-muted">选好积分包后即可前往支付，让下一张图从这里开始。</p>
      <div className="mt-4 grid gap-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg border border-line bg-soft p-1">
          <button
            type="button"
            onClick={() => setMode("package")}
            className={mode === "package" ? "min-h-9 rounded-md bg-panel text-sm font-medium text-foreground" : "min-h-9 rounded-md text-sm font-medium text-muted hover:text-foreground"}
          >
            套餐购买
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={mode === "custom" ? "min-h-9 rounded-md bg-panel text-sm font-medium text-foreground" : "min-h-9 rounded-md text-sm font-medium text-muted hover:text-foreground"}
          >
            自定义购买
          </button>
        </div>

        {mode === "package" ? (
          <label className="grid gap-2">
            <span className="label">套餐</span>
            <AppSelect
              value={packageCode}
              onChange={setPackageCode}
              disabled={packages.length === 0}
              placeholder="暂无可购买套餐"
              options={packages.map((item) => ({
                value: item.code,
                label: `${item.name} · ${item.credits} 积分 · ¥${item.priceCny}`,
              }))}
            />
          </label>
        ) : (
          <div className="grid gap-3 rounded-xl border border-line p-4">
            <label className="grid gap-2">
              <span className="label">自定义金额</span>
              <span className="relative block">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted">¥</span>
                <input
                  className="field pl-8 text-sm"
                  inputMode="decimal"
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value)}
                  placeholder="输入购买金额"
                />
              </span>
            </label>
            <div className="rounded-lg bg-soft p-3 text-sm leading-6 text-muted">
              <p>
                预计到账 <span className="font-medium text-foreground">{customCredits}</span> 积分
              </p>
              <p>
                自定义购买按 ¥1 = {CUSTOM_CREDITS_PER_CNY} 积分折算，套餐通常会更划算。
              </p>
            </div>
          </div>
        )}

        <label className="grid gap-2">
          <span className="label">支付方式</span>
          <AppSelect
            value={paymentType}
            onChange={setPaymentType}
            options={[
              { value: "alipay", label: "支付宝" },
              { value: "wxpay", label: "微信支付" },
            ]}
          />
        </label>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
        <button className="btn-primary" onClick={createOrder} disabled={loading || (mode === "package" && packages.length === 0)}>
          {loading ? "创建中" : "去支付"}
        </button>
      </div>
    </div>
  );
}

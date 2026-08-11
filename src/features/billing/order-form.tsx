"use client";

import clsx from "clsx";
import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { ordersApi } from "@/api/orders/purchase";
import type { CreditPackage, PaymentType, RechargeRules } from "@/types/orders";
import { calculateCustomCredits } from "@/utils/credits";
import { calculateRechargeFeeCent } from "@/utils/recharge";
import styles from "./order-form.module.css";

type PackageCopy = {
  name: string;
  line: string;
  badge?: string;
  features: string[];
};

type DisplayPackage =
  | {
      kind: "package";
      id: string;
      code: string;
      amountText: string;
      amountCent: number;
      credits: number;
      copy: PackageCopy;
    }
  | {
      kind: "custom";
      code: string;
      priceCny: string;
      amountCny: number;
      amountCent: number;
      credits: number;
      copy: PackageCopy;
    };

type OrderFormProps = {
  packages: CreditPackage[];
  rules: RechargeRules;
  allowCustomOrder: boolean;
};

const paymentChannels: { value: PaymentType; label: string }[] = [
  { value: "alipay", label: "支付宝" },
  { value: "wxpay", label: "微信支付" },
];
const quickAmounts = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
const enterpriseAmount = 400;
const amountTextPattern = /^\d*(\.\d{0,2})?$/;

function getCustomPackageCopy(credits: number): PackageCopy {
  return {
    name: "企业协作",
    line: "为团队、品牌和长期项目准备更充足的创作额度。",
    features: [
      `${credits} 积分，适合团队协同创作`,
      "覆盖批量物料、活动视觉与品牌素材",
      "适合多成员长期稳定产出",
      "适合企业项目预研与正式投放",
    ],
  };
}

function getPackageCopy(item: CreditPackage): PackageCopy {
  return {
    name: item.name,
    line: item.description,
    badge: item.recommended ? "最受欢迎" : undefined,
    features: item.highlights,
  };
}

function isValidAmountText(value: string) {
  if (value === "") {
    return true;
  }

  return amountTextPattern.test(value);
}

function isOverMaxAmount(value: string, maxAmountCny: number) {
  const amountValue = Number(value);
  if (!Number.isFinite(amountValue)) {
    return false;
  }

  return amountValue > maxAmountCny;
}

function formatCny(amountCent: number) {
  return `¥${(amountCent / 100).toFixed(2)}`;
}

export function OrderForm(props: OrderFormProps) {
  const packages = props.packages;
  const rules = props.rules;
  const allowCustomOrder = props.allowCustomOrder;
  const minAmountCny = rules.minAmountCent / 100;
  const maxAmountCny = rules.maxAmountCent / 100;
  const defaultCustomAmount = Math.min(maxAmountCny, Math.max(minAmountCny, 29));
  const customPackageAmount = Math.min(maxAmountCny, Math.max(minAmountCny, enterpriseAmount));

  const [customAmount, setCustomAmount] = useState(String(defaultCustomAmount));
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("alipay");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);

  const displayPackages: DisplayPackage[] = packages.map((item) => ({
    kind: "package" as const,
    id: item.id,
    code: item.code,
    amountText: item.amountText,
    amountCent: item.amountCent,
    credits: item.credits,
    copy: getPackageCopy(item),
  }));

  if (allowCustomOrder) {
    displayPackages.push({
      kind: "custom",
      code: "ENTERPRISE_2000",
      priceCny: String(customPackageAmount),
      amountCny: customPackageAmount,
      amountCent: Math.round(customPackageAmount * 100),
      credits: calculateCustomCredits(customPackageAmount, rules.creditsPerYuan),
      copy: getCustomPackageCopy(calculateCustomCredits(customPackageAmount, rules.creditsPerYuan)),
    });
  }

  const rawAmount = Number(customAmount);
  const amount = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) / 100 : 0;
  const customAmountCent = Math.round(amount * 100);
  const customFeeCent = calculateRechargeFeeCent(customAmountCent, rules.feeRatePercent);
  const customPayableCent = customAmountCent + customFeeCent;
  const customCredits = calculateCustomCredits(amount, rules.creditsPerYuan);

  async function createPackageOrder(packageId: string) {
    setLoading(true);
    setMessage("");

    try {
      const data = await ordersApi.createOrder({
        mode: "package",
        packageId,
        paymentType,
      });
      handleOrderResult(data.order?.resultUrl ?? undefined);
    } catch (error) {
      setLoading(false);
      setMessage(getErrorMessage(error));
    }
  }

  async function createCustomOrder(amountOverride?: number) {
    setLoading(true);
    setMessage("");

    const orderAmount = amountOverride ?? amount;
    const isInvalidAmount =
      !Number.isFinite(orderAmount) || orderAmount < minAmountCny || orderAmount > maxAmountCny;

    if (isInvalidAmount) {
      setMessage(
        `请输入 ${formatCny(rules.minAmountCent)} - ${formatCny(rules.maxAmountCent)} 之间的金额`,
      );
      setLoading(false);
      return;
    }

    try {
      const data = await ordersApi.createOrder({
        mode: "custom",
        amountCny: orderAmount,
        paymentType,
      });
      handleOrderResult(data.order?.resultUrl ?? undefined);
    } catch (error) {
      setLoading(false);
      setMessage(getErrorMessage(error));
    }
  }

  function handleOrderResult(resultUrl?: string) {
    setLoading(false);
    if (resultUrl) {
      window.location.assign(resultUrl);
      return;
    }

    setMessage("订单已创建，但订单确认页地址为空，请检查支付配置。");
  }

  function handleQuickAmountClick(value: number) {
    setSelectedQuickAmount(value);
    setCustomAmount(String(value));
    setMessage("");
  }

  function handleCustomAmountChange(value: string) {
    if (!isValidAmountText(value)) {
      return;
    }

    if (isOverMaxAmount(value, maxAmountCny)) {
      setMessage(`单次购买金额不能超过 ${formatCny(rules.maxAmountCent)}`);
      return;
    }

    setSelectedQuickAmount(null);
    setCustomAmount(value);
    setMessage("");
  }

  return (
    <div className={styles.orderForm}>
      <section className={styles.orderForm__section}>
        <div className={styles.orderForm__sectionHeader}>
          <h2 className={styles.orderForm__sectionTitle}>支付方式</h2>
        </div>
        <div className={styles.orderForm__channels}>
          {paymentChannels.map((channel) => {
            const isActive = paymentType === channel.value;

            return (
              <button
                key={channel.value}
                type="button"
                onClick={() => setPaymentType(channel.value)}
                className={clsx(
                  styles.orderForm__channel,
                  isActive && styles.orderForm__channelActive,
                )}
              >
                {channel.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.orderForm__section}>
        <div className={styles.orderForm__sectionHeader}>
          <h2 className={styles.orderForm__sectionTitle}>套餐购买</h2>
        </div>

        <div className={styles.orderForm__packages}>
          {displayPackages.map((item) => {
            const copy = item.copy;
            const isPopular = Boolean(copy.badge);
            const feeAmountCent = calculateRechargeFeeCent(item.amountCent, rules.feeRatePercent);
            const payableAmountCent = item.amountCent + feeAmountCent;
            const canPurchase =
              item.kind === "custom" ||
              (item.amountCent >= rules.minAmountCent && item.amountCent <= rules.maxAmountCent);

            return (
              <article
                key={item.code}
                className={clsx(
                  styles.orderForm__packageCard,
                  isPopular && styles.orderForm__packageCardPopular,
                )}
              >
                {copy.badge ? <span className={styles.orderForm__badge}>{copy.badge}</span> : null}
                <p className={styles.orderForm__code}>{item.code}</p>
                <h3 className={styles.orderForm__planName}>{copy.name}</h3>
                <p className={styles.orderForm__planLine}>{copy.line}</p>
                <p className={styles.orderForm__price}>
                  {item.kind === "package" ? item.amountText : `¥${item.priceCny}`}
                </p>
                <p className={styles.orderForm__credits}>{item.credits} 积分</p>
                {feeAmountCent > 0 ? (
                  <p className={styles.orderForm__fee}>
                    含手续费，实付 {formatCny(payableAmountCent)}
                  </p>
                ) : null}
                <ul className={styles.orderForm__features}>
                  {copy.features.map((feature) => (
                    <li key={feature} className={styles.orderForm__feature}>
                      <span
                        className={clsx(
                          styles.orderForm__featureDot,
                          isPopular && styles.orderForm__featureDotPopular,
                        )}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={isLoading || !canPurchase}
                  onClick={() => {
                    if (item.kind === "package") {
                      void createPackageOrder(item.id);
                      return;
                    }

                    void createCustomOrder(item.amountCny);
                  }}
                  className={clsx(
                    styles.orderForm__packageButton,
                    isPopular && styles.orderForm__packageButtonPopular,
                  )}
                >
                  {isLoading ? "创建中" : canPurchase ? "立即购买" : "暂不可购买"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {allowCustomOrder ? (
        <section className={styles.orderForm__section}>
          <div className={styles.orderForm__sectionHeader}>
            <h2 className={styles.orderForm__sectionTitle}>自定义购买</h2>
          </div>

          <div className={styles.orderForm__custom}>
            <div className={styles.orderForm__quickAmounts}>
              {quickAmounts
                .filter((item) => item >= minAmountCny && item <= maxAmountCny)
                .map((item) => {
                  const isActive = selectedQuickAmount === item;

                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handleQuickAmountClick(item)}
                      className={clsx(
                        styles.orderForm__quickAmount,
                        isActive && styles.orderForm__quickAmountActive,
                      )}
                    >
                      {item}
                    </button>
                  );
                })}
            </div>

            <label className={styles.orderForm__field}>
              <span className="label">自定义金额</span>
              <span className={styles.orderForm__inputWrap}>
                <span className={styles.orderForm__currency}>¥</span>
                <input
                  className={clsx("field", styles.orderForm__input)}
                  inputMode="decimal"
                  min={minAmountCny}
                  max={maxAmountCny}
                  pattern="^\d*(\.\d{0,2})?$"
                  value={customAmount}
                  onChange={(event) => handleCustomAmountChange(event.target.value)}
                  placeholder="输入购买金额"
                />
              </span>
            </label>
            <div className={styles.orderForm__hint}>
              <span>到账积分</span>
              <strong>{customCredits}</strong>
              <span>手续费</span>
              <strong>{formatCny(customFeeCent)}</strong>
              <span>实付金额</span>
              <strong>{formatCny(customPayableCent)}</strong>
            </div>

            <button
              className="btn-primary"
              onClick={() => createCustomOrder()}
              disabled={isLoading}
            >
              {isLoading ? "创建中" : `确认支付 ${formatCny(customPayableCent)}`}
            </button>
          </div>
        </section>
      ) : null}

      {message ? <p className={styles.orderForm__message}>{message}</p> : null}
    </div>
  );
}

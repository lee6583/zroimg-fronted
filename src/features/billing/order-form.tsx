"use client";

import clsx from "clsx";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { ordersApi } from "@/api/orders/purchase";
import type {
  CreateRechargeOrderRequest,
  CreditPackage,
  PaymentType,
  RechargeRules,
} from "@/types/orders";
import { calculateCustomCredits } from "@/utils/credits";
import { calculateRechargeFeeCent } from "@/utils/recharge";
import styles from "./order-form.module.css";
import { translateApiError } from "@/i18n/api-error";
import { useRouter } from "@/i18n/navigation";

type PackageCopy = {
  name: string;
  line: string;
  isPopular: boolean;
  features: string[];
};

type DisplayPackage =
  | {
      kind: "package";
      id: string;
      code: string;
      amountCent: number;
      credits: number;
      copy: PackageCopy;
    }
  | {
      kind: "custom";
      code: string;
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

const paymentChannels: PaymentType[] = ["alipay", "wxpay"];
const enterpriseFeatureKeys = ["materials", "members", "projects"] as const;
const quickAmounts = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
const enterpriseAmount = 400;
const amountTextPattern = /^\d*(\.\d{0,2})?$/;

// 后台配置的套餐名称、描述、亮点原样展示，不进翻译文件。
function getPackageCopy(item: CreditPackage): PackageCopy {
  return {
    name: item.name,
    line: item.description,
    isPopular: item.recommended,
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

export function OrderForm(props: OrderFormProps) {
  const packages = props.packages;
  const rules = props.rules;
  const allowCustomOrder = props.allowCustomOrder;
  const minAmountCny = rules.minAmountCent / 100;
  const maxAmountCny = rules.maxAmountCent / 100;
  const defaultCustomAmount = Math.min(maxAmountCny, Math.max(minAmountCny, 29));
  const customPackageAmount = Math.min(maxAmountCny, Math.max(minAmountCny, enterpriseAmount));

  const t = useTranslations("credits");
  const tError = useTranslations("errors.api");
  const format = useFormatter();
  const router = useRouter();
  const [customAmount, setCustomAmount] = useState(String(defaultCustomAmount));
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>("alipay");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);

  function formatCny(amountCent: number) {
    return format.number(amountCent / 100, "currency");
  }

  function getCustomPackageCopy(credits: number): PackageCopy {
    return {
      name: t("enterprise.name"),
      line: t("enterprise.line"),
      isPopular: false,
      features: [
        t("enterprise.features.points", { points: credits }),
        ...enterpriseFeatureKeys.map((key) => t(`enterprise.features.${key}`)),
      ],
    };
  }

  const displayPackages: DisplayPackage[] = packages.map((item) => ({
    kind: "package" as const,
    id: item.id,
    code: item.code,
    amountCent: item.amountCent,
    credits: item.credits,
    copy: getPackageCopy(item),
  }));

  if (allowCustomOrder) {
    displayPackages.push({
      kind: "custom",
      code: "ENTERPRISE_2000",
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
  const customSummary = t("custom.summary", {
    amount: formatCny(customPayableCent),
    points: customCredits,
  });

  async function submitOrder(data: CreateRechargeOrderRequest) {
    setLoading(true);
    setMessage("");

    try {
      const order = await ordersApi.create(data);
      router.push(`/billing/result?order=${encodeURIComponent(order.orderNo)}`);
    } catch (error) {
      setLoading(false);
      setMessage(translateApiError(error, tError));
    }
  }

  function createPackageOrder(packageId: string) {
    void submitOrder({ packageId, payChannel: paymentType });
  }

  function createCustomOrder(amountOverride?: number) {
    const orderAmount = amountOverride ?? amount;
    const isInvalidAmount =
      !Number.isFinite(orderAmount) || orderAmount < minAmountCny || orderAmount > maxAmountCny;

    if (isInvalidAmount) {
      setMessage(
        t("custom.invalidAmount", {
          min: formatCny(rules.minAmountCent),
          max: formatCny(rules.maxAmountCent),
        }),
      );
      return;
    }

    void submitOrder({ amountCent: Math.round(orderAmount * 100), payChannel: paymentType });
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
      setMessage(t("custom.overMax", { max: formatCny(rules.maxAmountCent) }));
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
          <h2 className={styles.orderForm__sectionTitle}>{t("payment.title")}</h2>
        </div>
        <div className={styles.orderForm__channels}>
          {paymentChannels.map((channel) => {
            const isActive = paymentType === channel;

            return (
              <button
                key={channel}
                type="button"
                aria-pressed={isActive}
                onClick={() => setPaymentType(channel)}
                className={clsx(
                  styles.orderForm__channel,
                  isActive && styles.orderForm__channelActive,
                )}
              >
                <span className={styles.orderForm__channelLabel}>
                  {t(`payment.channels.${channel}`)}
                </span>
                <span className={styles.orderForm__channelIndicator} aria-hidden="true" />
              </button>
            );
          })}
        </div>
      </section>

      <section className={styles.orderForm__section}>
        <div className={styles.orderForm__sectionHeader}>
          <h2 className={styles.orderForm__sectionTitle}>{t("packages.title")}</h2>
        </div>

        <div className={styles.orderForm__packages}>
          {displayPackages.map((item) => {
            const copy = item.copy;
            const isPopular = copy.isPopular;
            const feeAmountCent = calculateRechargeFeeCent(item.amountCent, rules.feeRatePercent);
            const payableAmountCent = item.amountCent + feeAmountCent;
            const canPurchase =
              item.kind === "custom" ||
              (item.amountCent >= rules.minAmountCent && item.amountCent <= rules.maxAmountCent);
            let buttonLabel = t("packages.buy");
            if (isLoading) {
              buttonLabel = t("packages.creating");
            } else if (!canPurchase) {
              buttonLabel = t("packages.unavailable");
            }

            return (
              <article
                key={item.code}
                className={clsx(
                  styles.orderForm__packageCard,
                  isPopular && styles.orderForm__packageCardPopular,
                )}
              >
                {isPopular ? (
                  <span className={styles.orderForm__badge}>{t("packages.popular")}</span>
                ) : null}
                <p className={styles.orderForm__code}>{item.code}</p>
                <h3 className={styles.orderForm__planName}>{copy.name}</h3>
                <p className={styles.orderForm__planLine}>{copy.line}</p>
                <div className={styles.orderForm__priceRow}>
                  <p className={styles.orderForm__price}>{formatCny(item.amountCent)}</p>
                  <p className={styles.orderForm__credits}>
                    {t("packages.points", { points: item.credits })}
                  </p>
                </div>
                {feeAmountCent > 0 ? (
                  <p className={styles.orderForm__fee}>
                    {t("packages.payableWithFee", { amount: formatCny(payableAmountCent) })}
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
                      createPackageOrder(item.id);
                      return;
                    }

                    createCustomOrder(item.amountCny);
                  }}
                  className={clsx(
                    styles.orderForm__packageButton,
                    isPopular && styles.orderForm__packageButtonPopular,
                  )}
                >
                  {buttonLabel}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      {allowCustomOrder ? (
        <section className={styles.orderForm__section}>
          <div className={styles.orderForm__sectionHeader}>
            <h2 className={styles.orderForm__sectionTitle}>{t("custom.title")}</h2>
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
                      {format.number(item, "currency")}
                    </button>
                  );
                })}
            </div>

            <label className={styles.orderForm__field}>
              <span className="label">{t("custom.amountLabel")}</span>
              <span className={styles.orderForm__inputWrap}>
                <span className={styles.orderForm__currency}>{t("custom.currencySymbol")}</span>
                <input
                  className={clsx("field", styles.orderForm__input)}
                  inputMode="decimal"
                  min={minAmountCny}
                  max={maxAmountCny}
                  pattern="^\d*(\.\d{0,2})?$"
                  value={customAmount}
                  onChange={(event) => handleCustomAmountChange(event.target.value)}
                  placeholder={t("custom.placeholder")}
                />
              </span>
            </label>
            <div className={styles.orderForm__hint}>
              <span>{t("custom.credits")}</span>
              <strong>{format.number(customCredits, "points")}</strong>
              <span>{t("custom.fee")}</span>
              <strong>{formatCny(customFeeCent)}</strong>
              <span>{t("custom.payable")}</span>
              <strong>{formatCny(customPayableCent)}</strong>
            </div>

            <div className={styles.orderForm__submitBar}>
              <p className={styles.orderForm__submitSummary} title={customSummary}>
                {customSummary}
              </p>
              <button
                type="button"
                className={clsx("btn-primary", styles.orderForm__submitButton)}
                onClick={() => createCustomOrder()}
                disabled={isLoading}
              >
                {isLoading ? (
                  t("custom.creating")
                ) : (
                  <>
                    <span className={styles.orderForm__submitLong}>
                      {t("custom.submit", { amount: formatCny(customPayableCent) })}
                    </span>
                    <span className={styles.orderForm__submitShort}>{t("custom.submitShort")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {message ? <p className={styles.orderForm__message}>{message}</p> : null}
    </div>
  );
}

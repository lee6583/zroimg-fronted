"use client";

import clsx from "clsx";
import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { ordersApi } from "@/api/orders/purchase";
import {
  calculateCustomCredits,
  CUSTOM_CREDITS_PER_CNY,
  CUSTOM_MAX_AMOUNT_CNY,
  CUSTOM_MIN_AMOUNT_CNY,
} from "@/utils/credits";
import styles from "./order-form.module.css";

type Package = {
  code: string;
  name: string;
  credits: number;
  priceCny: string;
};

type PackageCopy = {
  name: string;
  line: string;
  badge?: string;
  features: string[];
};

type DisplayPackage =
  | {
      kind: "package";
      code: string;
      priceCny: string;
      credits: number;
      copy: PackageCopy;
    }
  | {
      kind: "custom";
      code: string;
      priceCny: string;
      amountCny: number;
      credits: number;
      copy: PackageCopy;
    };

type OrderFormProps = {
  packages: Package[];
};

const defaultPaymentType = "alipay" as const;
const quickAmounts = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
const enterpriseAmount = 400;

const packageCopy: Record<string, PackageCopy> = {
  STARTER_100: {
    name: "轻量试创",
    line: "把脑海里的第一束光，先变成看得见的画面。",
    features: [
      "100 积分，即买即用",
      "适合头像、封面与灵感草稿",
      "支持文本生图与图生图",
      "订单与积分流水清晰可查",
    ],
  },
  PRO_500: {
    name: "创作者",
    line: "为持续创作留出余量，让好想法不必停在半路。",
    badge: "最受欢迎",
    features: [
      "500 积分，适合日常高频创作",
      "覆盖主流图片生成与编辑场景",
      "适合社媒配图、海报与产品概念",
      "失败任务自动返还本次消耗",
    ],
  },
  MAX_1200: {
    name: "灵感工作室",
    line: "给完整项目一整片画布，从概念到成片都从容推进。",
    features: [
      "1200 积分，适合项目制创作",
      "更适合多版本探索与精修",
      "适合品牌视觉、系列图与素材库",
      "购买记录可在我的订单中查看",
    ],
  },
  ENTERPRISE_2000: {
    name: "企业协作",
    line: "为团队、品牌和长期项目准备更充足的创作额度。",
    features: [
      "2000 积分，适合团队协同创作",
      "覆盖批量物料、活动视觉与品牌素材",
      "适合多成员长期稳定产出",
      "适合企业项目预研与正式投放",
    ],
  },
};

function getPackageCopy(item: Package): PackageCopy {
  const copy = packageCopy[item.code];
  if (copy) {
    return copy;
  }

  return {
    name: item.name,
    line: "为下一次创作补充能量，让想法继续向前。",
    features: [
      `${item.credits} 积分，即买即用`,
      "支持图片生成与编辑",
      "适合按需补充创作额度",
      "购买记录可在我的订单中查看",
    ],
  };
}

export function OrderForm(props: OrderFormProps) {
  const packages = props.packages;

  const [customAmount, setCustomAmount] = useState("29");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);

  const displayPackages: DisplayPackage[] = [
    ...packages.map((item) => ({
      kind: "package" as const,
      code: item.code,
      priceCny: item.priceCny,
      credits: item.credits,
      copy: getPackageCopy(item),
    })),
    {
      kind: "custom",
      code: "ENTERPRISE_2000",
      priceCny: String(enterpriseAmount),
      amountCny: enterpriseAmount,
      credits: calculateCustomCredits(enterpriseAmount),
      copy: packageCopy.ENTERPRISE_2000,
    },
  ];

  const rawAmount = Number(customAmount);
  const amount = Number.isFinite(rawAmount) ? Math.round(rawAmount * 100) / 100 : 0;
  const customCredits = calculateCustomCredits(amount);

  async function createPackageOrder(packageCode: string) {
    setLoading(true);
    setMessage("");

    try {
      const data = await ordersApi.createOrder({
        mode: "package",
        packageCode,
        paymentType: defaultPaymentType,
      });
      handleOrderResult(data.order?.payUrl ?? undefined);
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
      !Number.isFinite(orderAmount) ||
      orderAmount < CUSTOM_MIN_AMOUNT_CNY ||
      orderAmount > CUSTOM_MAX_AMOUNT_CNY;

    if (isInvalidAmount) {
      setMessage(`请输入 ¥${CUSTOM_MIN_AMOUNT_CNY} - ¥${CUSTOM_MAX_AMOUNT_CNY} 之间的金额`);
      setLoading(false);
      return;
    }

    try {
      const data = await ordersApi.createOrder({
        mode: "custom",
        amountCny: orderAmount,
        paymentType: defaultPaymentType,
      });
      handleOrderResult(data.order?.payUrl ?? undefined);
    } catch (error) {
      setLoading(false);
      setMessage(getErrorMessage(error));
    }
  }

  function handleOrderResult(payUrl?: string) {
    setLoading(false);
    if (payUrl) {
      window.location.assign(payUrl);
      return;
    }

    setMessage("订单已创建，但支付地址为空，请检查易支付配置。");
  }

  return (
    <div className={styles.orderForm}>
      <section className={styles.orderForm__section}>
        <div className={styles.orderForm__sectionHeader}>
          <h2 className={styles.orderForm__sectionTitle}>套餐购买</h2>
        </div>

        <div className={styles.orderForm__packages}>
          {displayPackages.map((item) => {
            const copy = item.copy;
            const isPopular = Boolean(copy.badge);

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
                <p className={styles.orderForm__price}>¥{item.priceCny}</p>
                <p className={styles.orderForm__credits}>{item.credits} 积分</p>
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
                  disabled={isLoading}
                  onClick={() => {
                    if (item.kind === "package") {
                      void createPackageOrder(item.code);
                      return;
                    }

                    void createCustomOrder(item.amountCny);
                  }}
                  className={clsx(
                    styles.orderForm__packageButton,
                    isPopular && styles.orderForm__packageButtonPopular,
                  )}
                >
                  {isLoading ? "创建中" : "立即购买"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.orderForm__section}>
        <div className={styles.orderForm__sectionHeader}>
          <h2 className={styles.orderForm__sectionTitle}>自定义购买</h2>
        </div>

        <div className={styles.orderForm__custom}>
          <div className={styles.orderForm__quickAmounts}>
            {quickAmounts.map((item) => {
              const isActive = Number(customAmount) === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCustomAmount(String(item))}
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
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                placeholder="输入购买金额"
              />
            </span>
          </label>
          <div className={styles.orderForm__hint}>
            <p>
              预计到账 <span className="font-medium text-foreground">{customCredits}</span> 积分
            </p>
            <p>自定义购买按 ¥1 = {CUSTOM_CREDITS_PER_CNY} 积分折算，套餐通常会更划算。</p>
          </div>

          <button className="btn-primary" onClick={() => createCustomOrder()} disabled={isLoading}>
            {isLoading ? "创建中" : `确认支付 ¥${amount.toFixed(2)}`}
          </button>
        </div>
      </section>

      {message ? <p className={styles.orderForm__message}>{message}</p> : null}
    </div>
  );
}

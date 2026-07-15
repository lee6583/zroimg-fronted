"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ordersApi } from "@/api/orders/purchase";
import { getErrorMessage } from "@/utils/error";
import styles from "./result.module.css";

type PaymentActionsProps = {
  orderNo: string;
  payUrl: string | null;
};

export function PaymentActions(props: PaymentActionsProps) {
  const orderNo = props.orderNo;
  const payUrl = props.payUrl;
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function confirmPayment() {
    if (!payUrl) {
      return;
    }

    window.location.assign(payUrl);
  }

  function cancelPayment() {
    setMessage("");

    startTransition(async () => {
      try {
        await ordersApi.cancelOrder(orderNo);
        router.replace("/billing");
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  if (!payUrl) {
    return (
      <div className={styles.result__payBox}>
        <p className={styles.result__warning}>
          订单已创建，但支付地址为空。请联系管理员检查易支付配置。
        </p>
        <button
          type="button"
          className={styles.result__cancelButton}
          disabled={isPending}
          onClick={cancelPayment}
        >
          {isPending ? "取消中" : "取消支付"}
        </button>
        {message ? <p className={styles.result__actionMessage}>{message}</p> : null}
      </div>
    );
  }

  return (
    <div className={styles.result__payBox}>
      <button type="button" className={styles.result__payButton} onClick={confirmPayment}>
        确认支付
      </button>
      <button
        type="button"
        className={styles.result__cancelButton}
        disabled={isPending}
        onClick={cancelPayment}
      >
        {isPending ? "取消中" : "取消支付"}
      </button>
      {message ? <p className={styles.result__actionMessage}>{message}</p> : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ordersApi } from "@/api/orders/purchase";
import { getErrorMessage } from "@/utils/error";
import styles from "./result.module.css";

type PaymentActionsProps = {
  orderNo: string;
  payUrl: string | null;
  canCancel?: boolean;
};

export function PaymentActions(props: PaymentActionsProps) {
  const orderNo = props.orderNo;
  const payUrl = props.payUrl;
  const canCancel = props.canCancel ?? true;
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPaying, setPaying] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function confirmPayment() {
    setMessage("");
    setPaying(true);

    try {
      if (payUrl) {
        window.location.assign(payUrl);
        return;
      }

      const data = await ordersApi.createPayment(orderNo);
      if (!data.payUrl) {
        setMessage("支付地址为空，请稍后重试");
        setPaying(false);
        return;
      }

      window.location.assign(data.payUrl);
    } catch (error) {
      setPaying(false);
      setMessage(getErrorMessage(error));
      return;
    }
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

  return (
    <div className={styles.result__payBox}>
      <button
        type="button"
        className={styles.result__payButton}
        disabled={isPaying}
        onClick={() => void confirmPayment()}
      >
        {isPaying ? "发起支付中" : "确认支付"}
      </button>
      {canCancel ? (
        <button
          type="button"
          className={styles.result__cancelButton}
          disabled={isPending}
          onClick={cancelPayment}
        >
          {isPending ? "取消中" : "取消支付"}
        </button>
      ) : null}
      {message ? <p className={styles.result__actionMessage}>{message}</p> : null}
    </div>
  );
}

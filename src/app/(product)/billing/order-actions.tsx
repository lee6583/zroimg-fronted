"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ordersApi } from "@/api/orders/purchase";
import { getErrorMessage } from "@/utils/error";
import styles from "./billing.module.css";

type OrderActionsProps = {
  orderNo: string;
};

export function OrderActions(props: OrderActionsProps) {
  const orderNo = props.orderNo;
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function cancelOrder() {
    setMessage("");

    startTransition(async () => {
      try {
        await ordersApi.cancelOrder(orderNo);
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  return (
    <div className={styles.billing__orderActions}>
      <Link className={styles.billing__payButton} href={`/billing/result?order=${orderNo}`}>
        支付
      </Link>
      <button
        type="button"
        className={styles.billing__cancelButton}
        disabled={isPending}
        onClick={cancelOrder}
      >
        {isPending ? "取消中" : "取消"}
      </button>
      {message ? <p className={styles.billing__actionMessage}>{message}</p> : null}
    </div>
  );
}

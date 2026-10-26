"use client";

import { useState, useTransition } from "react";
import { ordersApi } from "@/api/orders/purchase";
import { getErrorMessage } from "@/utils/error";
import styles from "./billing.module.css";
import { Link, useRouter } from "@/i18n/navigation";

type OrderActionsProps = {
  orderNo: string;
  canCancel: boolean;
};

export function OrderActions(props: OrderActionsProps) {
  const orderNo = props.orderNo;
  const canCancel = props.canCancel;
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function cancelOrder() {
    setMessage("");

    startTransition(async () => {
      try {
        await ordersApi.cancel(orderNo);
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
      {canCancel ? (
        <button
          type="button"
          className={styles.billing__cancelButton}
          disabled={isPending}
          onClick={cancelOrder}
        >
          {isPending ? "取消中" : "取消"}
        </button>
      ) : null}
      {message ? <p className={styles.billing__actionMessage}>{message}</p> : null}
    </div>
  );
}

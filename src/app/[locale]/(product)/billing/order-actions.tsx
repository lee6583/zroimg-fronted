"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { ordersApi } from "@/api/orders/purchase";
import { translateApiError } from "@/i18n/api-error";
import styles from "./billing.module.css";
import { Link, useRouter } from "@/i18n/navigation";

type OrderActionsProps = {
  orderNo: string;
  canCancel: boolean;
};

export function OrderActions(props: OrderActionsProps) {
  const orderNo = props.orderNo;
  const canCancel = props.canCancel;
  const t = useTranslations("billing.list.actions");
  const tError = useTranslations("errors.api");
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
        setMessage(translateApiError(error, tError));
      }
    });
  }

  return (
    <div className={styles.billing__orderActions}>
      <Link
        className={styles.billing__payButton}
        href={`/billing/result?order=${encodeURIComponent(orderNo)}`}
      >
        {t("pay")}
      </Link>
      {canCancel ? (
        <button
          type="button"
          className={styles.billing__cancelButton}
          disabled={isPending}
          onClick={cancelOrder}
        >
          {isPending ? t("cancelling") : t("cancel")}
        </button>
      ) : null}
      {message ? <p className={styles.billing__actionMessage}>{message}</p> : null}
    </div>
  );
}

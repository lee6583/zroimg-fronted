"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { ordersApi } from "@/api/orders/purchase";
import { translateApiError } from "@/i18n/api-error";
import styles from "./result.module.css";
import { useRouter } from "@/i18n/navigation";

type PaymentActionsProps = {
  orderNo: string;
  payUrl: string | null;
  canPay?: boolean;
  canCancel?: boolean;
};

export function PaymentActions(props: PaymentActionsProps) {
  const orderNo = props.orderNo;
  const payUrl = props.payUrl;
  const canPay = props.canPay ?? true;
  const canCancel = props.canCancel ?? true;
  const t = useTranslations("billing.result");
  const tError = useTranslations("errors.api");
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

      const data = await ordersApi.pay(orderNo);
      if (!data.payUrl) {
        setMessage(t("emptyPayUrl"));
        setPaying(false);
        return;
      }

      window.location.assign(data.payUrl);
    } catch (error) {
      setPaying(false);
      setMessage(translateApiError(error, tError));
      return;
    }
  }

  function cancelPayment() {
    setMessage("");

    startTransition(async () => {
      try {
        await ordersApi.cancel(orderNo);
        router.replace("/billing");
        router.refresh();
      } catch (error) {
        setMessage(translateApiError(error, tError));
      }
    });
  }

  return (
    <div className={styles.result__payBox}>
      {canPay ? (
        <button
          type="button"
          className={styles.result__payButton}
          disabled={isPaying}
          onClick={() => void confirmPayment()}
        >
          {isPaying ? t("actions.paying") : t("actions.pay")}
        </button>
      ) : null}
      {canCancel ? (
        <button
          type="button"
          className={styles.result__cancelButton}
          disabled={isPending}
          onClick={cancelPayment}
        >
          {isPending ? t("actions.cancelling") : t("actions.cancel")}
        </button>
      ) : null}
      {message ? <p className={styles.result__actionMessage}>{message}</p> : null}
    </div>
  );
}

"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adminOrdersApi } from "@/api/admin/orders";
import workspace from "@/features/admin/admin-workspace.module.css";
import { getErrorMessage } from "@/utils/error";

type ReissueButtonProps = {
  orderNo: string;
};

export function ReissueButton(props: ReissueButtonProps) {
  const orderNo = props.orderNo;
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function reissueCredits() {
    setMessage("");

    startTransition(async () => {
      try {
        await adminOrdersApi.reissueCredits(orderNo);
        router.refresh();
      } catch (error) {
        setMessage(getErrorMessage(error));
      }
    });
  }

  return (
    <div className="grid justify-items-end gap-1">
      <button
        type="button"
        className={workspace.secondaryAction}
        disabled={isPending}
        onClick={reissueCredits}
      >
        <RotateCcw size={14} aria-hidden="true" />
        {isPending ? "补发中" : "补发积分"}
      </button>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </div>
  );
}

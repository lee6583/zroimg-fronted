"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AppSelect } from "@/components/ui/app-select";
import workspace from "@/features/admin/admin-workspace.module.css";
import { feedbackTypeLabels } from "@/utils/feedback";

const typeOptions = [
  { value: "all", label: "全部类型" },
  ...Object.entries(feedbackTypeLabels).map(([value, label]) => ({ value, label })),
];

type TicketTypeFilterProps = {
  value?: string;
};

export function TicketTypeFilter(props: TicketTypeFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = props.value || "all";

  function updateType(nextType: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (nextType === "all") {
      params.delete("type");
    } else {
      params.set("type", nextType);
    }

    const query = params.toString();
    router.push(query ? `/admin/tickets?${query}` : "/admin/tickets");
  }

  return (
    <AppSelect
      className={workspace.typeSelect}
      triggerClassName={workspace.typeSelectTrigger}
      value={value}
      options={typeOptions}
      onChange={updateType}
    />
  );
}

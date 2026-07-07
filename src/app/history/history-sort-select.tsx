"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { AppSelect } from "@/components/ui/app-select";
import styles from "./history.module.css";

type SortValue = "newest" | "oldest";

const sortOptions: Array<{ value: SortValue; label: string }> = [
  { value: "newest", label: "最新" },
  { value: "oldest", label: "最早" },
];

export function HistorySortSelect({ value }: { value: SortValue }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function changeSort(nextValue: SortValue) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextValue === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", nextValue);
    }

    const query = params.toString();
    router.push(query ? `/history?${query}` : "/history");
  }

  return (
    <AppSelect
      value={value}
      onChange={changeSort}
      options={sortOptions}
      className={styles.history__sortSelect}
      triggerClassName={styles.history__sortTrigger}
    />
  );
}

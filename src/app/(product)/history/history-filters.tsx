"use client";

import { ConfigProvider, DatePicker } from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import zhCN from "antd/locale/zh_CN";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import { useRouter, useSearchParams } from "next/navigation";
import { AppSelect } from "@/components/ui/app-select";
import styles from "./history.module.css";

dayjs.locale("zh-cn");

const { RangePicker } = DatePicker;

type MediaFilter = "all" | "image" | "video";
type RangeValue = RangePickerProps["value"];

type HistoryFiltersProps = {
  from: string;
  media: MediaFilter;
  to: string;
};

const mediaOptions: Array<{ value: MediaFilter; label: string }> = [
  { value: "all", label: "全部类型" },
  { value: "image", label: "图片" },
  { value: "video", label: "视频" },
];

const pickerFormat = "YYYY-MM-DD HH:mm";
const queryFormat = "YYYY-MM-DDTHH:mm";

function getTimeValue(value: string) {
  if (!value) {
    return null;
  }

  const time = dayjs(value);
  if (!time.isValid()) {
    return null;
  }

  return time;
}

function getRangeValue(from: string, to: string): RangeValue {
  const start = getTimeValue(from);
  const end = getTimeValue(to);

  if (!start && !end) {
    return null;
  }

  return [start, end];
}

export function HistoryFilters(props: HistoryFiltersProps) {
  const from = props.from;
  const media = props.media;
  const to = props.to;
  const dateRange = getRangeValue(from, to);

  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const shouldClearMedia = key === "media" && value === "all";
    params.delete("page");

    if (value && !shouldClearMedia) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    const query = params.toString();
    if (query) {
      router.push(`/history?${query}`);
      return;
    }

    router.push("/history");
  }

  function updateDateRange(value: RangeValue) {
    const params = new URLSearchParams(searchParams.toString());
    const start = value?.[0] ?? null;
    const end = value?.[1] ?? null;

    if (start) {
      params.set("from", start.format(queryFormat));
    } else {
      params.delete("from");
    }

    if (end) {
      params.set("to", end.format(queryFormat));
    } else {
      params.delete("to");
    }

    const query = params.toString();
    if (query) {
      router.push(`/history?${query}`);
      return;
    }

    router.push("/history");
  }

  return (
    <div className={styles.history__filters}>
      <div className={styles.history__filterField}>
        <span className={styles.history__filterLabel}>时间范围</span>
        <ConfigProvider
          locale={zhCN}
          theme={{
            token: {
              colorPrimary: "var(--foreground)",
              colorPrimaryActive: "var(--foreground)",
              colorPrimaryHover: "var(--foreground)",
              controlItemBgActive: "var(--soft)",
              controlItemBgHover: "var(--soft)",
            },
          }}
        >
          <RangePicker
            className={styles.history__dateRangePicker}
            classNames={{ popup: { root: styles.history__dateRangePopup } }}
            value={dateRange}
            showTime={{ format: "HH:mm" }}
            format={pickerFormat}
            placeholder={["开始日期", "结束日期"]}
            onChange={updateDateRange}
          />
        </ConfigProvider>
      </div>

      <label className={styles.history__filterField}>
        <span className={styles.history__filterLabel}>创作类型</span>
        <AppSelect
          className={styles.history__typeSelect}
          triggerClassName={styles.history__typeTrigger}
          value={media}
          options={mediaOptions}
          onChange={(value) => updateFilter("media", value)}
        />
      </label>
    </div>
  );
}

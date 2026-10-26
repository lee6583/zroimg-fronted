"use client";

import { ConfigProvider, DatePicker } from "antd";
import type { RangePickerProps } from "antd/es/date-picker";
import type { Locale as AntdLocale } from "antd/es/locale";
import enUS from "antd/locale/en_US";
import ruRU from "antd/locale/ru_RU";
import zhCN from "antd/locale/zh_CN";
import clsx from "clsx";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import "dayjs/locale/zh-cn";
import { CalendarRange } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AppSelect } from "@/components/ui/app-select";
import { Sheet, useIsMobile } from "@/components/ui/sheet";
import { useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import styles from "./history.module.css";

const { RangePicker } = DatePicker;

type MediaFilter = "all" | "image" | "video";
type RangeValue = RangePickerProps["value"];

type HistoryFiltersProps = {
  from: string;
  media: MediaFilter;
  to: string;
};

const mediaFilters: MediaFilter[] = ["all", "image", "video"];

const antdLocales: Record<AppLocale, AntdLocale> = {
  "zh-CN": zhCN,
  en: enUS,
  ru: ruRU,
};

const dayjsLocales: Record<AppLocale, string> = {
  "zh-CN": "zh-cn",
  en: "en",
  ru: "ru",
};

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
  const locale = useLocale();
  dayjs.locale(dayjsLocales[locale]);
  const dateRange = getRangeValue(from, to);

  const t = useTranslations("history.filters");
  const format = useFormatter();
  const isMobile = useIsMobile();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSheetOpen, setSheetOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);

  const mediaOptions = mediaFilters.map((value) => ({ value, label: t(`media.${value}`) }));

  function push(params: URLSearchParams) {
    const query = params.toString();
    if (query) {
      router.push(`/history?${query}`);
      return;
    }

    router.push("/history");
  }

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    const shouldClearMedia = key === "media" && value === "all";
    params.delete("page");

    if (value && !shouldClearMedia) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    push(params);
  }

  function applyRange(start: string, end: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");

    if (start) {
      params.set("from", start);
    } else {
      params.delete("from");
    }

    if (end) {
      params.set("to", end);
    } else {
      params.delete("to");
    }

    push(params);
  }

  function updateDateRange(value: RangeValue) {
    const start = value?.[0] ?? null;
    const end = value?.[1] ?? null;
    applyRange(start ? start.format(queryFormat) : "", end ? end.format(queryFormat) : "");
  }

  function openSheet() {
    setDraftFrom(from);
    setDraftTo(to);
    setSheetOpen(true);
  }

  function formatDay(value: string) {
    const time = getTimeValue(value);
    if (!time) {
      return "";
    }

    return format.dateTime(time.toDate(), "short");
  }

  let rangeSummary = t("anyTime");
  if (from || to) {
    rangeSummary = t("rangeSummary", { from: formatDay(from) || "…", to: formatDay(to) || "…" });
  }
  const isDraftInvalid = Boolean(draftFrom && draftTo && draftFrom > draftTo);

  return (
    <div className={styles.history__filters}>
      {isMobile ? (
        <button
          type="button"
          className={clsx(
            styles.history__rangeButton,
            (from || to) && styles.history__rangeButtonActive,
          )}
          onClick={openSheet}
          aria-label={t("timeRange")}
          title={rangeSummary}
        >
          <CalendarRange size={16} />
          <span className={styles.history__rangeText}>{rangeSummary}</span>
        </button>
      ) : (
        <div className={styles.history__filterField} role="group" aria-label={t("timeRange")}>
          <ConfigProvider
            locale={antdLocales[locale]}
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
              placeholder={[t("startDate"), t("endDate")]}
              onChange={updateDateRange}
            />
          </ConfigProvider>
        </div>
      )}

      <div className={styles.history__filterField} role="group" aria-label={t("mediaLabel")}>
        <AppSelect
          className={styles.history__typeSelect}
          triggerClassName={styles.history__typeTrigger}
          value={media}
          options={mediaOptions}
          onChange={(value) => updateFilter("media", value)}
        />
      </div>

      <Sheet
        open={isSheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("timeRange")}
        footer={
          <div className={styles.history__sheetActions}>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSheetOpen(false);
                applyRange("", "");
              }}
            >
              {t("clear")}
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={isDraftInvalid}
              onClick={() => {
                setSheetOpen(false);
                applyRange(draftFrom, draftTo);
              }}
            >
              {t("apply")}
            </button>
          </div>
        }
      >
        <div className={styles.history__sheetFields}>
          <label className={styles.history__sheetField}>
            <span>{t("startDate")}</span>
            <input
              type="datetime-local"
              className={styles.history__sheetInput}
              value={draftFrom}
              max={draftTo || undefined}
              onChange={(event) => setDraftFrom(event.target.value)}
            />
          </label>
          <label className={styles.history__sheetField}>
            <span>{t("endDate")}</span>
            <input
              type="datetime-local"
              className={styles.history__sheetInput}
              value={draftTo}
              min={draftFrom || undefined}
              onChange={(event) => setDraftTo(event.target.value)}
            />
          </label>
          {isDraftInvalid ? (
            <p className={styles.history__sheetError}>{t("invalidRange")}</p>
          ) : null}
        </div>
      </Sheet>
    </div>
  );
}

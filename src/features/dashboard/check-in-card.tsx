"use client";

import clsx from "clsx";
import { getErrorMessage } from "@/utils/error";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkInApi } from "@/api/rewards/checkin";
import type { CheckInStatus } from "@/types/checkin";
import styles from "./check-in-card.module.css";

const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

function firstWeekdayOffset(year: number, month: number) {
  const day = new Date(year, month - 1, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function buildCalendar(status: CheckInStatus) {
  const year = Number(status.date.year);
  const month = Number(status.date.month);
  const daysInMonth = new Date(year, month, 0).getDate();
  const offset = firstWeekdayOffset(year, month);
  const checkedDays = new Set(status.checkedDayKeys);
  const cells: Array<{
    key: string;
    day: number | null;
    dayKey?: string;
    checked?: boolean;
    today?: boolean;
  }> = [];

  for (let index = 0; index < offset; index += 1) {
    cells.push({ key: `empty-${index}`, day: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dayKey = `${status.date.year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cells.push({
      key: dayKey,
      day,
      dayKey,
      checked: checkedDays.has(dayKey),
      today: status.date.dayKey === dayKey,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ key: `empty-tail-${cells.length}`, day: null });
  }

  return cells;
}

type CheckInCardProps = {
  initialStatus: CheckInStatus;
  onClaimed?: (credits: number) => void;
};

export function CheckInCard(props: CheckInCardProps) {
  const initialStatus = props.initialStatus;
  const onClaimed = props.onClaimed;

  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [reward, setReward] = useState(0);
  const calendarCells = buildCalendar(status);
  const canCheckIn = status.dailyCredits > 0;

  let buttonLabel = "立即签到";
  if (!canCheckIn) {
    buttonLabel = "暂未开放";
  } else if (status.checkedIn) {
    buttonLabel = "今日已签到";
  } else if (isLoading) {
    buttonLabel = "签到中";
  }

  async function claim() {
    setLoading(true);
    setMessage("");
    try {
      const data = await checkInApi.claim();
      const nextStatus = data.checkIn;

      setStatus(nextStatus);
      setMessage("");
      setReward(nextStatus.dailyCredits);
      setAnimationKey((current) => current + 1);
      onClaimed?.(nextStatus.dailyCredits);
      router.refresh();
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.checkInCard}>
      <div className={styles.checkInCard__header}>
        <div>
          <p className={styles.checkInCard__eyebrow}>Daily</p>
          <h2 className={styles.checkInCard__title}>每日签到</h2>
        </div>
      </div>

      <div className={styles.checkInCard__calendarHeader}>
        <p className={styles.checkInCard__monthTitle}>
          {status.date.year} 年 {status.date.month} 月
        </p>
      </div>

      <div className={styles.checkInCard__calendarWrap}>
        {reward > 0 ? (
          <span key={animationKey} className={styles.checkInCard__rewardBurst}>
            +{reward} 积分
          </span>
        ) : null}
        <div
          className={styles.checkInCard__calendar}
          aria-label={`${status.date.year} 年 ${status.date.month} 月签到日历`}
        >
          {weekDays.map((day) => (
            <span key={day} className={styles.checkInCard__weekday}>
              {day}
            </span>
          ))}
          {calendarCells.map((cell) => (
            <span
              key={cell.key}
              className={clsx(
                styles.checkInCard__dayCell,
                !cell.day && styles.checkInCard__dayCellEmpty,
                cell.checked && styles.checkInCard__dayCellChecked,
                cell.today && !cell.checked && styles.checkInCard__dayCellToday,
              )}
              aria-current={cell.today ? "date" : undefined}
              title={cell.dayKey}
            >
              {cell.day}
            </span>
          ))}
        </div>
      </div>

      <div className={styles.checkInCard__meta}>
        <span>连续 {status.streakDays} 天</span>
        <span>累计 {status.totalCheckIns} 天</span>
      </div>

      <div className={styles.checkInCard__actions}>
        <button
          className={styles.checkInCard__button}
          type="button"
          disabled={!canCheckIn || isLoading || status.checkedIn}
          onClick={claim}
        >
          {buttonLabel}
        </button>
        {message ? <p className={styles.checkInCard__message}>{message}</p> : null}
      </div>
    </section>
  );
}

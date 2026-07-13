"use client";

import clsx from "clsx";
import { getErrorMessage } from "@/utils/error";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { checkInApi } from "@/api/rewards/checkin";
import type { CheckInStatus } from "@/types/checkin";
import styles from "./check-in-card.module.css";

const weekDays = ["一", "二", "三", "四", "五", "六", "日"];

function getMonday(date: Date) {
  const day = date.getDay();
  const offset = day === 0 ? 6 : day - 1;
  const monday = new Date(date);

  monday.setDate(date.getDate() - offset);

  return monday;
}

function buildDayKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildWeek(status: CheckInStatus) {
  const year = Number(status.date.year);
  const month = Number(status.date.month);
  const day = Number(status.date.day);
  const today = new Date(year, month - 1, day);
  const monday = getMonday(today);
  const checkedDays = new Set(status.checkedDayKeys);
  const weekCells: Array<{
    key: string;
    weekday: string;
    day: string;
    checked?: boolean;
    today?: boolean;
  }> = [];

  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday);

    date.setDate(monday.getDate() + index);

    const dayKey = buildDayKey(date);
    const dayText = String(date.getDate()).padStart(2, "0");

    weekCells.push({
      key: dayKey,
      weekday: weekDays[index],
      day: dayText,
      checked: checkedDays.has(dayKey),
      today: status.date.dayKey === dayKey,
    });
  }

  return weekCells;
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
  const weekCells = buildWeek(status);
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
          <h2 className={styles.checkInCard__title}>每日签到</h2>
        </div>
        <p className={styles.checkInCard__streak}>连续 {status.streakDays} 天</p>
      </div>

      <div className={styles.checkInCard__calendarWrap}>
        {reward > 0 ? (
          <span key={animationKey} className={styles.checkInCard__rewardBurst}>
            +{reward} 积分
          </span>
        ) : null}
        <div
          className={styles.checkInCard__week}
          aria-label={`${status.date.year} 年 ${status.date.month} 月本周签到`}
        >
          {weekCells.map((cell) => (
            <div
              key={cell.key}
              className={clsx(
                styles.checkInCard__weekDay,
                cell.checked && styles.checkInCard__weekDayChecked,
                cell.today && !cell.checked && styles.checkInCard__weekDayToday,
              )}
              aria-current={cell.today ? "date" : undefined}
              title={cell.key}
            >
              <span className={styles.checkInCard__weekday}>{cell.weekday}</span>
              <span className={styles.checkInCard__dayText}>{cell.day}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.checkInCard__meta}>
        <span>累计 {status.totalCheckIns} 天</span>
        <span>每日 +{status.dailyCredits} 积分</span>
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

"use client";

import clsx from "clsx";
import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { checkInApi } from "@/api/rewards/checkin";
import type { SignCard } from "@/types/checkin";
import styles from "./check-in-card.module.css";
import { useRouter } from "@/i18n/navigation";

type CheckInCardProps = {
  signCard: SignCard;
  onClaimed?: (totalPoints: number) => void;
};

export function CheckInCard(props: CheckInCardProps) {
  const signCard = props.signCard;
  const onClaimed = props.onClaimed;

  const router = useRouter();
  const [card, setCard] = useState(signCard);
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [reward, setReward] = useState(0);
  const canCheckIn = card.dailySignPoints > 0;

  let buttonLabel = "立即签到";
  if (!canCheckIn) {
    buttonLabel = "暂未开放";
  } else if (card.todaySigned) {
    buttonLabel = "今日已签到";
  } else if (isLoading) {
    buttonLabel = "签到中";
  }

  async function claim() {
    setLoading(true);
    setMessage("");
    try {
      const result = await checkInApi.claim();

      setCard(result);
      setReward(result.addedPoints);
      setAnimationKey((current) => current + 1);
      onClaimed?.(result.totalPoints);
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
        <p className={styles.checkInCard__streak}>连续 {card.continuousSignDays} 天</p>
      </div>

      <div className={styles.checkInCard__calendarWrap}>
        {reward > 0 ? (
          <span key={animationKey} className={styles.checkInCard__rewardBurst}>
            +{reward} 积分
          </span>
        ) : null}
        <div className={styles.checkInCard__week} aria-label="本周签到">
          {card.weekDays.map((day) => (
            <div
              key={day.date}
              className={clsx(
                styles.checkInCard__weekDay,
                day.signed && styles.checkInCard__weekDayChecked,
                day.today && !day.signed && styles.checkInCard__weekDayToday,
              )}
              aria-current={day.today ? "date" : undefined}
              title={day.date}
            >
              <span className={styles.checkInCard__weekday}>{day.dayOfWeek}</span>
              <span className={styles.checkInCard__dayText}>
                {String(day.day).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.checkInCard__meta}>
        <span>本周 {card.weekSignDays} 天</span>
        <span>每日 +{card.dailySignPoints} 积分</span>
      </div>

      <div className={styles.checkInCard__actions}>
        <button
          className={styles.checkInCard__button}
          type="button"
          disabled={!canCheckIn || isLoading || card.todaySigned}
          onClick={claim}
        >
          {buttonLabel}
        </button>
        {message ? <p className={styles.checkInCard__message}>{message}</p> : null}
      </div>
    </section>
  );
}

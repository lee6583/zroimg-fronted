"use client";

import clsx from "clsx";
import { useFormatter, useTranslations } from "next-intl";
import { useState } from "react";
import { checkInApi } from "@/api/rewards/checkin";
import type { SignCard } from "@/types/checkin";
import styles from "./check-in-card.module.css";
import { translateApiError } from "@/i18n/api-error";
import { useRouter } from "@/i18n/navigation";
import { parseJavaDateTime } from "@/utils/java-time";

type CheckInCardProps = {
  signCard: SignCard;
  onClaimed?: (totalPoints: number) => void;
};

export function CheckInCard(props: CheckInCardProps) {
  const signCard = props.signCard;
  const onClaimed = props.onClaimed;

  const t = useTranslations("dashboard.checkIn");
  const tError = useTranslations("errors.api");
  const format = useFormatter();
  const router = useRouter();
  const [card, setCard] = useState(signCard);
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const [reward, setReward] = useState(0);
  const canCheckIn = card.dailySignPoints > 0;

  let buttonLabel = t("actions.claim");
  if (!canCheckIn) {
    buttonLabel = t("actions.unavailable");
  } else if (card.todaySigned) {
    buttonLabel = t("actions.claimed");
  } else if (isLoading) {
    buttonLabel = t("actions.claiming");
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
      setMessage(translateApiError(error, tError));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.checkInCard}>
      <div className={styles.checkInCard__header}>
        <div>
          <h2 className={styles.checkInCard__title}>{t("title")}</h2>
        </div>
        <p className={styles.checkInCard__streak}>
          {t("streak", { days: card.continuousSignDays })}
        </p>
      </div>

      <div className={styles.checkInCard__calendarWrap}>
        {reward > 0 ? (
          <span key={animationKey} className={styles.checkInCard__rewardBurst}>
            {t("reward", { points: reward })}
          </span>
        ) : null}
        <div className={styles.checkInCard__week} aria-label={t("weekLabel")}>
          {card.weekDays.map((day) => (
            <div
              key={day.date}
              className={clsx(
                styles.checkInCard__weekDay,
                day.signed && styles.checkInCard__weekDayChecked,
                day.today && !day.signed && styles.checkInCard__weekDayToday,
              )}
              aria-current={day.today ? "date" : undefined}
              title={format.dateTime(parseJavaDateTime(day.date), "short")}
            >
              <span className={styles.checkInCard__weekday}>
                {format.dateTime(parseJavaDateTime(day.date), "weekday")}
              </span>
              <span className={styles.checkInCard__dayText}>
                {String(day.day).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.checkInCard__meta}>
        <span>{t("weekDays", { days: card.weekSignDays })}</span>
        <span>{t("dailyPoints", { points: card.dailySignPoints })}</span>
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

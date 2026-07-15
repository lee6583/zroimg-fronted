import "server-only";

import { requestJavaApiData } from "@/server/java-api";
import type { CheckInDateInfo, CheckInStatus, JavaSignCard, JavaSignResult } from "@/types/checkin";

const signCardPath = "/points/user/sign-card";
const signPath = "/points/user/sign";
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function readDateInfo(dateText: string, weekday: string): CheckInDateInfo {
  if (!datePattern.test(dateText)) {
    throw new Error("签到日期格式错误");
  }

  const parts = dateText.split("-");
  const year = parts[0];
  const month = String(Number(parts[1]));
  const day = String(Number(parts[2]));

  return {
    dayKey: dateText,
    year,
    month,
    day,
    weekday,
  };
}

function findTodayWeekday(card: JavaSignCard) {
  const today = card.weekDays.find((item) => {
    return item.today;
  });

  if (!today) {
    return "";
  }

  return today.dayOfWeek;
}

function getCheckedDayKeys(card: JavaSignCard) {
  const signedDays = card.weekDays.filter((item) => {
    return item.signed;
  });

  const dayKeys = signedDays.map((item) => {
    return item.date;
  });

  return dayKeys;
}

export function toCheckInStatus(card: JavaSignCard): CheckInStatus {
  const weekday = findTodayWeekday(card);

  return {
    date: readDateInfo(card.today, weekday),
    dailyCredits: card.dailySignPoints,
    checkedIn: card.todaySigned,
    checkedAt: null,
    streakDays: card.continuousSignDays,
    weekSignDays: card.weekSignDays,
    totalCheckIns: card.weekSignDays,
    checkedDayKeys: getCheckedDayKeys(card),
  };
}

export async function getJavaCheckInStatus() {
  const card = await requestJavaApiData<JavaSignCard>(signCardPath);
  return toCheckInStatus(card);
}

export async function claimJavaCheckIn() {
  const result = await requestJavaApiData<JavaSignResult>(signPath, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(),
  });

  return {
    checkIn: toCheckInStatus(result),
    addedCredits: result.addedPoints,
    totalCredits: result.totalPoints,
  };
}

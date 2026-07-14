import { adjustProfileCredits, getStore, nextId } from "@/server/bff/mock-store";
import type { CheckInDateInfo, CheckInStatus } from "@/types/checkin";

const CHECKIN_TIME_ZONE = "Asia/Shanghai";

export function getCheckInDateInfo(date = new Date()): CheckInDateInfo {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: CHECKIN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) => {
    const part = parts.find((item) => {
      return item.type === type;
    });

    if (!part) {
      return "";
    }

    return part.value;
  };
  const year = value("year");
  const month = value("month");
  const day = value("day");

  return {
    dayKey: `${year}-${month}-${day}`,
    year,
    month: String(Number(month)),
    day: String(Number(day)),
    weekday: value("weekday"),
  };
}

function getPreviousDayKey(offsetDays: number) {
  const date = new Date(Date.now() - offsetDays * 24 * 60 * 60 * 1000);
  return getCheckInDateInfo(date).dayKey;
}

function getStreak(dayKeys: Set<string>, checkedToday: boolean) {
  let streak = 0;
  const startOffset = checkedToday ? 0 : 1;

  for (let offset = startOffset; offset < startOffset + 90; offset += 1) {
    if (!dayKeys.has(getPreviousDayKey(offset))) break;
    streak += 1;
  }

  return streak;
}

export async function getCheckInStatus(userProfileId: string): Promise<CheckInStatus> {
  const store = getStore();
  const today = getCheckInDateInfo();
  const monthPrefix = today.dayKey.slice(0, 7);

  // 第一步：找出当前用户所有签到记录。
  const records = store.checkInRecords.filter((record) => {
    return record.userProfileId === userProfileId;
  });

  // 第二步：找出今天是否已经签到。
  const todayRecord = records.find((record) => {
    return record.dayKey === today.dayKey;
  });

  // 第三步：找出当前月份内的签到记录。
  const monthRecords = records.filter((record) => {
    return record.dayKey.startsWith(monthPrefix);
  });

  // 第四步：把已签到日期放进 Set，方便计算连续签到天数。
  const dayKeys = records.map((record) => {
    return record.dayKey;
  });
  const checkedDayKeys = new Set(dayKeys);

  const monthDayKeys = monthRecords.map((record) => {
    return record.dayKey;
  });

  const result = {
    date: today,
    dailyCredits: store.settings.checkin.dailyCredits,
    checkedIn: Boolean(todayRecord),
    checkedAt: todayRecord?.createdAt.toISOString() ?? null,
    streakDays: getStreak(checkedDayKeys, Boolean(todayRecord)),
    weekSignDays: monthRecords.length,
    totalCheckIns: records.length,
    checkedDayKeys: monthDayKeys,
  };

  return result;
}

export async function claimDailyCheckIn(userProfileId: string) {
  const store = getStore();
  const today = getCheckInDateInfo();
  const existing = store.checkInRecords.find(
    (item) => item.userProfileId === userProfileId && item.dayKey === today.dayKey,
  );
  if (existing) {
    throw new Error("今日已签到");
  }

  store.checkInRecords.push({
    id: nextId("checkin"),
    userProfileId,
    dayKey: today.dayKey,
    credits: store.settings.checkin.dailyCredits,
    createdAt: new Date(),
  });

  adjustProfileCredits(
    userProfileId,
    store.settings.checkin.dailyCredits,
    `每日签到 ${today.dayKey}`,
    "checkin",
  );
  return getCheckInStatus(userProfileId);
}

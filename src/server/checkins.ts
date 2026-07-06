import { adjustProfileCredits, getStore, nextId } from "@/server/mock-store";

const CHECKIN_TIME_ZONE = "Asia/Shanghai";

export type CheckInDateInfo = {
  dayKey: string;
  year: string;
  month: string;
  day: string;
  weekday: string;
};

export type CheckInStatus = {
  date: CheckInDateInfo;
  dailyCredits: number;
  checkedIn: boolean;
  checkedAt: string | null;
  streakDays: number;
  totalCheckIns: number;
  checkedDayKeys: string[];
};

export function getCheckInDateInfo(date = new Date()): CheckInDateInfo {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    timeZone: CHECKIN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "long",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
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
  const records = store.checkInRecords.filter((item) => item.userProfileId === userProfileId);
  const todayRecord = records.find((item) => item.dayKey === today.dayKey);
  const monthRecords = records.filter((item) => item.dayKey.startsWith(monthPrefix));
  const checkedDayKeys = new Set(records.map((item) => item.dayKey));

  return {
    date: today,
    dailyCredits: store.settings.checkin.dailyCredits,
    checkedIn: Boolean(todayRecord),
    checkedAt: todayRecord?.createdAt.toISOString() ?? null,
    streakDays: getStreak(checkedDayKeys, Boolean(todayRecord)),
    totalCheckIns: records.length,
    checkedDayKeys: monthRecords.map((item) => item.dayKey),
  };
}

export async function claimDailyCheckIn(userProfileId: string) {
  const store = getStore();
  const today = getCheckInDateInfo();
  const existing = store.checkInRecords.find((item) => item.userProfileId === userProfileId && item.dayKey === today.dayKey);
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

  adjustProfileCredits(userProfileId, store.settings.checkin.dailyCredits, `每日签到 ${today.dayKey}`, "checkin");
  return getCheckInStatus(userProfileId);
}

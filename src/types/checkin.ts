type CheckInDateInfo = {
  dayKey: string;
  year: string;
  month: string;
  day: string;
  weekday: string;
};

type CheckInStatus = {
  date: CheckInDateInfo;
  dailyCredits: number;
  checkedIn: boolean;
  checkedAt: string | null;
  streakDays: number;
  totalCheckIns: number;
  checkedDayKeys: string[];
};

type ClaimCheckInResponse = {
  checkIn: CheckInStatus;
};

export type { CheckInDateInfo, CheckInStatus, ClaimCheckInResponse };

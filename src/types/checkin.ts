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

export type ClaimCheckInResponse = {
  checkIn: CheckInStatus;
};

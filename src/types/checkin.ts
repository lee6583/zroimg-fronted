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
  weekSignDays: number;
  totalCheckIns: number;
  checkedDayKeys: string[];
};

type ClaimCheckInResponse = {
  checkIn: CheckInStatus;
  addedCredits?: number;
  totalCredits?: number;
};

type SignWeekDay = {
  date: string;
  dayOfWeek: string;
  day: number;
  signed: boolean;
  today: boolean;
};

type JavaSignCard = {
  today: string;
  dailySignPoints: number;
  todaySigned: boolean;
  weekSignDays: number;
  continuousSignDays: number;
  weekDays: SignWeekDay[];
};

type JavaSignResult = JavaSignCard & {
  addedPoints: number;
  totalPoints: number;
};

export type {
  CheckInDateInfo,
  CheckInStatus,
  ClaimCheckInResponse,
  JavaSignCard,
  JavaSignResult,
  SignWeekDay,
};

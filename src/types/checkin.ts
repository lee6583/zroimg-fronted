type SignWeekDay = {
  date: string;
  dayOfWeek: string;
  day: number;
  signed: boolean;
  today: boolean;
};

type SignCard = {
  today: string;
  totalPoints: number;
  dailySignPoints: number;
  todaySigned: boolean;
  weekSignDays: number;
  continuousSignDays: number;
  weekDays: SignWeekDay[];
};

type SignResult = SignCard & {
  addedPoints: number;
};

type DashboardStats = {
  generatedCount: number;
  monthlyGeneratedCount: number;
  favoriteCount: number;
};

export type { SignWeekDay, SignCard, SignResult, DashboardStats };

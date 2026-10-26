import type { Formats } from "next-intl";

// Java LocalDateTime 不带时区，语义是北京时间；格式化时统一按这个时区展示。
export const timeZone = "Asia/Shanghai";

export const formats = {
  dateTime: {
    // 2026/10/25
    short: { year: "numeric", month: "2-digit", day: "2-digit" },
    // 10/25
    monthDay: { month: "2-digit", day: "2-digit" },
    // 2026/10/25 23:54
    datetime: {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    },
    // 23:54
    time: { hour: "2-digit", minute: "2-digit", hourCycle: "h23" },
  },
  number: {
    // 积分：整数，带千分位
    points: { maximumFractionDigits: 0 },
    // 订单金额：人民币
    currency: { style: "currency", currency: "CNY" },
    percent: { style: "percent", maximumFractionDigits: 0 },
  },
} satisfies Formats;

export const feedbackTypeLabels = {
  bug: "问题反馈",
  billing: "订单与积分",
  generation: "图片生成",
  account: "账户问题",
  suggestion: "功能建议",
  other: "其他",
} as const;

export const feedbackStatusLabels = {
  open: "待处理",
  in_progress: "处理中",
  resolved: "已解决",
  closed: "已关闭",
} as const;

export type FeedbackType = keyof typeof feedbackTypeLabels;
export type FeedbackStatus = keyof typeof feedbackStatusLabels;

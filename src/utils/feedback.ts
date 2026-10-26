// 后台 /admin 只有中文，继续直接使用下面两个中文 label 表。
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

// 用户端不要用上面的中文 label：遍历下面的值，文案取 tickets.type.<type> / tickets.status.<status>。
export const feedbackTypes = Object.keys(feedbackTypeLabels) as FeedbackType[];
export const feedbackStatuses = Object.keys(feedbackStatusLabels) as FeedbackStatus[];

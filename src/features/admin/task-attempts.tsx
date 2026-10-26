"use client";

import clsx from "clsx";
import { Popover } from "antd";
import { useState } from "react";
import { adminTasksApi } from "@/api/admin/tasks";
import type { AdminTaskAttempt } from "@/types/admin";
import { getErrorMessage } from "@/utils/error";
import styles from "./task-attempts.module.css";

type TaskAttemptsProps = {
  taskNo: string;
  label: string;
  isActive: boolean;
};

type AttemptListProps = {
  items: AdminTaskAttempt[] | null;
  error: string;
};

// 与 Java GenerationErrorCategory 的 code 对应，未知分类原样显示
const categoryLabels: Record<string, string> = {
  network: "网络错误",
  read_timeout: "读取超时",
  rate_limited: "限流",
  upstream_error: "上游 5xx",
  empty_result: "空结果",
  invalid_response: "响应异常",
  provider_failed: "上游失败",
  poll_timeout: "轮询超时",
  download_error: "下载失败",
  bad_request: "请求无效",
  not_found: "资源不存在",
  auth: "鉴权失败",
  quota: "额度不足",
  content_policy: "内容审核",
  url_rejected: "地址被拒",
  too_large: "文件过大",
  expired: "已过期",
  config: "配置错误",
  internal: "内部错误",
  stale: "任务中断",
};

function formatTime(value: string | null) {
  if (!value) return "-";
  return value.slice(5, 19).replace("T", " ");
}

function readCategory(value: string | null) {
  if (!value) return "-";
  return categoryLabels[value] ?? value;
}

export function TaskAttempts(props: TaskAttemptsProps) {
  const taskNo = props.taskNo;
  const label = props.label;
  const isActive = props.isActive;

  const [items, setItems] = useState<AdminTaskAttempt[] | null>(null);
  const [error, setError] = useState("");

  async function load(isOpen: boolean) {
    if (!isOpen || items) return;

    setError("");
    try {
      setItems(await adminTasksApi.fetchAttempts(taskNo));
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    }
  }

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      title="尝试记录"
      content={<AttemptList items={items} error={error} />}
      classNames={{ container: styles.attempts__popover }}
      onOpenChange={load}
    >
      <button
        type="button"
        className={clsx(styles.attempts__trigger, isActive && styles.attempts__triggerActive)}
        aria-label={`查看尝试记录 ${label}`}
      >
        {label}
      </button>
    </Popover>
  );
}

function AttemptList(props: AttemptListProps) {
  const items = props.items;
  const error = props.error;

  if (error) {
    return <p className={clsx(styles.attempts__state, styles.attempts__danger)}>{error}</p>;
  }
  if (!items) {
    return <p className={styles.attempts__state}>加载中</p>;
  }
  if (!items.length) {
    return <p className={styles.attempts__state}>暂无尝试记录</p>;
  }

  return (
    <ol className={styles.attempts__list}>
      {items.map((item) => {
        const message = item.errorMessage || "-";
        const isError = Boolean(item.errorCategory || item.errorMessage);
        let retryText = "不可重试";
        if (item.retryable) {
          retryText = "可重试";
        }
        if (!isError) {
          retryText = item.finishedTime ? "成功" : "进行中";
        }

        return (
          <li key={item.attemptNo} className={styles.attempts__item}>
            <span className={styles.attempts__no}>第 {item.attemptNo} 次</span>
            <span className={styles.attempts__muted}>{formatTime(item.startedTime)}</span>
            <span className={styles.attempts__muted}>{readCategory(item.errorCategory)}</span>
            <span className={styles.attempts__muted}>
              {item.httpStatus ? `HTTP ${item.httpStatus}` : "-"}
            </span>
            <span className={styles.attempts__message} title={message}>
              {message}
            </span>
            <span
              className={clsx(
                styles.attempts__tag,
                isError && item.retryable && styles.attempts__tagRetry,
                isError && !item.retryable && styles.attempts__tagFinal,
              )}
            >
              {retryText}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

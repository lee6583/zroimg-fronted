"use client";

import { getErrorMessage } from "@/utils/error";
import { useState } from "react";
import { ticketsApi } from "@/api/support/tickets";
import { AppSelect } from "@/components/ui/app-select";
import type { TicketItem, TicketListSummary, TicketStatusFilter } from "@/types/feedback";
import { type FeedbackType, feedbackTypeLabels } from "@/utils/feedback";
import styles from "./feedback-panel.module.css";

export type { TicketItem };

type ViewMode = "list" | "submit";

const typeOptions = Object.entries(feedbackTypeLabels).map(([value, label]) => ({
  value: value as FeedbackType,
  label,
}));

const statusFilterOptions: Array<{ value: TicketStatusFilter; label: string }> = [
  { value: "all", label: "全部状态" },
  { value: "open", label: "待处理" },
  { value: "in_progress", label: "处理中" },
  { value: "processed", label: "已处理" },
];

function formatDate(value: string) {
  return value.slice(0, 16).replace("T", " ");
}

function formatFileSize(size: number) {
  if (size < 1024 * 1024) {
    return `${Math.max(1, Math.round(size / 1024))} KB`;
  }

  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function readDefaultProcessText(ticket: TicketItem) {
  if (ticket.status === "open") {
    return "反馈已收到，等待管理员查看。";
  }

  if (ticket.status === "in_progress") {
    return "管理员正在处理这条反馈，请留意状态更新。";
  }

  if (ticket.status === "resolved") {
    return "这条反馈已处理完成。";
  }

  return "这条反馈已处理完成。";
}

function readLatestAdminMessage(ticket: TicketItem) {
  return ticket.messages.filter((item) => item.isAdmin).at(-1);
}

function readStatusLabel(status: TicketItem["status"]) {
  if (status === "open") return "待处理";
  if (status === "in_progress") return "处理中";
  return "已处理";
}

function readStatusBadgeClassName(status: TicketItem["status"]) {
  if (status === "open") return styles.feedbackPanel__statusBadgeOpen;
  if (status === "in_progress") return styles.feedbackPanel__statusBadgeProgress;
  return styles.feedbackPanel__statusBadgeDone;
}

type FeedbackPanelProps = {
  initialTickets: TicketItem[];
  initialTotal: number;
  initialPage: number;
  initialPageSize: number;
  initialSummary: TicketListSummary;
};

export function FeedbackPanel(props: FeedbackPanelProps) {
  const [view, setView] = useState<ViewMode>("list");
  const [tickets, setTickets] = useState(props.initialTickets);
  const [total, setTotal] = useState(props.initialTotal);
  const [page, setPage] = useState(props.initialPage);
  const [summary, setSummary] = useState(props.initialSummary);
  const [type, setType] = useState<FeedbackType>("generation");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>("all");
  const [activeId, setActiveId] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isFetching, setFetching] = useState(false);

  const pageSize = props.initialPageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeTicket = tickets.find((ticket) => ticket.id === activeId);
  const activeAdminMessage = activeTicket ? readLatestAdminMessage(activeTicket) : undefined;

  async function loadTickets(nextPage: number, nextStatus: TicketStatusFilter) {
    setFetching(true);
    setMessage("");
    try {
      const data = await ticketsApi.listTickets({
        page: nextPage,
        pageSize,
        status: nextStatus,
      });
      setTickets(data.tickets);
      setTotal(data.total);
      setPage(data.page);
      setSummary(data.summary);
      setActiveId((currentId) =>
        data.tickets.some((ticket) => ticket.id === currentId) ? currentId : "",
      );
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setFetching(false);
    }
  }

  function changeStatus(nextStatus: TicketStatusFilter) {
    setStatusFilter(nextStatus);
    void loadTickets(1, nextStatus);
  }

  function changePage(nextPage: number) {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page || isFetching) return;
    void loadTickets(nextPage, statusFilter);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;

    const nextFiles = Array.from(fileList);
    setFiles((currentFiles) => {
      const mergedFiles = [...currentFiles, ...nextFiles].slice(0, 4);
      if (currentFiles.length + nextFiles.length > 4) {
        setMessage("最多上传 4 张附件。");
      }

      return mergedFiles;
    });
  }

  function removeFile(index: number) {
    setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index));
  }

  async function uploadFiles() {
    const attachmentMediaIds: string[] = [];

    for (const file of files) {
      const data = new FormData();
      data.append("file", file);
      const result = await ticketsApi.uploadAttachment(data);
      attachmentMediaIds.push(result.media.id);
    }

    return attachmentMediaIds;
  }

  async function submitTicket() {
    setLoading(true);
    setMessage("");
    try {
      const attachmentMediaIds = await uploadFiles();
      const data = await ticketsApi.createTicket({
        type,
        subject,
        content,
        attachmentMediaIds,
      });
      if (!data.ticket) {
        setMessage("提交反馈失败");
        return;
      }

      setSubject("");
      setContent("");
      setFiles([]);
      setStatusFilter("all");
      setView("list");
      await loadTickets(1, "all");
      setActiveId(data.ticket.id);
      setMessage("反馈已提交，我们会尽快查看。");
    } catch (error) {
      setMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={styles.feedbackPanel}>
      {view === "list" ? (
        <div className={styles.feedbackPanel__view}>
          <div className={styles.feedbackPanel__stats}>
            <div className={styles.feedbackPanel__stat}>
              <span>全部意见</span>
              <strong>{summary.all}</strong>
            </div>
            <div className={styles.feedbackPanel__stat}>
              <span>待处理</span>
              <strong>{summary.open}</strong>
            </div>
            <div className={styles.feedbackPanel__stat}>
              <span>处理中</span>
              <strong>{summary.inProgress}</strong>
            </div>
            <div className={styles.feedbackPanel__stat}>
              <span>已处理</span>
              <strong>{summary.processed}</strong>
            </div>
          </div>

          <div className={styles.feedbackPanel__toolbar}>
            <AppSelect value={statusFilter} onChange={changeStatus} options={statusFilterOptions} />
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setView("submit");
                setActiveId("");
              }}
            >
              + 提交意见
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className={styles.feedbackPanel__empty}>还没有匹配的反馈记录。</div>
          ) : (
            <div className={styles.feedbackPanel__tableWrap} aria-busy={isFetching}>
              <table className={styles.feedbackPanel__table}>
                <thead>
                  <tr>
                    <th>意见类型</th>
                    <th>意见</th>
                    <th>创建时间</th>
                    <th>更新时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((ticket) => (
                    <tr key={ticket.id}>
                      <td>{feedbackTypeLabels[ticket.type]}</td>
                      <td>
                        <div className={styles.feedbackPanel__feedbackCell}>
                          <strong>{ticket.subject}</strong>
                          <span>{ticket.content}</span>
                        </div>
                      </td>
                      <td>{formatDate(ticket.createdAt)}</td>
                      <td>{formatDate(ticket.updatedAt)}</td>
                      <td>
                        <span
                          className={`${styles.feedbackPanel__statusBadge} ${readStatusBadgeClassName(ticket.status)}`}
                        >
                          {readStatusLabel(ticket.status)}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setActiveId(ticket.id)}
                        >
                          查看
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className={styles.feedbackPanel__footer}>
            <span>
              共 {total} 条，第 {page} / {totalPages} 页
            </span>
            <div className={styles.feedbackPanel__pagination}>
              <button
                type="button"
                className="btn-secondary"
                disabled={page <= 1 || isFetching}
                onClick={() => changePage(page - 1)}
              >
                上一页
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={page >= totalPages || isFetching}
                onClick={() => changePage(page + 1)}
              >
                下一页
              </button>
            </div>
          </div>

          {message ? <p className="text-sm text-muted">{message}</p> : null}

          {activeTicket ? (
            <div
              className={styles.feedbackPanel__modalOverlay}
              role="presentation"
              onClick={() => setActiveId("")}
            >
              <article
                className={styles.feedbackPanel__modal}
                role="dialog"
                aria-modal="true"
                aria-labelledby="feedback-process-title"
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.feedbackPanel__processHead}>
                  <div>
                    <p className="label">Process</p>
                    <h3 id="feedback-process-title">处理情况</h3>
                  </div>
                  <button type="button" className="btn-secondary" onClick={() => setActiveId("")}>
                    关闭
                  </button>
                </div>
                <div className={styles.feedbackPanel__processBody}>
                  <div>
                    <p className={styles.feedbackPanel__ticketMeta}>
                      {feedbackTypeLabels[activeTicket.type]} / 更新于{" "}
                      {formatDate(activeTicket.updatedAt)}
                    </p>
                    <h4>{activeTicket.subject}</h4>
                  </div>
                  <div className={styles.feedbackPanel__processStatus}>
                    <span>当前状态</span>
                    <strong
                      className={`${styles.feedbackPanel__statusBadge} ${readStatusBadgeClassName(activeTicket.status)}`}
                    >
                      {readStatusLabel(activeTicket.status)}
                    </strong>
                    <p>{readDefaultProcessText(activeTicket)}</p>
                  </div>
                  <div className={styles.feedbackPanel__adminReply}>
                    <span>管理员回复</span>
                    {activeAdminMessage ? (
                      <>
                        <p>{activeAdminMessage.body}</p>
                        <time>{formatDate(activeAdminMessage.createdAt)}</time>
                      </>
                    ) : (
                      <p>暂无管理员回复，请留意后续处理结果。</p>
                    )}
                  </div>
                </div>
              </article>
            </div>
          ) : null}
        </div>
      ) : (
        <div className={styles.feedbackPanel__submitCard}>
          <div className={styles.feedbackPanel__submitHead}>
            <h3>提交意见</h3>
            <button type="button" className="btn-secondary" onClick={() => setView("list")}>
              返回列表
            </button>
          </div>
          <div className={styles.feedbackPanel__form}>
            <label>
              <span>类型</span>
              <AppSelect value={type} onChange={setType} options={typeOptions} />
            </label>
            <label>
              <span>标题</span>
              <input
                className="field text-sm"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="例如：图片生成任务一直显示排队中"
              />
            </label>
            <label>
              <span>内容</span>
              <textarea
                className="field min-h-40 resize-y text-sm leading-6"
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="请描述问题现象、出现时间、任务编号、订单号或必要截图信息。"
              />
            </label>
            <div className={styles.feedbackPanel__uploadField}>
              <span>附件</span>
              <label className={styles.feedbackPanel__uploadBox}>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={(event) => {
                    addFiles(event.target.files);
                    event.target.value = "";
                  }}
                />
                <strong>上传截图</strong>
                <small>支持 PNG、JPEG、WebP，最多 4 张，单张不超过 10 MB</small>
              </label>
              {files.length ? (
                <div className={styles.feedbackPanel__selectedFiles}>
                  {files.map((file, index) => (
                    <div key={`${file.name}-${file.lastModified}-${index}`}>
                      <span>
                        {file.name} / {formatFileSize(file.size)}
                      </span>
                      <button type="button" onClick={() => removeFile(index)}>
                        移除
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <div className={styles.feedbackPanel__formActions}>
              <button
                type="button"
                className="btn-primary"
                disabled={isLoading || !subject.trim() || !content.trim()}
                onClick={submitTicket}
              >
                {isLoading ? "提交中" : "提交意见"}
              </button>
              <button type="button" className="btn-secondary" onClick={() => setView("list")}>
                取消
              </button>
            </div>
            {message ? <p className="text-sm text-muted">{message}</p> : null}
          </div>
        </div>
      )}
    </section>
  );
}

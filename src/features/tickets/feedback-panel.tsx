"use client";

import clsx from "clsx";
import { ArrowLeft, Eye, ImagePlus, Plus, Send, Trash2, X } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useState, type ReactNode } from "react";
import { ticketsApi } from "@/api/support/tickets";
import { AppPagination } from "@/components/ui/app-pagination";
import { AppSelect } from "@/components/ui/app-select";
import table from "@/components/ui/data-table.module.css";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { Sheet, useIsMobile } from "@/components/ui/sheet";
import { translateApiError } from "@/i18n/api-error";
import type {
  TicketItem,
  TicketListSummary,
  TicketMessage,
  TicketStatusFilter,
} from "@/types/feedback";
import { type FeedbackType, feedbackTypes } from "@/utils/feedback";
import { parseJavaDateTime } from "@/utils/java-time";
import { isSupportedImageType, maxImageBytes, maxImageFiles } from "@/utils/media";
import styles from "./feedback-panel.module.css";

export type { TicketItem };

type ViewMode = "list" | "submit";

const statusFilters: TicketStatusFilter[] = ["all", "open", "in_progress", "processed"];
const maxImageMb = Math.round(maxImageBytes / 1024 / 1024);

function readLatestAdminMessage(ticket: TicketItem) {
  return ticket.messages.filter((item) => item.isAdmin).at(-1);
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
  const t = useTranslations("tickets");
  const tError = useTranslations("errors.api");
  const tUpload = useTranslations("errors.upload");
  const format = useFormatter();
  const isMobile = useIsMobile();
  const [view, setView] = useState<ViewMode>("list");
  const [tickets, setTickets] = useState(props.initialTickets);
  const [total, setTotal] = useState(props.initialTotal);
  const [page, setPage] = useState(props.initialPage);
  const [pageSize, setPageSize] = useState(props.initialPageSize);
  const [summary, setSummary] = useState(props.initialSummary);
  const [type, setType] = useState<FeedbackType>("generation");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>("all");
  const [activeId, setActiveId] = useState("");
  const [message, setMessage] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [isFetching, setFetching] = useState(false);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const activeTicket = tickets.find((ticket) => ticket.id === activeId);
  const isSubmitSheet = isMobile && view === "submit";

  const typeOptions = feedbackTypes.map((value) => ({ value, label: t(`type.${value}`) }));
  const statusFilterOptions = statusFilters.map((value) => ({
    value,
    label: t(`filter.${value}`),
  }));

  function formatTime(value: string) {
    return format.dateTime(parseJavaDateTime(value), "datetime");
  }

  function formatFileSize(size: number) {
    if (size < 1024 * 1024) {
      return t("form.fileSizeKb", { size: Math.max(1, Math.round(size / 1024)) });
    }

    return t("form.fileSizeMb", {
      size: format.number(size / 1024 / 1024, { maximumFractionDigits: 1 }),
    });
  }

  async function loadTickets(
    nextPage: number,
    nextStatus: TicketStatusFilter,
    nextPageSize = pageSize,
  ) {
    setFetching(true);
    setMessage("");
    try {
      const data = await ticketsApi.listTickets({
        page: nextPage,
        pageSize: nextPageSize,
        status: nextStatus,
      });
      setTickets(data.list);
      setTotal(Number(data.total));
      setPage(nextPage);
      setPageSize(nextPageSize);
      setSummary(data.summary);
      setActiveId((currentId) =>
        data.list.some((ticket) => ticket.id === currentId) ? currentId : "",
      );
    } catch (error) {
      setMessage(translateApiError(error, tError));
    } finally {
      setFetching(false);
    }
  }

  function changeStatus(nextStatus: TicketStatusFilter) {
    setStatusFilter(nextStatus);
    void loadTickets(1, nextStatus);
  }

  function changePage(nextPage: number, nextPageSize = pageSize) {
    if (
      nextPage < 1 ||
      nextPage > totalPages ||
      (nextPage === page && nextPageSize === pageSize) ||
      isFetching
    ) {
      return;
    }
    void loadTickets(nextPage, statusFilter, nextPageSize);
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList) return;

    const nextFiles = Array.from(fileList);
    const validFiles = nextFiles.filter(
      (file) => isSupportedImageType(file.type) && file.size > 0 && file.size <= maxImageBytes,
    );
    if (validFiles.length < nextFiles.length) {
      setFormMessage(
        nextFiles.some((file) => !isSupportedImageType(file.type))
          ? tUpload("unsupportedImageType")
          : tUpload("imageTooLarge", { maxMb: maxImageMb }),
      );
    } else {
      setFormMessage("");
    }

    if (files.length + validFiles.length > maxImageFiles) {
      setFormMessage(t("form.tooManyFiles", { max: maxImageFiles }));
    }
    setFiles([...files, ...validFiles].slice(0, maxImageFiles));
  }

  function removeFile(index: number) {
    setFiles((currentFiles) => currentFiles.filter((_, fileIndex) => fileIndex !== index));
  }

  function openSubmit() {
    setView("submit");
    setActiveId("");
    setFormMessage("");
  }

  function closeSubmit() {
    if (isLoading) return;
    setView("list");
    setFormMessage("");
  }

  async function uploadFiles() {
    const attachmentMediaIds: string[] = [];

    for (const file of files) {
      const data = new FormData();
      data.append("file", file);
      const result = await ticketsApi.uploadAttachment(data);
      attachmentMediaIds.push(result.id);
    }

    return attachmentMediaIds;
  }

  async function submitTicket() {
    setLoading(true);
    setFormMessage("");
    try {
      const attachmentMediaIds = await uploadFiles();
      const ticket = await ticketsApi.createTicket({
        type,
        subject,
        content,
        attachmentMediaIds,
      });

      setSubject("");
      setContent("");
      setFiles([]);
      setStatusFilter("all");
      setView("list");
      await loadTickets(1, "all");
      setActiveId(ticket.id);
      setMessage(t("form.submitted"));
    } catch (error) {
      setFormMessage(translateApiError(error, tError));
    } finally {
      setLoading(false);
    }
  }

  function appendMessage(ticketId: string, item: TicketMessage) {
    setTickets((currentTickets) =>
      currentTickets.map((ticket) =>
        ticket.id === ticketId
          ? { ...ticket, messages: [...ticket.messages, item], updateTime: item.createdAt }
          : ticket,
      ),
    );
  }

  const isSubmitDisabled = isLoading || !subject.trim() || !content.trim();

  const submitButton = (
    <button
      type="button"
      className={clsx("btn-primary", styles.feedbackPanel__actionButton)}
      disabled={isSubmitDisabled}
      onClick={submitTicket}
    >
      <Send size={15} aria-hidden="true" />
      {isLoading ? t("form.submitting") : t("form.submit")}
    </button>
  );

  const cancelButton = (
    <button
      type="button"
      className={clsx("btn-secondary", styles.feedbackPanel__actionButton)}
      onClick={closeSubmit}
      disabled={isLoading}
    >
      <X size={15} aria-hidden="true" />
      {t("form.cancel")}
    </button>
  );

  const submitForm = (
    <div className={styles.feedbackPanel__form}>
      <div className={styles.feedbackPanel__formRow}>
        <label>
          <span>{t("form.type")}</span>
          <AppSelect value={type} onChange={setType} options={typeOptions} />
        </label>
        <label>
          <span>{t("form.subject")}</span>
          <input
            className={clsx("field text-sm", styles.feedbackPanel__input)}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder={t("form.subjectPlaceholder")}
          />
        </label>
      </div>
      <label>
        <span>{t("form.content")}</span>
        <textarea
          className={`field ${styles.feedbackPanel__textarea}`}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t("form.contentPlaceholder")}
        />
      </label>
      <div className={styles.feedbackPanel__uploadField}>
        <span>{t("form.attachments")}</span>
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
          <ImagePlus size={20} aria-hidden="true" />
          <span className={styles.feedbackPanel__uploadCopy}>
            <strong>{t("form.chooseFiles")}</strong>
            <small>{t("form.attachmentsHint", { max: maxImageFiles, maxMb: maxImageMb })}</small>
          </span>
        </label>
        {files.length ? (
          <div className={styles.feedbackPanel__selectedFiles}>
            {files.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}-${index}`}>
                <span title={file.name}>
                  {file.name} / {formatFileSize(file.size)}
                </span>
                <button
                  type="button"
                  title={t("form.remove")}
                  aria-label={t("form.removeFile", { name: file.name })}
                  onClick={() => removeFile(index)}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
      {isSubmitSheet ? null : (
        <div className={styles.feedbackPanel__formActions}>
          {submitButton}
          {cancelButton}
        </div>
      )}
      {formMessage ? (
        <p className="text-sm text-muted" aria-live="polite">
          {formMessage}
        </p>
      ) : null}
    </div>
  );

  return (
    <section className={styles.feedbackPanel}>
      {view === "list" || isMobile ? (
        <div className={styles.feedbackPanel__view}>
          <div className={styles.feedbackPanel__stats}>
            <div className={styles.feedbackPanel__stat}>
              <span>{t("stats.all")}</span>
              <strong>{summary.all}</strong>
            </div>
            <div className={styles.feedbackPanel__stat}>
              <span>{t("stats.open")}</span>
              <strong>{summary.open}</strong>
            </div>
            <div className={styles.feedbackPanel__stat}>
              <span>{t("stats.inProgress")}</span>
              <strong>{summary.inProgress}</strong>
            </div>
            <div className={styles.feedbackPanel__stat}>
              <span>{t("stats.processed")}</span>
              <strong>{summary.processed}</strong>
            </div>
          </div>

          <div className={styles.feedbackPanel__toolbar}>
            <AppSelect value={statusFilter} onChange={changeStatus} options={statusFilterOptions} />
            <button
              type="button"
              className={clsx("btn-primary", styles.feedbackPanel__actionButton)}
              onClick={openSubmit}
            >
              <Plus size={16} aria-hidden="true" />
              {t("create")}
            </button>
          </div>

          {tickets.length === 0 ? (
            <div className={styles.feedbackPanel__empty}>{t("empty")}</div>
          ) : (
            <>
              <div
                className={clsx(table.dataTable__card, styles.feedbackPanel__tableWrap)}
                aria-busy={isFetching}
              >
                <table className={clsx(table.dataTable, styles.feedbackPanel__table)}>
                  <colgroup>
                    <col className={styles.feedbackPanel__colType} />
                    <col />
                    <col className={styles.feedbackPanel__colTime} />
                    <col className={styles.feedbackPanel__colTime} />
                    <col className={styles.feedbackPanel__colStatus} />
                    <col className={styles.feedbackPanel__colActions} />
                  </colgroup>
                  <thead>
                    <tr>
                      <th>{t("table.type")}</th>
                      <th className={table.dataTable__start}>{t("table.subject")}</th>
                      <th>{t("table.createdAt")}</th>
                      <th>{t("table.updatedAt")}</th>
                      <th>{t("table.status")}</th>
                      <th>{t("table.actions")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket.id}>
                        <td>{t(`type.${ticket.type}`)}</td>
                        <td className={table.dataTable__start}>
                          <strong
                            className={clsx(
                              table.dataTable__ellipsis,
                              styles.feedbackPanel__subject,
                            )}
                            title={ticket.subject}
                          >
                            {ticket.subject}
                          </strong>
                          <span
                            className={clsx(
                              table.dataTable__ellipsis,
                              styles.feedbackPanel__content,
                            )}
                            title={ticket.content}
                          >
                            {ticket.content}
                          </span>
                        </td>
                        <td className={table.dataTable__time}>{formatTime(ticket.createTime)}</td>
                        <td className={table.dataTable__time}>{formatTime(ticket.updateTime)}</td>
                        <td>
                          <span
                            className={clsx(
                              styles.feedbackPanel__statusBadge,
                              readStatusBadgeClassName(ticket.status),
                            )}
                          >
                            {t(`status.${ticket.status}`)}
                          </span>
                        </td>
                        <td>
                          <div className={table.dataTable__actions}>
                            <button
                              type="button"
                              className={clsx("btn-secondary", styles.feedbackPanel__viewButton)}
                              onClick={() => setActiveId(ticket.id)}
                            >
                              <Eye size={14} aria-hidden="true" />
                              {t("view")}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ul className={styles.feedbackPanel__cards} aria-busy={isFetching}>
                {tickets.map((ticket) => (
                  <li key={ticket.id}>
                    <button
                      type="button"
                      className={styles.feedbackPanel__card}
                      onClick={() => setActiveId(ticket.id)}
                    >
                      <span className={styles.feedbackPanel__cardHead}>
                        <span className={styles.feedbackPanel__cardType}>
                          {t(`type.${ticket.type}`)}
                        </span>
                        <span
                          className={clsx(
                            styles.feedbackPanel__statusBadge,
                            readStatusBadgeClassName(ticket.status),
                          )}
                        >
                          {t(`status.${ticket.status}`)}
                        </span>
                      </span>
                      <strong className={styles.feedbackPanel__cardSubject}>
                        {ticket.subject}
                      </strong>
                      <span className={styles.feedbackPanel__cardContent}>{ticket.content}</span>
                      <time className={styles.feedbackPanel__cardTime}>
                        {t("card.updatedAt", { time: formatTime(ticket.updateTime) })}
                      </time>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}

          <AppPagination current={page} pageSize={pageSize} total={total} onChange={changePage} />

          {message ? <p className="text-sm text-muted">{message}</p> : null}
        </div>
      ) : (
        <div className={styles.feedbackPanel__submitCard}>
          <div className={styles.feedbackPanel__submitHead}>
            <h3>{t("form.title")}</h3>
            <button
              type="button"
              className={styles.feedbackPanel__backButton}
              onClick={closeSubmit}
            >
              <ArrowLeft size={15} aria-hidden="true" />
              {t("form.backToList")}
            </button>
          </div>
          {submitForm}
        </div>
      )}

      <Sheet
        open={isSubmitSheet}
        onClose={closeSubmit}
        isLocked={isLoading}
        title={t("form.title")}
        className={styles.feedbackPanel__sheetFull}
        footer={
          <div className={styles.feedbackPanel__sheetActions}>
            {cancelButton}
            {submitButton}
          </div>
        }
      >
        {isSubmitSheet ? submitForm : null}
      </Sheet>

      <TicketDetail
        ticket={activeTicket}
        onClose={() => setActiveId("")}
        onReplied={appendMessage}
        formatTime={formatTime}
      />
    </section>
  );
}

type TicketDetailProps = {
  ticket: TicketItem | undefined;
  onClose: () => void;
  onReplied: (ticketId: string, message: TicketMessage) => void;
  formatTime: (value: string) => string;
};

function TicketDetail(props: TicketDetailProps) {
  const ticket = props.ticket;
  const t = useTranslations("tickets");
  const tError = useTranslations("errors.api");
  const [reply, setReply] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [isReplying, setReplying] = useState(false);

  function close() {
    if (isReplying) return;
    setReply("");
    setReplyMessage("");
    props.onClose();
  }

  async function sendReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ticket || !reply.trim() || isReplying) return;

    setReplying(true);
    setReplyMessage("");
    try {
      const item = await ticketsApi.replyTicket(ticket.id, { body: reply.trim() });
      props.onReplied(ticket.id, item);
      setReply("");
    } catch (error) {
      setReplyMessage(translateApiError(error, tError));
    } finally {
      setReplying(false);
    }
  }

  let content: ReactNode = null;
  let footer: ReactNode = null;
  if (ticket) {
    const latestAdminMessage = readLatestAdminMessage(ticket);
    const isClosed = ticket.status === "closed";

    content = (
      <div className={styles.feedbackPanel__processBody}>
        <header className={styles.feedbackPanel__ticketSummary}>
          <p className={styles.feedbackPanel__ticketMeta}>
            {t("detail.meta", {
              type: t(`type.${ticket.type}`),
              time: props.formatTime(ticket.updateTime),
            })}
          </p>
          <h4>{ticket.subject}</h4>
        </header>
        <div className={styles.feedbackPanel__processStatus}>
          <div className={styles.feedbackPanel__processStatusRow}>
            <span>{t("detail.currentStatus")}</span>
            <strong
              className={clsx(
                styles.feedbackPanel__statusBadge,
                readStatusBadgeClassName(ticket.status),
              )}
            >
              {t(`status.${ticket.status}`)}
            </strong>
          </div>
          <p>{t(`detail.process.${ticket.status}`)}</p>
        </div>

        <section className={styles.feedbackPanel__thread} aria-label={t("detail.thread")}>
          <span className={styles.feedbackPanel__threadTitle}>{t("detail.thread")}</span>
          <article className={clsx(styles.feedbackPanel__bubble, styles.feedbackPanel__bubbleUser)}>
            <div className={styles.feedbackPanel__replyMeta}>
              <span>{t("detail.you")}</span>
              <time>{props.formatTime(ticket.createTime)}</time>
            </div>
            <p>{ticket.content}</p>
            {ticket.attachments.length ? (
              <div
                className={styles.feedbackPanel__attachments}
                aria-label={t("detail.attachments")}
              >
                {ticket.attachments.map((attachment, index) => (
                  <ImageLightbox
                    key={attachment.id}
                    src={attachment.url}
                    alt={t("detail.attachmentAlt", {
                      name:
                        attachment.fileName || t("detail.attachmentFallback", { index: index + 1 }),
                    })}
                    width={160}
                    height={160}
                    triggerClassName={styles.feedbackPanel__attachment}
                    imageClassName={styles.feedbackPanel__attachmentImage}
                  />
                ))}
              </div>
            ) : null}
          </article>

          {ticket.messages.map((item) => (
            <article
              key={item.id}
              className={clsx(
                styles.feedbackPanel__bubble,
                item.isAdmin ? styles.feedbackPanel__bubbleAdmin : styles.feedbackPanel__bubbleUser,
              )}
            >
              <div className={styles.feedbackPanel__replyMeta}>
                <span>{item.isAdmin ? t("detail.admin") : t("detail.you")}</span>
                <time>{props.formatTime(item.createdAt)}</time>
              </div>
              <p>{item.body}</p>
            </article>
          ))}

          {latestAdminMessage ? null : (
            <p className={styles.feedbackPanel__threadEmpty}>{t("detail.noAdminReply")}</p>
          )}
        </section>
      </div>
    );

    footer = isClosed ? (
      <p className={styles.feedbackPanel__replyClosed}>{t("detail.replyClosed")}</p>
    ) : (
      <form className={styles.feedbackPanel__replyForm} onSubmit={sendReply}>
        <textarea
          className={clsx("field", styles.feedbackPanel__replyInput)}
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder={t("detail.replyPlaceholder")}
          aria-label={t("detail.replyLabel")}
          maxLength={5000}
          rows={1}
        />
        <button
          type="submit"
          className={clsx("btn-primary", styles.feedbackPanel__replyButton)}
          disabled={isReplying || !reply.trim()}
        >
          <Send size={15} aria-hidden="true" />
          {isReplying ? t("detail.replying") : t("detail.reply")}
        </button>
        {replyMessage ? (
          <p className={styles.feedbackPanel__replyError} aria-live="polite">
            {replyMessage}
          </p>
        ) : null}
      </form>
    );
  }

  return (
    <Sheet
      open={Boolean(ticket)}
      onClose={close}
      isLocked={isReplying}
      title={t("detail.title")}
      className={styles.feedbackPanel__sheetFull}
      footer={footer}
    >
      {content}
    </Sheet>
  );
}

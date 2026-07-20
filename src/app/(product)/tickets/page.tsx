import { FeedbackPanel } from "@/features/tickets/feedback-panel";
import { requireUser } from "@/server/auth";
import { listTicketsForUserPage } from "@/server/bff/account";
import type { TicketItem } from "@/types/feedback";

export const dynamic = "force-dynamic";
const pageSize = 5;

export default async function TicketsPage() {
  const current = await requireUser();
  const result = await listTicketsForUserPage({
    profileId: current.profile.id,
    page: 1,
    pageSize,
    status: "all",
  });
  const ticketItems: TicketItem[] = result.tickets.map((ticket) => ({
    id: ticket.id,
    type: ticket.type,
    status: ticket.status,
    subject: ticket.subject,
    content: ticket.content,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    attachments: ticket.attachments,
    messages: ticket.messages.map((message) => ({
      id: message.id,
      body: message.body,
      isAdmin: message.isAdmin,
      createdAt: message.createdAt.toISOString(),
      authorName: message.authorProfile.username,
    })),
  }));

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">意见反馈</h1>
      </section>

      <FeedbackPanel
        initialTickets={ticketItems}
        initialTotal={result.total}
        initialPage={result.page}
        initialPageSize={result.pageSize}
        initialSummary={result.summary}
      />
    </div>
  );
}

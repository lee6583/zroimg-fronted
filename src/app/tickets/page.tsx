import { AppShell } from "@/components/layout/app-shell";
import { FeedbackPanel } from "@/features/tickets/feedback-panel";
import { requireUser } from "@/server/auth";
import { listTicketsForUser } from "@/server/bff/account";
import type { TicketItem } from "@/types/feedback";

export const dynamic = "force-dynamic";

export default async function TicketsPage() {
  const current = await requireUser();
  const tickets = await listTicketsForUser(current.profile.id);
  const ticketItems: TicketItem[] = tickets.map((ticket) => ({
    id: ticket.id,
    type: ticket.type,
    status: ticket.status,
    subject: ticket.subject,
    content: ticket.content,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    messages: ticket.messages.map((message) => ({
      id: message.id,
      body: message.body,
      isAdmin: message.isAdmin,
      createdAt: message.createdAt.toISOString(),
      authorName: message.authorProfile.username,
    })),
  }));

  return (
    <AppShell active="tickets">
      <div className="grid gap-6">
        <section>
          <h1 className="page-title">意见反馈</h1>
        </section>

        <FeedbackPanel initialTickets={ticketItems} />
      </div>
    </AppShell>
  );
}

import { FeedbackPanel } from "@/features/tickets/feedback-panel";
import { requireUser } from "@/server/auth";
import { requestJava } from "@/server/java-api";
import type { TicketListPage } from "@/types/feedback";

export const dynamic = "force-dynamic";
const pageSize = 5;

export default async function TicketsPage() {
  await requireUser();
  const result = await requestJava<TicketListPage>("/feedback/user/tickets", {
    params: { pageNo: 1, pageSize },
  });

  return (
    <div className="page-stack">
      <section>
        <h1 className="page-title">意见反馈</h1>
      </section>

      <FeedbackPanel
        initialTickets={result.list}
        initialTotal={Number(result.total)}
        initialPage={1}
        initialPageSize={pageSize}
        initialSummary={result.summary}
      />
    </div>
  );
}

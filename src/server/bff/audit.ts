import "server-only";

import { isJavaBffEnabled } from "@/server/env";
import { addAuditLog as addMockAuditLog, type MockAdminAuditLog } from "@/server/bff/mock-store";

type AuditLogInput = Omit<MockAdminAuditLog, "id" | "createdAt">;

export function addAuditLog(input: AuditLogInput) {
  if (isJavaBffEnabled()) {
    return;
  }

  addMockAuditLog(input);
}

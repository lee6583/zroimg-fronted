import "server-only";

import { z } from "zod";
import { isJavaBffEnabled } from "@/server/env";
import { requestJavaApiData } from "@/server/java-api";
import { prisma } from "@/server/bff/mock-db";
import { getStore } from "@/server/bff/mock-store";
import type { MockTaskStatus } from "@/server/bff/mock-store";
import type { AdminAuditLogPage, AdminGenerationPage, AdminOverview } from "@/types/admin";

const latestTicketSchema = z.object({
  id: z.number(),
  subject: z.string(),
  status: z.string(),
  email: z.string().nullable().optional(),
  createdAt: z.string(),
});

const overviewSchema = z.object({
  users: z.number(),
  tasks: z.number(),
  orders: z.number(),
  failedTasks: z.number(),
  openTickets: z.number(),
  latestTickets: z.array(latestTicketSchema),
});

const javaTaskSchema = z.object({
  id: z.number(),
  taskNo: z.string(),
  userEmail: z.string().nullable().optional(),
  prompt: z.string(),
  status: z.string(),
  mode: z.string(),
  modelCode: z.string(),
  resolution: z.string(),
  ratio: z.string(),
  quality: z.string(),
  requiredPoints: z.number(),
  results: z.array(z.unknown()),
  failReason: z.string().nullable().optional(),
  createTime: z.string(),
});

const javaTaskPageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(javaTaskSchema),
});

const auditSchema = z.object({
  id: z.number(),
  adminUserId: z.number(),
  adminEmail: z.string().nullable().optional(),
  action: z.string(),
  targetType: z.string(),
  targetId: z.string().nullable().optional(),
  detailJson: z.string().nullable().optional(),
  createdAt: z.string(),
});

const auditPageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(auditSchema),
});

function buildPagePath(path: string, page: number, pageSize: number) {
  const params = new URLSearchParams({
    pageNo: String(page),
    pageSize: String(pageSize),
    sortBy: "create_time",
    isAsc: "false",
  });
  return `${path}?${params.toString()}`;
}

export async function getAdminOverview(): Promise<AdminOverview> {
  if (isJavaBffEnabled()) {
    const data = await requestJavaApiData<unknown>("/dashboard/admin/overview");
    const overview = overviewSchema.parse(data);
    return {
      ...overview,
      latestTickets: overview.latestTickets.map((ticket) => ({
        ...ticket,
        email: ticket.email ?? null,
      })),
    };
  }

  const [users, tasks, orders, failedTasks, openTickets, latestTickets] = await Promise.all([
    prisma.userProfile.count(),
    prisma.generationTask.count(),
    prisma.paymentOrder.count(),
    prisma.generationTask.count({ where: { status: "failed" } }),
    prisma.feedbackTicket.count({ where: { status: { in: ["open", "in_progress"] } } }),
    prisma.feedbackTicket.findMany({
      include: { userProfile: { include: { user: true } } },
      orderBy: [{ lastMessageAt: "desc" }, { createdAt: "desc" }],
      take: 5,
    }),
  ]);

  return {
    users,
    tasks,
    orders,
    failedTasks,
    openTickets,
    latestTickets: latestTickets.map((ticket) => ({
      id: Number(ticket.id),
      subject: ticket.subject,
      status: ticket.status,
      email: ticket.userProfile?.user?.email ?? null,
      createdAt: ticket.createdAt.toISOString(),
    })),
  };
}

export async function listAdminGenerations(input: {
  page: number;
  pageSize: number;
  q?: string;
  status?: string;
}): Promise<AdminGenerationPage> {
  if (isJavaBffEnabled()) {
    const params = new URLSearchParams({
      pageNo: String(input.page),
      pageSize: String(input.pageSize),
      sortBy: "create_time",
      isAsc: "false",
    });
    if (input.q) params.set("q", input.q);
    if (input.status) params.set("status", input.status);

    const data = await requestJavaApiData<unknown>(`/generation/admin/tasks?${params.toString()}`);
    const page = javaTaskPageSchema.parse(data);
    return {
      total: page.total,
      pages: page.pages,
      list: page.list.map((task) => ({
        id: String(task.id),
        taskNo: task.taskNo,
        userEmail: task.userEmail || "-",
        prompt: task.prompt,
        status: task.status,
        mode: task.mode,
        model: task.modelCode,
        size: `${task.resolution} / ${task.ratio}`,
        quality: task.quality,
        requiredPoints: task.requiredPoints,
        outputCount: task.results.length,
        failReason: task.failReason || null,
        createdAt: task.createTime,
      })),
    };
  }

  const where = {
    ...(input.status ? { status: input.status as MockTaskStatus } : {}),
    ...(input.q
      ? {
          OR: [
            { prompt: { contains: input.q, mode: "insensitive" as const } },
            { model: { contains: input.q, mode: "insensitive" as const } },
            {
              userProfile: { user: { email: { contains: input.q, mode: "insensitive" as const } } },
            },
          ],
        }
      : {}),
  };
  const [tasks, total] = await Promise.all([
    prisma.generationTask.findMany({
      where,
      include: { userProfile: { include: { user: true } }, outputs: true },
      orderBy: { createdAt: "desc" },
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
    }),
    prisma.generationTask.count({ where }),
  ]);

  return {
    total,
    pages: Math.max(1, Math.ceil(total / input.pageSize)),
    list: tasks.map((task) => ({
      id: task.id,
      taskNo: task.id,
      userEmail: task.userProfile?.user?.email || "-",
      prompt: task.prompt,
      status: task.status,
      mode: task.mode,
      model: task.model,
      size: task.size,
      quality: task.quality,
      requiredPoints: task.costCredits,
      outputCount: task.outputs?.length ?? 0,
      failReason: task.error,
      createdAt: task.createdAt.toISOString(),
    })),
  };
}

export async function listAuditLogs(input: {
  page: number;
  pageSize: number;
}): Promise<AdminAuditLogPage> {
  if (isJavaBffEnabled()) {
    const data = await requestJavaApiData<unknown>(
      buildPagePath("/audit/admin/logs", input.page, input.pageSize),
    );
    const page = auditPageSchema.parse(data);
    return {
      ...page,
      list: page.list.map((log) => ({
        ...log,
        adminEmail: log.adminEmail ?? null,
        targetId: log.targetId ?? null,
        detailJson: log.detailJson ?? null,
      })),
    };
  }

  const store = getStore();
  const total = store.adminAuditLogs.length;
  const start = (input.page - 1) * input.pageSize;
  const logs = store.adminAuditLogs.slice(start, start + input.pageSize);
  return {
    total,
    pages: Math.max(1, Math.ceil(total / input.pageSize)),
    list: logs.map((log) => ({
      id: Number(log.id),
      adminUserId: Number(log.adminProfileId),
      adminEmail: null,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId,
      detailJson: JSON.stringify(log.detailJson),
      createdAt: log.createdAt.toISOString(),
    })),
  };
}

import "server-only";

import { z } from "zod";
import { isJavaBffEnabled } from "@/server/env";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import { prisma } from "@/server/bff/mock-db";
import { listAdminUsers } from "@/server/bff/users";
import type { MockTaskStatus } from "@/server/bff/mock-store";
import type { AdminGenerationPage, AdminOverview } from "@/types/admin";

const latestTicketSchema = z.object({
  id: javaIdSchema,
  subject: z.string(),
  status: z.string(),
  username: z.string().nullable().optional(),
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
  id: javaIdSchema,
  taskNo: z.string(),
  username: z.string().nullable().optional(),
  userEmail: z.string().nullable().optional(),
  prompt: z.string(),
  status: z.string(),
  modelType: z.enum(["image", "video"]),
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

async function resolveTaskUsernames(tasks: z.infer<typeof javaTaskSchema>[]) {
  const missingEmails = [
    ...new Set(
      tasks
        .filter((task) => !task.username && task.userEmail)
        .map((task) => task.userEmail!.toLowerCase()),
    ),
  ];

  const users = await Promise.all(
    missingEmails.map(async (email) => {
      const page = await listAdminUsers({ page: 1, pageSize: 1, q: email });
      const user = page.list.find((item) => item.email.toLowerCase() === email);
      return [email, user?.username] as const;
    }),
  );

  return new Map(users);
}

export async function getAdminOverview(): Promise<AdminOverview> {
  if (isJavaBffEnabled()) {
    const data = await requestJavaApiData<unknown>("/dashboard/admin/overview");
    const overview = overviewSchema.parse(data);
    return {
      ...overview,
      latestTickets: overview.latestTickets.map((ticket) => ({
        ...ticket,
        username: ticket.username ?? null,
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
      id: ticket.id,
      subject: ticket.subject,
      status: ticket.status,
      username: ticket.userProfile?.username ?? null,
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
    const usernamesByEmail = await resolveTaskUsernames(page.list);
    return {
      total: page.total,
      pages: page.pages,
      list: page.list.map((task) => ({
        id: String(task.id),
        taskNo: task.taskNo,
        username:
          task.username ||
          (task.userEmail ? usernamesByEmail.get(task.userEmail.toLowerCase()) : undefined) ||
          "-",
        prompt: task.prompt,
        status: task.status,
        modelType: task.modelType,
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
    ...(input.status
      ? {
          status:
            input.status === "processing"
              ? { in: ["queued", "running"] satisfies MockTaskStatus[] }
              : (input.status as MockTaskStatus),
        }
      : {}),
    ...(input.q
      ? {
          OR: [
            { prompt: { contains: input.q, mode: "insensitive" as const } },
            { model: { contains: input.q, mode: "insensitive" as const } },
            {
              userProfile: { user: { email: { contains: input.q, mode: "insensitive" as const } } },
            },
            {
              userProfile: { username: { contains: input.q, mode: "insensitive" as const } },
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
      username: task.userProfile?.username || "-",
      prompt: task.prompt,
      status: task.status,
      modelType: "image",
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

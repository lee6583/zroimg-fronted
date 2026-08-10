import "server-only";

import { z } from "zod";
import { isJavaBffEnabled } from "@/server/env";
import { requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import { prisma } from "@/server/bff/mock-db";
import type {
  AdminGenerationTask,
  AdminPointsFlow,
  AdminUser,
  AdminUserPage,
  AdminUserPageQuery,
} from "@/types/admin";

const javaUserSchema = z.object({
  id: javaIdSchema,
  username: z.string(),
  email: z.string(),
  bio: z.string().nullable().optional(),
  role: z.string(),
  status: z.enum(["active", "banned"]),
  totalPoints: z.number(),
  createdAt: z.string(),
});

const javaUserPageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(javaUserSchema),
});

const javaFlowSchema = z.object({
  id: javaIdSchema,
  amount: z.number(),
  afterPoints: z.number(),
  remark: z.string(),
  createdAt: z.string(),
});

const javaFlowPageSchema = z.object({
  list: z.array(javaFlowSchema),
});

const javaTaskSchema = z.object({
  id: javaIdSchema,
  taskNo: z.string().optional(),
  prompt: z.string(),
  status: z.string(),
  mode: z.string().optional(),
  modelCode: z.string().optional(),
  resolution: z.string().optional(),
  ratio: z.string().optional(),
  quality: z.string().optional(),
  results: z.array(z.unknown()).optional(),
  requiredPoints: z.number(),
  failReason: z.string().nullable().optional(),
  createTime: z.string(),
});

const javaTaskPageSchema = z.object({
  list: z.array(javaTaskSchema),
});

function toUser(input: z.infer<typeof javaUserSchema>): AdminUser {
  return {
    id: String(input.id),
    username: input.username,
    email: input.email,
    bio: input.bio || "",
    role: input.role,
    status: input.status,
    totalPoints: input.totalPoints,
    createdAt: input.createdAt,
  };
}

function buildUserPagePath(query: AdminUserPageQuery) {
  const params = new URLSearchParams();
  params.set("pageNo", String(query.page));
  params.set("pageSize", String(query.pageSize));
  params.set("sortBy", "create_time");
  params.set("isAsc", "false");

  if (query.q) {
    params.set("q", query.q);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  return `/auth/admin/users?${params.toString()}`;
}

async function listMockUsers(query: AdminUserPageQuery): Promise<AdminUserPage> {
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.q
      ? {
          OR: [{ username: { contains: query.q } }, { user: { email: { contains: query.q } } }],
        }
      : {}),
  };

  const profiles = await prisma.userProfile.findMany({
    where,
    include: { user: true },
    orderBy: { createdAt: "desc" },
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  });
  const total = await prisma.userProfile.count({ where });
  const pages = Math.max(1, Math.ceil(total / query.pageSize));

  const list = profiles.map((profile) => {
    return {
      id: profile.id,
      username: profile.username,
      email: profile.user?.email || "",
      bio: profile.bio,
      role: profile.role,
      status: profile.status,
      totalPoints: profile.creditBalance,
      createdAt: profile.createdAt.toISOString(),
    };
  });

  return { total, pages, list };
}

async function listJavaUsers(query: AdminUserPageQuery): Promise<AdminUserPage> {
  const data = await requestJavaApiData<unknown>(buildUserPagePath(query));
  const parsed = javaUserPageSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("用户列表接口返回格式不正确");
  }

  const list = parsed.data.list.map((user) => {
    return toUser(user);
  });

  return {
    total: parsed.data.total,
    pages: parsed.data.pages,
    list,
  };
}

export async function listAdminUsers(query: AdminUserPageQuery) {
  if (isJavaBffEnabled()) {
    return listJavaUsers(query);
  }

  return listMockUsers(query);
}

export async function getAdminUser(userId: string) {
  if (!isJavaBffEnabled()) {
    const profile = await prisma.userProfile.findUnique({
      where: { id: userId },
      include: { user: true },
    });

    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      username: profile.username,
      email: profile.user?.email || "",
      bio: profile.bio,
      role: profile.role,
      status: profile.status,
      totalPoints: profile.creditBalance,
      createdAt: profile.createdAt.toISOString(),
    };
  }

  const data = await requestJavaApiData<unknown>(`/auth/admin/users/${encodeURIComponent(userId)}`);
  const parsed = javaUserSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("用户详情接口返回格式不正确");
  }

  return toUser(parsed.data);
}

export async function listAdminFlows(userId: string): Promise<AdminPointsFlow[]> {
  if (!isJavaBffEnabled()) {
    const flows = await prisma.creditLedger.findMany({
      where: { userProfileId: userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    return flows.map((flow) => {
      return {
        id: flow.id,
        amount: flow.amount,
        afterPoints: flow.balanceAfter,
        remark: flow.reason,
        createdAt: flow.createdAt.toISOString(),
      };
    });
  }

  const params = new URLSearchParams({
    pageNo: "1",
    pageSize: "30",
    sortBy: "create_time",
    isAsc: "false",
  });
  const path = `/points/admin/users/${encodeURIComponent(userId)}/flows?${params.toString()}`;
  const data = await requestJavaApiData<unknown>(path);
  const parsed = javaFlowPageSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("积分流水接口返回格式不正确");
  }

  return parsed.data.list.map((flow) => {
    return {
      id: String(flow.id),
      amount: flow.amount,
      afterPoints: flow.afterPoints,
      remark: flow.remark,
      createdAt: flow.createdAt,
    };
  });
}

export async function listAdminTasks(userId: string): Promise<AdminGenerationTask[]> {
  if (!isJavaBffEnabled()) {
    const tasks = await prisma.generationTask.findMany({
      where: { userProfileId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return tasks.map((task) => {
      return {
        id: task.id,
        taskNo: task.id,
        userEmail: "-",
        prompt: task.prompt,
        status: task.status,
        mode: task.mode,
        model: task.model,
        size: task.size,
        quality: task.quality,
        requiredPoints: task.costCredits,
        outputCount: 0,
        failReason: task.error,
        createdAt: task.createdAt.toISOString(),
      };
    });
  }

  const params = new URLSearchParams({
    pageNo: "1",
    pageSize: "20",
    sortBy: "create_time",
    isAsc: "false",
  });
  const path = `/generation/admin/users/${encodeURIComponent(userId)}/tasks?${params.toString()}`;
  const data = await requestJavaApiData<unknown>(path);
  const parsed = javaTaskPageSchema.safeParse(data);

  if (!parsed.success) {
    throw new Error("生成记录接口返回格式不正确");
  }

  return parsed.data.list.map((task) => {
    return {
      id: String(task.id),
      taskNo: task.taskNo || String(task.id),
      userEmail: "-",
      prompt: task.prompt,
      status: task.status,
      mode: task.mode || "-",
      model: task.modelCode || "-",
      size: task.resolution && task.ratio ? `${task.resolution} / ${task.ratio}` : "-",
      quality: task.quality || "-",
      requiredPoints: task.requiredPoints,
      outputCount: task.results?.length || 0,
      failReason: task.failReason || null,
      createdAt: task.createTime,
    };
  });
}

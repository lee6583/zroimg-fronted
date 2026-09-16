import "server-only";

import { z } from "zod";
import { isMockPaymentBffEnabled } from "@/server/env";
import { getJavaApiData, requestJavaApiData } from "@/server/java-api";
import { javaIdSchema } from "@/server/java-id";
import { prisma } from "@/server/bff/mock-db";
import { getStore, nextId } from "@/server/bff/mock-store";
import type { MockOrderStatus } from "@/server/bff/mock-store";
import type {
  AdminCreditPackageInput,
  AdminRechargeOrder,
  AdminRechargeOrderPage,
  AdminRechargeOrderPageQuery,
  CreditPackage,
  RechargeOrder,
  RechargeOrderPage,
  RechargeOrderPageQuery,
  RechargeOverview,
} from "@/types/orders";
import { normalizeOrderDisplayStatus } from "@/utils/order-status";
import { normalizeRechargeAmountBreakdown } from "@/utils/recharge";

const javaPackageSchema = z.object({
  id: javaIdSchema,
  code: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  amountCent: z.number(),
  amountText: z.string().nullable().optional(),
  credits: z.number(),
  highlights: z.array(z.string()).nullable().optional(),
  recommended: z.boolean().nullable().optional(),
  enabled: z.boolean().nullable().optional(),
  sort: z.number().nullable().optional(),
});

const javaPackagesSchema = z.array(javaPackageSchema);

const javaRechargeOrderSchema = z.object({
  orderNo: z.string(),
  packageId: javaIdSchema,
  packageCode: z.string(),
  packageName: z.string(),
  packageDescription: z.string().nullable().optional(),
  amountCent: z.number(),
  amountText: z.string(),
  rechargeAmountCent: z.number().nullable().optional(),
  feeAmountCent: z.number().nullable().optional(),
  credits: z.number(),
  payChannel: z.string().nullable().optional(),
  payChannelText: z.string().nullable().optional(),
  payStatus: z.string(),
  creditsStatus: z.string(),
  displayStatus: z.string(),
  thirdTradeNo: z.string().nullable().optional(),
  createTime: z.string(),
  payTime: z.string().nullable().optional(),
  expireTime: z.string().nullable().optional(),
});

const javaRechargeOverviewSchema = z.object({
  pendingOrderCount: z.number(),
  completedOrderCount: z.number(),
  enabledPackageCount: z.number(),
  totalPoints: z.number(),
  rechargeRules: z.object({
    feeRatePercent: z.number(),
    timeoutMinutes: z.number(),
    creditsPerYuan: z.number(),
    maxPendingOrders: z.number(),
    minAmountCent: z.number(),
    maxAmountCent: z.number(),
  }),
});

const javaRechargeOrderPageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(javaRechargeOrderSchema),
});

const javaAdminRechargeOrderSchema = javaRechargeOrderSchema.extend({
  userId: javaIdSchema,
  username: z.string().nullable().optional(),
  creditsErrorReason: z.string().nullable().optional(),
  closeTime: z.string().nullable().optional(),
});

const javaAdminRechargeOrderPageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(javaAdminRechargeOrderSchema),
});

type PackageInput = {
  id: number | string;
  code: string;
  name: string;
  description?: string | null;
  amountCent: number;
  amountText?: string | null;
  credits: number;
  highlights?: string[] | null;
  recommended?: boolean | null;
  enabled?: boolean | null;
  sort?: number | null;
};

type AdminPackageInput = AdminCreditPackageInput;

function buildJavaRechargeOrderPath(orderNo: string) {
  const safeOrderNo = encodeURIComponent(orderNo);
  return `/order/user/recharge-orders/${safeOrderNo}`;
}

function buildJavaRechargeOrderPagePath(query: RechargeOrderPageQuery) {
  const params = new URLSearchParams();
  params.set("pageNo", String(query.page));
  params.set("pageSize", String(query.pageSize));
  params.set("isAsc", "false");
  params.set("sortBy", "create_time");

  return `/order/user/recharge-orders?${params.toString()}`;
}

function formatAmountText(amountCent: number) {
  const amount = amountCent / 100;
  return `¥${amount.toFixed(2).replace(/\.00$/, "")}`;
}

function fallbackDescription(code: string) {
  if (code === "STARTER_100") {
    return "把脑海里的第一束光，先变成看得见的画面。";
  }

  if (code === "PRO_500") {
    return "为持续创作留出余量，让好想法不必停在半路。";
  }

  if (code === "MAX_1200") {
    return "给完整项目一整片画布，从概念到成片都从容推进。";
  }

  return "为下一次创作补充能量，让想法继续向前。";
}

function fallbackHighlights(input: { code: string; credits: number }) {
  if (input.code === "STARTER_100") {
    return [
      "100 积分，即买即用",
      "适合头像、封面与灵感草稿",
      "支持文本生图与图生图",
      "订单与积分流水清晰可查",
    ];
  }

  if (input.code === "PRO_500") {
    return [
      "500 积分，适合日常高频创作",
      "覆盖主流图片生成与编辑场景",
      "适合社媒配图、海报与产品概念",
      "失败任务自动返还本次消耗",
    ];
  }

  if (input.code === "MAX_1200") {
    return [
      "1200 积分，适合项目制创作",
      "更适合多版本探索与精修",
      "适合品牌视觉、系列图与素材库",
      "购买记录可在我的订单中查看",
    ];
  }

  return [
    `${input.credits} 积分，即买即用`,
    "支持图片生成与编辑",
    "适合按需补充创作额度",
    "购买记录可在我的订单中查看",
  ];
}

function isRecommendedPackage(code: string) {
  return code === "PRO_500";
}

function normalizePackage(input: PackageInput): CreditPackage {
  const highlights = input.highlights?.filter(Boolean) ?? [];
  const amountText = input.amountText?.trim() || formatAmountText(input.amountCent);
  const description = input.description?.trim() || fallbackDescription(input.code);
  const hasValidHighlights = highlights.length === 4;

  return {
    id: String(input.id),
    code: input.code,
    name: input.name,
    description,
    amountCent: input.amountCent,
    amountText,
    credits: input.credits,
    highlights: hasValidHighlights ? highlights : fallbackHighlights(input),
    recommended: input.recommended ?? isRecommendedPackage(input.code),
    enabled: input.enabled ?? true,
    sort: input.sort ?? 0,
  };
}

async function listMockCreditPackages() {
  const packages = await prisma.creditPackage.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return packages.map((item) => {
    const amountCent = Math.round(item.priceCny * 100);
    const input = {
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      amountCent,
      amountText: formatAmountText(amountCent),
      credits: item.credits,
      highlights: item.highlights,
      enabled: item.isActive,
      recommended: item.recommended ?? isRecommendedPackage(item.code),
      sort: item.sortOrder,
    };

    return normalizePackage(input);
  });
}

async function listJavaCreditPackages() {
  const payload = await getJavaApiData<unknown>("/order/user/packages");
  const parsed = javaPackagesSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("积分套餐接口返回格式不正确");
  }

  return parsed.data
    .map((item) => normalizePackage(item))
    .filter((item) => item.enabled)
    .sort((itemA, itemB) => itemA.sort - itemB.sort);
}

async function listCreditPackages() {
  if (isMockPaymentBffEnabled()) {
    return listMockCreditPackages();
  }

  return listJavaCreditPackages();
}

function toMockPackageInput(item: ReturnType<typeof getStore>["creditPackages"][number]) {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    amountCent: Math.round(item.priceCny * 100),
    credits: item.credits,
    highlights: item.highlights,
    recommended: item.recommended,
    enabled: item.isActive,
    sort: item.sortOrder,
  } satisfies PackageInput;
}

function toAdminPackage(input: PackageInput) {
  return normalizePackage(input);
}

async function listMockAdminCreditPackages() {
  const packages = getStore()
    .creditPackages.map(toMockPackageInput)
    .sort((itemA, itemB) => itemA.sort - itemB.sort);

  return packages.map(toAdminPackage);
}

async function listJavaAdminCreditPackages() {
  const payload = await getJavaApiData<unknown>("/order/admin/packages");
  const parsed = javaPackagesSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("管理端套餐接口返回格式不正确");
  }

  return parsed.data
    .map((item) => normalizePackage(item))
    .sort((itemA, itemB) => {
      return itemA.sort - itemB.sort;
    });
}

async function listAdminCreditPackages() {
  if (isMockPaymentBffEnabled()) {
    return listMockAdminCreditPackages();
  }

  return listJavaAdminCreditPackages();
}

async function createMockCreditPackage(input: AdminPackageInput) {
  const store = getStore();
  const hasSameCode = store.creditPackages.some((item) => item.code === input.code);
  if (hasSameCode) {
    throw new Error("套餐编码已存在");
  }

  const item = {
    id: nextId("package"),
    code: input.code,
    name: input.name,
    description: input.description,
    credits: input.credits,
    priceCny: input.amountCent / 100,
    sortOrder: input.sort,
    isActive: input.enabled,
    highlights: input.highlights,
    recommended: input.recommended,
  };

  if (item.recommended) {
    for (const packageItem of store.creditPackages) {
      packageItem.recommended = false;
    }
  }

  store.creditPackages.push(item);
  return toAdminPackage(toMockPackageInput(item));
}

async function createAdminCreditPackage(input: AdminPackageInput) {
  if (!isMockPaymentBffEnabled()) {
    const payload = await requestJavaApiData<unknown>("/order/admin/packages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    return toAdminPackage(javaPackageSchema.parse(payload));
  }

  return createMockCreditPackage(input);
}

async function updateAdminCreditPackage(id: string, input: AdminPackageInput) {
  if (!isMockPaymentBffEnabled()) {
    const payload = await requestJavaApiData<unknown>(
      `/order/admin/packages/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      },
    );
    return toAdminPackage(javaPackageSchema.parse(payload));
  }

  const store = getStore();
  const item = store.creditPackages.find((packageItem) => packageItem.id === id);
  if (!item) {
    throw new Error("套餐不存在");
  }

  const codeUsedByOther = store.creditPackages.some((packageItem) => {
    return packageItem.id !== id && packageItem.code === input.code;
  });
  if (codeUsedByOther) {
    throw new Error("套餐编码已存在");
  }

  item.code = input.code;
  item.name = input.name;
  item.description = input.description;
  item.credits = input.credits;
  item.priceCny = input.amountCent / 100;
  item.sortOrder = input.sort;
  item.isActive = input.enabled;
  item.highlights = input.highlights;
  item.recommended = input.recommended;

  if (item.recommended) {
    for (const packageItem of store.creditPackages) {
      if (packageItem.id !== id) {
        packageItem.recommended = false;
      }
    }
  }

  return toAdminPackage(toMockPackageInput(item));
}

async function updateAdminCreditPackageStatus(id: string, enabled: boolean) {
  if (!isMockPaymentBffEnabled()) {
    const payload = await requestJavaApiData<unknown>(
      `/order/admin/packages/${encodeURIComponent(id)}/status`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      },
    );
    return toAdminPackage(javaPackageSchema.parse(payload));
  }

  const store = getStore();
  const item = store.creditPackages.find((packageItem) => packageItem.id === id);
  if (!item) {
    throw new Error("套餐不存在");
  }

  item.isActive = enabled;
  return toAdminPackage(toMockPackageInput(item));
}

async function updateAdminCreditPackageRecommend(id: string, recommended: boolean) {
  if (!isMockPaymentBffEnabled()) {
    const payload = await requestJavaApiData<unknown>(
      `/order/admin/packages/${encodeURIComponent(id)}/recommend`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recommended }),
      },
    );
    return toAdminPackage(javaPackageSchema.parse(payload));
  }

  const store = getStore();
  const item = store.creditPackages.find((packageItem) => packageItem.id === id);
  if (!item) {
    throw new Error("套餐不存在");
  }

  item.recommended = recommended;
  if (recommended) {
    for (const packageItem of store.creditPackages) {
      if (packageItem.id !== id) {
        packageItem.recommended = false;
      }
    }
  }

  return toAdminPackage(toMockPackageInput(item));
}

async function updateAdminCreditPackageSort(id: string, sort: number) {
  if (!isMockPaymentBffEnabled()) {
    const payload = await requestJavaApiData<unknown>(
      `/order/admin/packages/${encodeURIComponent(id)}/sort`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sort }),
      },
    );
    return toAdminPackage(javaPackageSchema.parse(payload));
  }

  const store = getStore();
  const item = store.creditPackages.find((packageItem) => packageItem.id === id);
  if (!item) {
    throw new Error("套餐不存在");
  }

  item.sortOrder = sort;
  return toAdminPackage(toMockPackageInput(item));
}

async function deleteAdminCreditPackage(id: string) {
  if (!isMockPaymentBffEnabled()) {
    await requestJavaApiData<unknown>(`/order/admin/packages/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return;
  }

  const store = getStore();
  const index = store.creditPackages.findIndex((packageItem) => packageItem.id === id);
  if (index < 0) {
    throw new Error("套餐不存在");
  }

  store.creditPackages.splice(index, 1);
}

async function getMockRechargeOverview(input: { userProfileId: string; totalPoints: number }) {
  const [pendingOrderCount, completedOrderCount, packages] = await Promise.all([
    prisma.paymentOrder.count({
      where: {
        userProfileId: input.userProfileId,
        status: "pending",
      },
    }),
    prisma.paymentOrder.count({
      where: {
        userProfileId: input.userProfileId,
        status: "fulfilled",
      },
    }),
    prisma.creditPackage.findMany({
      where: {
        isActive: true,
      },
    }),
  ]);

  return {
    pendingOrderCount,
    completedOrderCount,
    enabledPackageCount: packages.length,
    totalPoints: input.totalPoints,
    rechargeRules: {
      feeRatePercent: getStore().settings.easypay.feeRatePercent,
      timeoutMinutes: getStore().settings.easypay.timeoutMinutes,
      creditsPerYuan: getStore().settings.easypay.creditsPerYuan,
      maxPendingOrders: getStore().settings.easypay.maxPendingOrders,
      minAmountCent: getStore().settings.easypay.minAmountCent,
      maxAmountCent: getStore().settings.easypay.maxAmountCent,
    },
  };
}

async function getJavaRechargeOverview() {
  const payload = await getJavaApiData<unknown>("/order/user/recharge-orders/overview");
  const parsed = javaRechargeOverviewSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("充值页面概览接口返回格式不正确");
  }

  return parsed.data;
}

async function getRechargeOverview(input: {
  userProfileId: string;
  totalPoints: number;
}): Promise<RechargeOverview> {
  if (isMockPaymentBffEnabled()) {
    return getMockRechargeOverview(input);
  }

  return getJavaRechargeOverview();
}

function mockOrderToRechargeOrder(
  order: Awaited<ReturnType<typeof prisma.paymentOrder.findMany>>[number],
) {
  const packageCode = order.creditPackage?.code ?? "CUSTOM";
  const packageName = order.creditPackage?.name ?? "自定义积分购买";
  const amountCent = Math.round(Number(order.amountCny.toString()) * 100);
  const isCredited = order.status === "fulfilled";

  return {
    orderNo: order.orderNo,
    packageId: order.creditPackageId ?? "0",
    packageCode,
    packageName,
    packageDescription: null,
    amountCent,
    amountText: formatAmountText(amountCent),
    rechargeAmountCent: amountCent,
    feeAmountCent: 0,
    credits: order.credits,
    payChannel: order.paymentType,
    payChannelText: order.paymentType,
    payStatus: order.status,
    creditsStatus: isCredited ? "fulfilled" : "pending",
    displayStatus: normalizeOrderDisplayStatus(order.status),
    thirdTradeNo: order.providerTradeNo,
    createTime: order.createdAt.toISOString(),
    payTime: order.paidAt?.toISOString() ?? null,
    expireTime: null,
  };
}

async function listMockRechargeOrders(query: RechargeOrderPageQuery): Promise<RechargeOrderPage> {
  const where = { userProfileId: query.userProfileId };
  const total = await prisma.paymentOrder.count({ where });
  const pages = Math.max(1, Math.ceil(total / query.pageSize));
  const currentPage = Math.min(query.page, pages);
  const skip = (currentPage - 1) * query.pageSize;
  const orders = await prisma.paymentOrder.findMany({
    where,
    include: {
      creditPackage: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    skip,
    take: query.pageSize,
  });

  return {
    total,
    pages,
    list: orders.map((order) => mockOrderToRechargeOrder(order)),
  };
}

async function listJavaRechargeOrders(query: RechargeOrderPageQuery) {
  const payload = await requestJavaApiData<unknown>(buildJavaRechargeOrderPagePath(query));
  const parsed = javaRechargeOrderPageSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("充值订单分页接口返回格式不正确");
  }

  return {
    ...parsed.data,
    list: parsed.data.list.map(normalizeJavaRechargeOrder),
  };
}

async function listRechargeOrders(query: RechargeOrderPageQuery): Promise<RechargeOrderPage> {
  if (isMockPaymentBffEnabled()) {
    return listMockRechargeOrders(query);
  }

  return listJavaRechargeOrders(query);
}

function parseJavaRechargeOrder(payload: unknown, errorMessage: string): RechargeOrder {
  const parsed = javaRechargeOrderSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(errorMessage);
  }

  return normalizeJavaRechargeOrder(parsed.data);
}

function normalizeJavaRechargeOrder(
  order: z.output<typeof javaRechargeOrderSchema>,
): RechargeOrder {
  return {
    ...order,
    ...normalizeRechargeAmountBreakdown(order),
  };
}

async function getJavaRechargeOrder(orderNo: string) {
  const payload = await requestJavaApiData<unknown>(buildJavaRechargeOrderPath(orderNo));
  return parseJavaRechargeOrder(payload, "充值订单详情接口返回格式不正确");
}

function buildJavaAdminOrderPagePath(query: AdminRechargeOrderPageQuery) {
  const params = new URLSearchParams();
  params.set("pageNo", String(query.page));
  params.set("pageSize", String(query.pageSize));
  params.set("isAsc", "false");
  params.set("sortBy", "create_time");

  if (query.orderNo) {
    params.set("orderNo", query.orderNo);
  }

  if (query.userId) {
    params.set("userId", query.userId);
  }

  if (query.status) {
    params.set("status", query.status);
  }

  return `/order/admin/recharge-orders?${params.toString()}`;
}

function readMockOrderStatuses(status?: string): MockOrderStatus[] | undefined {
  if (status === "pending") return ["pending"];
  if (status === "paid") return ["paid", "fulfilled"];
  if (status === "cancelled") return ["expired", "cancelled", "failed"];
  return undefined;
}

async function listMockAdminOrders(
  query: AdminRechargeOrderPageQuery,
): Promise<AdminRechargeOrderPage> {
  // 第一步:按订单号过滤全部订单，再按展示状态合并内部状态。
  const orderStatuses = readMockOrderStatuses(query.status);
  const allOrders = await prisma.paymentOrder.findMany({
    where: {
      ...(query.userId ? { userProfileId: query.userId } : {}),
      ...(query.orderNo ? { OR: [{ orderNo: { contains: query.orderNo } }] } : {}),
    },
    include: {
      creditPackage: true,
      userProfile: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  const orders = orderStatuses
    ? allOrders.filter((order) => orderStatuses.includes(order.status))
    : allOrders;

  // 第二步:计算分页并截取当前页。
  const total = orders.length;
  const pages = Math.max(1, Math.ceil(total / query.pageSize));
  const currentPage = Math.min(query.page, pages);
  const start = (currentPage - 1) * query.pageSize;
  const pageOrders = orders.slice(start, start + query.pageSize);

  // 第三步:转换为管理端订单结构并补充用户信息。
  const list: AdminRechargeOrder[] = pageOrders.map((order) => {
    const baseOrder = mockOrderToRechargeOrder(order);

    return {
      ...baseOrder,
      username: order.userProfile?.username ?? null,
      creditsErrorReason: null,
      closeTime: null,
    };
  });

  return { total, pages, list };
}

async function listJavaAdminOrders(
  query: AdminRechargeOrderPageQuery,
): Promise<AdminRechargeOrderPage> {
  const payload = await requestJavaApiData<unknown>(buildJavaAdminOrderPagePath(query));
  const parsed = javaAdminRechargeOrderPageSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("管理端订单分页接口返回格式不正确");
  }

  const list: AdminRechargeOrder[] = parsed.data.list.map((item) => {
    return {
      ...normalizeJavaRechargeOrder(item),
      username: item.username ?? null,
      creditsErrorReason: item.creditsErrorReason ?? null,
      closeTime: item.closeTime ?? null,
    };
  });

  return {
    total: parsed.data.total,
    pages: parsed.data.pages,
    list,
  };
}

async function listAdminRechargeOrders(
  query: AdminRechargeOrderPageQuery,
): Promise<AdminRechargeOrderPage> {
  if (isMockPaymentBffEnabled()) {
    return listMockAdminOrders(query);
  }

  return listJavaAdminOrders(query);
}

async function reissueJavaRechargeCredits(orderNo: string) {
  const safeOrderNo = encodeURIComponent(orderNo);
  const payload = await requestJavaApiData<unknown>(
    `/order/admin/recharge-orders/${safeOrderNo}/reissue-credits`,
    { method: "POST" },
  );
  const parsed = javaAdminRechargeOrderSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error("补发积分接口返回格式不正确");
  }

  return {
    ...parsed.data,
    ...normalizeRechargeAmountBreakdown(parsed.data),
  };
}

export {
  createAdminCreditPackage,
  deleteAdminCreditPackage,
  getJavaRechargeOrder,
  getRechargeOverview,
  listAdminCreditPackages,
  listAdminRechargeOrders,
  listRechargeOrders,
  listCreditPackages,
  reissueJavaRechargeCredits,
  updateAdminCreditPackage,
  updateAdminCreditPackageRecommend,
  updateAdminCreditPackageSort,
  updateAdminCreditPackageStatus,
  prisma,
};

import "server-only";

import { z } from "zod";
import { isMockBffEnabled } from "@/server/env";
import { getJavaApiData, requestJavaApiData } from "@/server/java-api";
import { prisma } from "@/server/bff/mock-db";
import type {
  CreditPackage,
  RechargeOrder,
  RechargeOrderPage,
  RechargeOrderPageQuery,
  RechargeOverview,
} from "@/types/orders";

const javaPackageSchema = z.object({
  id: z.number(),
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
  packageId: z.number(),
  packageCode: z.string(),
  packageName: z.string(),
  packageDescription: z.string().nullable().optional(),
  amountCent: z.number(),
  amountText: z.string(),
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
});

const javaRechargeOrderPageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(javaRechargeOrderSchema),
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

function buildJavaRechargeOrderPath(orderNo: string) {
  const safeOrderNo = encodeURIComponent(orderNo);
  return `/order/user/recharge-orders/${safeOrderNo}`;
}

function buildJavaRechargeOrderPagePath(query: RechargeOrderPageQuery) {
  const params = new URLSearchParams();
  params.set("pageNo", String(query.page));
  params.set("pageSize", String(query.pageSize));
  params.set("isAsc", "false");
  params.set("sortBy", "createTime");

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
      amountCent,
      amountText: formatAmountText(amountCent),
      credits: item.credits,
      enabled: item.isActive,
      recommended: isRecommendedPackage(item.code),
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
  if (isMockBffEnabled()) {
    return listMockCreditPackages();
  }

  return listJavaCreditPackages();
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
  if (isMockBffEnabled()) {
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
    packageId: Number(order.creditPackageId ?? 0),
    packageCode,
    packageName,
    packageDescription: null,
    amountCent,
    amountText: formatAmountText(amountCent),
    credits: order.credits,
    payChannel: order.paymentType,
    payChannelText: order.paymentType,
    payStatus: order.status,
    creditsStatus: isCredited ? "fulfilled" : "pending",
    displayStatus: order.status,
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

  return parsed.data;
}

async function listRechargeOrders(query: RechargeOrderPageQuery): Promise<RechargeOrderPage> {
  if (isMockBffEnabled()) {
    return listMockRechargeOrders(query);
  }

  return listJavaRechargeOrders(query);
}

function parseJavaRechargeOrder(payload: unknown, errorMessage: string): RechargeOrder {
  const parsed = javaRechargeOrderSchema.safeParse(payload);

  if (!parsed.success) {
    throw new Error(errorMessage);
  }

  return parsed.data;
}

async function getJavaRechargeOrder(orderNo: string) {
  const payload = await requestJavaApiData<unknown>(buildJavaRechargeOrderPath(orderNo));
  return parseJavaRechargeOrder(payload, "充值订单详情接口返回格式不正确");
}

async function detectJavaRechargeOrder(orderNo: string) {
  const path = `${buildJavaRechargeOrderPath(orderNo)}/detect`;
  const payload = await requestJavaApiData<unknown>(path, {
    method: "POST",
  });

  return parseJavaRechargeOrder(payload, "检测支付状态接口返回格式不正确");
}

export {
  detectJavaRechargeOrder,
  getJavaRechargeOrder,
  getRechargeOverview,
  listRechargeOrders,
  listCreditPackages,
  prisma,
};

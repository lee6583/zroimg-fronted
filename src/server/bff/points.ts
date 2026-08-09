import "server-only";

import { z } from "zod";
import { isJavaBffEnabled } from "@/server/env";
import { getStore } from "@/server/bff/mock-store";
import { requestJavaApiData } from "@/server/java-api";
import type { PointsFlowPage, PointsFlowQuery } from "@/types/points";

const flowSchema = z.object({
  id: z.number(),
  flowNo: z.string(),
  sourceType: z.string(),
  changeType: z.string(),
  amount: z.number(),
  beforePoints: z.number(),
  afterPoints: z.number(),
  remark: z.string(),
  createdAt: z.string(),
});

const pageSchema = z.object({
  total: z.number(),
  pages: z.number(),
  list: z.array(flowSchema),
});

export async function listPointsFlows(
  profileId: string,
  query: PointsFlowQuery,
): Promise<PointsFlowPage> {
  if (isJavaBffEnabled()) {
    const params = new URLSearchParams({
      pageNo: String(query.page),
      pageSize: String(query.pageSize),
      sortBy: "create_time",
      isAsc: "false",
    });
    const payload = await requestJavaApiData<unknown>(`/points/user/flows?${params.toString()}`);
    const page = pageSchema.parse(payload);
    return {
      total: page.total,
      pages: page.pages,
      list: page.list.map((flow) => ({ ...flow, id: String(flow.id) })),
    };
  }

  const flows = getStore().creditLedger.filter((flow) => {
    return flow.userProfileId === profileId;
  });
  flows.sort((flowA, flowB) => {
    return flowB.createdAt.getTime() - flowA.createdAt.getTime();
  });

  const start = (query.page - 1) * query.pageSize;
  const list = flows.slice(start, start + query.pageSize).map((flow) => {
    const beforePoints = flow.balanceAfter - flow.amount;
    return {
      id: flow.id,
      flowNo: flow.id,
      sourceType: flow.type,
      changeType: flow.amount >= 0 ? "income" : "expense",
      amount: flow.amount,
      beforePoints,
      afterPoints: flow.balanceAfter,
      remark: flow.reason,
      createdAt: flow.createdAt.toISOString(),
    };
  });

  return {
    total: flows.length,
    pages: Math.max(1, Math.ceil(flows.length / query.pageSize)),
    list,
  };
}

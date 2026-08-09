import "server-only";

import { z } from "zod";
import { requestJavaApiData } from "@/server/java-api";

const statsSchema = z.object({
  generatedCount: z.number(),
  monthlyGeneratedCount: z.number(),
  favoriteCount: z.number(),
});

export async function getDashboardStats() {
  const payload = await requestJavaApiData<unknown>("/points/user/dashboard");
  return statsSchema.parse(payload);
}

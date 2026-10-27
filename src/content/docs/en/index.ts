import type { DocsLocaleContent } from "../types";
import { apiBalance } from "./api-balance";
import { apiErrors } from "./api-errors";
import { apiImages } from "./api-images";
import { apiModels } from "./api-models";
import { apiOverview } from "./api-overview";
import { apiPolish } from "./api-polish";
import { apiTasks } from "./api-tasks";
import { apiVideos } from "./api-videos";
import { billing } from "./billing";
import { introduction } from "./introduction";
import { quickstart } from "./quickstart";

// 翻译自 zh-CN；与中文保持相同的结构和锚点 id。
export const enDocs: DocsLocaleContent = {
  introduction,
  quickstart,
  billing,
  "api/overview": apiOverview,
  "api/models": apiModels,
  "api/images": apiImages,
  "api/videos": apiVideos,
  "api/tasks": apiTasks,
  "api/polish": apiPolish,
  "api/balance": apiBalance,
  "api/errors": apiErrors,
};

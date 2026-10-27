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

// 中文是文档的源语言；改动含义时同步更新 en、ru。
export const zhCNDocs: DocsLocaleContent = {
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

import { request } from "@/utils/request";
import type {
  PromptPolishConfig,
  PromptPolishRequest,
  PromptPolishResult,
} from "@/types/generation";

function fetchConfig() {
  return request<PromptPolishConfig>({
    url: "/api/generation/user/prompt/polish/config",
    method: "GET",
  });
}

function polish(data: PromptPolishRequest) {
  return request<PromptPolishResult>({
    url: "/api/generation/user/prompt/polish",
    method: "POST",
    data,
  });
}

export const promptPolishApi = {
  fetchConfig,
  polish,
};

import type { Messages } from "next-intl";
import { ApiRequestError } from "@/utils/request";

type ApiErrorKey = keyof Messages["errors"]["api"];
type ApiErrorTranslator = (key: ApiErrorKey) => string;

// Java 稳定错误码 -> errors.api.* 文案。后端给出 errorCode 后在这里逐条登记，未登记的继续显示后端 message。
const errorCodeKeys: Partial<Record<string, ApiErrorKey>> = {};

/**
 * 把接口错误转成当前语言的提示：
 * 1. 已登记的 errorCode -> 对应翻译；
 * 2. 网络失败（code 0）-> errors.api.network；
 * 3. 其余显示后端 message（后端按 Accept-Language 返回）；
 * 4. 非 Error 值 -> errors.api.unknown。
 *
 * 用法：const t = useTranslations("errors.api"); setMessage(translateApiError(error, t));
 */
export function translateApiError(error: unknown, t: ApiErrorTranslator) {
  if (error instanceof ApiRequestError) {
    const errorCode = error.errorCode ?? "";
    const key = errorCodeKeys[errorCode];
    if (key) {
      return t(key);
    }

    if (error.code === 0) {
      return t("network");
    }

    return error.message || t("unknown");
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return t("unknown");
}

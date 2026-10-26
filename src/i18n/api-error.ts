import type { Messages } from "next-intl";
import { ApiRequestError, clientErrorCodes } from "@/utils/request";

type ApiErrorKey = keyof Messages["errors"]["api"];
type ApiErrorTranslator = (key: ApiErrorKey) => string;

/**
 * 稳定错误码 -> errors.api.* 文案。未登记的码继续显示后端 message。
 * - CLIENT_*：前端网络层自己产生的错误（request.ts、uploads.ts），没有后端 message 可用；
 * - 其余：约定给 Java 的业务错误码（后端返回 errorCode 后即生效，见 docs/i18n.md 第 7 节）。
 */
const errorCodeKeys: Partial<Record<string, ApiErrorKey>> = {
  [clientErrorCodes.invalidResponse]: "invalidResponse",
  [clientErrorCodes.serviceUnavailable]: "serviceUnavailable",
  [clientErrorCodes.requestFailed]: "requestFailed",
  [clientErrorCodes.uploadFailed]: "uploadFailed",
  AUTH_UNAUTHORIZED: "unauthorized",
  AUTH_FORBIDDEN: "forbidden",
  AUTH_INVALID_CREDENTIALS: "invalidCredentials",
  AUTH_EMAIL_REGISTERED: "emailAlreadyRegistered",
  AUTH_CODE_INVALID: "verificationCodeInvalid",
  AUTH_SLIDER_FAILED: "sliderVerificationFailed",
  RATE_LIMITED: "tooManyRequests",
  RESOURCE_NOT_FOUND: "notFound",
  POINTS_INSUFFICIENT: "pointsInsufficient",
  UPLOAD_TOO_LARGE: "fileTooLarge",
  UPLOAD_UNSUPPORTED_TYPE: "unsupportedFileType",
};

/**
 * 把接口错误转成当前语言的提示：
 * 1. 已登记的 errorCode -> 对应翻译；
 * 2. 网络失败（code 0）-> errors.api.network；
 * 3. 5xx（Java 只返回通用的「服务器异常」）-> errors.api.serverError；
 * 4. 其余显示后端 message（后端按 Accept-Language 返回）；
 * 5. 非 Error 值 -> errors.api.unknown。
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

    if (error.status >= 500) {
      return t("serverError");
    }

    return error.message || t("unknown");
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return t("unknown");
}

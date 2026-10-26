import { IntlErrorCode, type IntlError } from "next-intl";

const isDev = process.env.NODE_ENV !== "production";

type MessageFallbackInfo = {
  error: IntlError;
  key: string;
  namespace?: string;
};

// 服务端（i18n/request.ts）和客户端（IntlErrorHandlingProvider）共用，保证两侧表现一致。
export function onIntlError(error: IntlError) {
  if (error.code === IntlErrorCode.MISSING_MESSAGE) {
    if (isDev) {
      console.warn(`[i18n] ${error.message}`);
    }
    return;
  }

  console.error("[i18n]", error);
}

// 文案已按 zh-CN 合并兜底，走到这里说明 zh-CN 也缺 key 或 ICU 参数有误。
// 开发环境显示 key 方便定位；生产环境返回空串，绝不把原始 key 展示给用户。
export function getIntlMessageFallback(info: MessageFallbackInfo) {
  if (!isDev) {
    return "";
  }

  const path = [info.namespace, info.key].filter(Boolean).join(".");
  return path;
}

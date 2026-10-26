"use client";

import type { ReactNode } from "react";
import { NextIntlClientProvider, useLocale } from "next-intl";
import { getIntlMessageFallback, onIntlError } from "./error-handling";

type IntlErrorHandlingProviderProps = {
  children: ReactNode;
};

// onError / getMessageFallback 是函数，不能从 Server Component 序列化下发，所以在客户端补上。
// 其余配置（locale、messages、formats、timeZone）从外层 NextIntlClientProvider 继承。
export function IntlErrorHandlingProvider(props: IntlErrorHandlingProviderProps) {
  // 客户端 Provider 必须显式传 locale，其余配置从外层继承。
  const locale = useLocale();

  return (
    <NextIntlClientProvider
      locale={locale}
      onError={onIntlError}
      getMessageFallback={getIntlMessageFallback}
    >
      {props.children}
    </NextIntlClientProvider>
  );
}

"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";

type ErrorViewProps = {
  error: Error & { digest?: string };
  onRetry: () => void;
};

// [locale]/error.tsx 与 admin/error.tsx 共用；文案来自 errors.page（后台固定 zh-CN）。
export function ErrorView(props: ErrorViewProps) {
  const error = props.error;
  const onRetry = props.onRetry;
  const t = useTranslations("errors.page");

  useEffect(() => {
    console.error("Unhandled application error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <section className="surface w-full max-w-md rounded-md p-6 text-center">
        <CircleAlert className="mx-auto text-danger" size={24} />
        <h1 className="mt-4 text-xl font-semibold">{t("title")}</h1>
        <p className="mt-2 text-sm text-muted">{t("description")}</p>
        <button className="btn-primary mx-auto mt-5" onClick={onRetry}>
          <RefreshCw size={16} />
          {t("retry")}
        </button>
      </section>
    </main>
  );
}

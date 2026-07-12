"use client";

import { CircleAlert, RefreshCw } from "lucide-react";
import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function ErrorPage(props: ErrorPageProps) {
  const error = props.error;
  const unstable_retry = props.unstable_retry;

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
        <h1 className="mt-4 text-xl font-semibold">页面暂时无法加载</h1>
        <p className="mt-2 text-sm text-muted">请稍后重试。若问题持续出现，请联系管理员。</p>
        <button className="btn-primary mx-auto mt-5" onClick={unstable_retry}>
          <RefreshCw size={16} />
          重新加载
        </button>
      </section>
    </main>
  );
}

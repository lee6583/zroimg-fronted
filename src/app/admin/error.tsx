"use client";

import { ErrorView } from "@/components/layout/error-view";

type ErrorPageProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

export default function ErrorPage(props: ErrorPageProps) {
  return <ErrorView error={props.error} onRetry={props.unstable_retry} />;
}

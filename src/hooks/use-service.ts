"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ServiceStatus = "idle" | "loading" | "success" | "error";

type UseServiceOptions<TData> = {
  initialData?: TData | null;
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
};

export type UseServiceResult<TData, TArgs extends unknown[]> = {
  run: (...args: TArgs) => Promise<TData | null>;
  loading: boolean;
  status: ServiceStatus;
  data: TData | null;
  error: Error | null;
  reset: () => void;
};

export function useService<TData, TArgs extends unknown[]>(
  service: (...args: TArgs) => Promise<TData>,
  options: UseServiceOptions<TData> = {},
): UseServiceResult<TData, TArgs> {
  const initialData = options.initialData ?? null;
  const mountedRef = useRef(false);
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);
  const [status, setStatus] = useState<ServiceStatus>("idle");
  const [data, setData] = useState<TData | null>(initialData);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    onSuccessRef.current = options.onSuccess;
    onErrorRef.current = options.onError;
  }, [options.onError, options.onSuccess]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setData(initialData);
    setError(null);
  }, [initialData]);

  const run = useCallback(
    async (...args: TArgs) => {
      setStatus("loading");
      setError(null);

      try {
        const result = await service(...args);
        if (mountedRef.current) {
          setData(result);
          setStatus("success");
        }
        onSuccessRef.current?.(result);
        return result;
      } catch (caught) {
        const nextError =
          caught instanceof Error ? caught : new Error("请求失败");
        if (mountedRef.current) {
          setError(nextError);
          setStatus("error");
        }
        onErrorRef.current?.(nextError);
        return null;
      }
    },
    [service],
  );

  return {
    run,
    loading: status === "loading",
    status,
    data,
    error,
    reset,
  };
}

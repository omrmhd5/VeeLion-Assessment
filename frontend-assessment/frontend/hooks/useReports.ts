"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getErrorMessage, requestJson } from "@/lib/apiClient";
import type { TasksSummary } from "@/types/api";

export function useReports() {
  const [summary, setSummary] = useState<TasksSummary | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);

  const fetchSummary = useCallback(async () => {
    const isRetry = hasLoadedRef.current;

    try {
      if (isRetry) {
        setIsRefreshing(true);
      }

      setError("");

      const data = await requestJson<TasksSummary>(
        "/api/reports/tasks-summary",
        {
          method: "GET",
        },
      );

      setSummary(data);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(getErrorMessage(err, "Could not load report right now."));
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  return {
    summary,
    isInitialLoading,
    isRefreshing,
    error,
    fetchSummary,
  };
}

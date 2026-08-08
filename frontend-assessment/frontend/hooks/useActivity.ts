"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getErrorMessage, requestJson } from "@/lib/apiClient";
import { filterActivity } from "@/lib/activityUtils";
import type { ActivityLog } from "@/types/api";

export function useActivity() {
  const [allActivity, setAllActivity] = useState<ActivityLog[]>([]);
  const [query, setQuery] = useState("");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const hasLoadedRef = useRef(false);

  const deferredQuery = useDeferredValue(query);

  const fetchActivity = useCallback(async () => {
    const isRetry = hasLoadedRef.current;

    try {
      if (isRetry) {
        setIsRefreshing(true);
      }

      setError("");

      const data = await requestJson<ActivityLog[]>("/api/activity", {
        method: "GET",
      });

      setAllActivity(data || []);
      hasLoadedRef.current = true;
    } catch (err) {
      setError(getErrorMessage(err, "Could not load activity right now."));
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const filteredActivity = useMemo(
    () => filterActivity(allActivity, deferredQuery),
    [allActivity, deferredQuery],
  );

  const stats = useMemo(
    () => ({
      total: allActivity.length,
      visible: filteredActivity.length,
    }),
    [allActivity.length, filteredActivity.length],
  );

  return {
    filteredActivity,
    query,
    isInitialLoading,
    isRefreshing,
    error,
    stats,
    setQuery,
    fetchActivity,
  };
}

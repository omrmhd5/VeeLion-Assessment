"use client";

import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getErrorMessage, requestJson } from "@/lib/apiClient";
import { filterActivity } from "@/lib/activityUtils";
import type { ActivityLog } from "@/types/api";

export function useActivity() {
  const [allActivity, setAllActivity] = useState<ActivityLog[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const deferredQuery = useDeferredValue(query);

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const data = await requestJson<ActivityLog[]>("/api/activity", {
        method: "GET",
      });

      setAllActivity(data || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load activity right now."));
    } finally {
      setLoading(false);
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
    loading,
    error,
    stats,
    setQuery,
    fetchActivity,
  };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage, requestJson } from "@/lib/apiClient";
import { applyCompleted, normalizeTask } from "@/lib/taskUtils";
import type {
  Task,
  TaskFilter,
  TaskResponse,
  TasksResponse,
} from "@/types/api";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const hasLoadedRef = useRef(false);

  const fetchTasks = useCallback(async () => {
    const isRetry = hasLoadedRef.current;

    try {
      if (isRetry) {
        setIsRefreshing(true);
      }

      setError("");

      const body = await requestJson<TasksResponse>("/api/tasks", {
        method: "GET",
      });

      setTasks(body.data.map(normalizeTask));
      hasLoadedRef.current = true;
    } catch (err) {
      setError(getErrorMessage(err, "Could not load tasks right now."));
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const updateTaskStatus = useCallback(
    async (taskId: string, completed: boolean) => {
      let previousTasks: Task[] = [];

      setUpdatingTaskId(taskId);
      setError("");

      setTasks((current) => {
        previousTasks = current;
        return current.map((task) =>
          task.id === taskId ? applyCompleted(task, completed) : task,
        );
      });

      try {
        const body = await requestJson<TaskResponse>(`/api/tasks/${taskId}`, {
          method: "PATCH",
          body: JSON.stringify({ completed }),
        });

        setTasks((current) =>
          current.map((task) =>
            task.id === taskId ? normalizeTask(body.data) : task,
          ),
        );
      } catch (err) {
        setTasks(previousTasks);
        setError(getErrorMessage(err, "Could not update task status."));
      } finally {
        setUpdatingTaskId("");
      }
    },
    [],
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "completed") {
      return tasks.filter((task) => task.completed);
    }

    if (filter === "pending") {
      return tasks.filter((task) => !task.completed);
    }

    return tasks;
  }, [tasks, filter]);

  return {
    tasks,
    filteredTasks,
    filter,
    isInitialLoading,
    isRefreshing,
    error,
    updatingTaskId,
    setFilter,
    fetchTasks,
    updateTaskStatus,
  };
}

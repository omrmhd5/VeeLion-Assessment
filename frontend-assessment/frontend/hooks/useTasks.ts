"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getErrorMessage, requestJson } from "@/lib/apiClient";
import type {
  Task,
  TaskFilter,
  TaskResponse,
  TasksResponse,
} from "@/types/api";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [updatingTaskId, setUpdatingTaskId] = useState<string>("");

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const body = await requestJson<TasksResponse>("/api/tasks", {
        method: "GET",
      });

      setTasks(body.data);
    } catch (error) {
      setError(getErrorMessage(error, "Could not load tasks right now."));
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTaskStatus = useCallback(
    async (taskId: string, completed: boolean) => {
      try {
        setUpdatingTaskId(taskId);
        setError("");

        const body = await requestJson<TaskResponse>(`/api/tasks/${taskId}`, {
          method: "PATCH",
          body: JSON.stringify({ completed }),
        });

        setTasks((previous) =>
          previous.map((task) => (task.id === taskId ? body.data : task)),
        );
      } catch (error) {
        setError(getErrorMessage(error, "Could not update task status."));
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
    loading,
    error,
    updatingTaskId,
    setFilter,
    fetchTasks,
    updateTaskStatus,
  };
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getErrorMessage, requestJson } from "@/lib/apiClient";
import { applyStatus, normalizeTask, statusToPatch } from "@/lib/taskUtils";
import type {
  Task,
  TaskFilter,
  TaskResponse,
  TasksResponse,
  TaskStatus,
} from "@/types/api";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState("");
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

  const fetchTaskById = useCallback(async (taskId: string) => {
    const body = await requestJson<TaskResponse>(`/api/tasks/${taskId}`, {
      method: "GET",
    });

    return normalizeTask(body.data);
  }, []);

  const createTask = useCallback(async (title: string) => {
    setIsCreating(true);
    setError("");

    try {
      const body = await requestJson<TaskResponse>("/api/tasks", {
        method: "POST",
        body: JSON.stringify({ title }),
      });

      setTasks((current) => [...current, normalizeTask(body.data)]);
    } catch (err) {
      setError(getErrorMessage(err, "Could not create task."));
    } finally {
      setIsCreating(false);
    }
  }, []);

  const updateTaskStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      let previousTasks: Task[] = [];
      const patch = statusToPatch(status);

      setUpdatingTaskId(taskId);
      setError("");

      setTasks((current) => {
        previousTasks = current;
        return current.map((task) =>
          task.id === taskId ? applyStatus(task, status) : task,
        );
      });

      try {
        const body = await requestJson<TaskResponse>(`/api/tasks/${taskId}`, {
          method: "PATCH",
          body: JSON.stringify(patch),
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

  const updateTaskTitle = useCallback(async (taskId: string, title: string) => {
    let previousTasks: Task[] = [];

    setUpdatingTaskId(taskId);
    setError("");

    setTasks((current) => {
      previousTasks = current;
      return current.map((task) =>
        task.id === taskId ? { ...task, title } : task,
      );
    });

    try {
      const body = await requestJson<TaskResponse>(`/api/tasks/${taskId}`, {
        method: "PATCH",
        body: JSON.stringify({ title }),
      });

      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? normalizeTask(body.data) : task,
        ),
      );
    } catch (err) {
      setTasks(previousTasks);
      setError(getErrorMessage(err, "Could not update task title."));
      throw err;
    } finally {
      setUpdatingTaskId("");
    }
  }, []);

  const deleteTask = useCallback(async (taskId: string) => {
    let previousTasks: Task[] = [];

    setDeletingTaskId(taskId);
    setError("");

    setTasks((current) => {
      previousTasks = current;
      return current.filter((task) => task.id !== taskId);
    });

    try {
      await requestJson<void>(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });
    } catch (err) {
      setTasks(previousTasks);
      setError(getErrorMessage(err, "Could not delete task."));
    } finally {
      setDeletingTaskId("");
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "completed") {
      return tasks.filter((task) => task.status === "done");
    }

    if (filter === "pending") {
      return tasks.filter((task) => task.status === "todo");
    }

    if (filter === "in-progress") {
      return tasks.filter((task) => task.status === "in-progress");
    }

    return tasks;
  }, [tasks, filter]);

  return {
    tasks,
    filteredTasks,
    filter,
    isInitialLoading,
    isRefreshing,
    isCreating,
    error,
    updatingTaskId,
    deletingTaskId,
    setFilter,
    fetchTasks,
    fetchTaskById,
    createTask,
    updateTaskStatus,
    updateTaskTitle,
    deleteTask,
  };
}

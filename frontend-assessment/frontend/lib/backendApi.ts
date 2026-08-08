import { BACKEND_BASE_URL } from "@/lib/constants";
import type {
  ActivityLog,
  ErrorResponse,
  PatchTaskRequest,
  Task,
  TaskResponse,
  TasksResponse,
  TasksSummary,
  TaskStatus,
} from "@/types/api";

function buildBackendUrl(path: string): string {
  return `${BACKEND_BASE_URL}${path}`;
}

async function parseError(response: Response): Promise<string> {
  let fallback = `Request failed with status ${response.status}`;

  try {
    const body = (await response.json()) as ErrorResponse;
    return body.error?.message || fallback;
  } catch {
    return fallback;
  }
}

export async function getTasksFromBackend(): Promise<Task[]> {
  try {
    const response = await fetch(buildBackendUrl("/tasks"), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const body = (await response.json()) as TasksResponse;
    return body.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to load tasks.",
    );
  }
}

export async function getTaskByIdFromBackend(taskId: string): Promise<Task> {
  try {
    const response = await fetch(buildBackendUrl(`/tasks/${taskId}`), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const body = (await response.json()) as TaskResponse;
    return body.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to load task.",
    );
  }
}

export async function createTaskInBackend(payload: {
  title: string;
  completed?: boolean;
}): Promise<Task> {
  try {
    const response = await fetch(buildBackendUrl("/tasks"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const body = (await response.json()) as TaskResponse;
    return body.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to create task.",
    );
  }
}

export async function updateTaskInBackend(
  taskId: string,
  updates: PatchTaskRequest,
): Promise<Task> {
  try {
    const response = await fetch(buildBackendUrl(`/tasks/${taskId}`), {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    const body = (await response.json()) as TaskResponse;
    return body.data;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to update task.",
    );
  }
}

export async function deleteTaskFromBackend(taskId: string): Promise<void> {
  try {
    const response = await fetch(buildBackendUrl(`/tasks/${taskId}`), {
      method: "DELETE",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to delete task.",
    );
  }
}

export async function createActivityInBackend(payload: {
  action: string;
  info: string;
}): Promise<ActivityLog> {
  try {
    const response = await fetch(buildBackendUrl("/activity"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    return (await response.json()) as ActivityLog;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to create activity log.",
    );
  }
}

export async function getActivityFromBackend(): Promise<ActivityLog[]> {
  try {
    const response = await fetch(buildBackendUrl("/activity"), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    return (await response.json()) as ActivityLog[];
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to load activity logs.",
    );
  }
}

export async function getTasksSummaryFromBackend(): Promise<TasksSummary> {
  try {
    const response = await fetch(buildBackendUrl("/reports/tasks-summary"), {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(await parseError(response));
    }

    return (await response.json()) as TasksSummary;
  } catch (error) {
    throw new Error(
      error instanceof Error ? error.message : "Failed to load tasks summary.",
    );
  }
}

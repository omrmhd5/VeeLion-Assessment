import type { PatchTaskRequest, Task, TaskStatus } from "@/types/api";

export function normalizeTask(task: Task): Task {
  const status: TaskStatus = task.status ?? (task.completed ? "done" : "todo");

  return {
    ...task,
    status,
    completed: status === "done",
  };
}

export function statusToPatch(status: TaskStatus): PatchTaskRequest {
  if (status === "done") {
    return { completed: true, status: "done" };
  }

  if (status === "in-progress") {
    return { completed: false, status: "in-progress" };
  }

  return { completed: false, status: "todo" };
}

export function applyStatus(task: Task, status: TaskStatus): Task {
  return normalizeTask({
    ...task,
    ...statusToPatch(status),
  });
}

export function applyCompleted(task: Task, completed: boolean): Task {
  return applyStatus(task, completed ? "done" : "todo");
}

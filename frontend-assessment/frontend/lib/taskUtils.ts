import type { Task, TaskStatus } from "@/types/api";

export function normalizeTask(task: Task): Task {
  const status: TaskStatus = task.status ?? (task.completed ? "done" : "todo");

  return {
    ...task,
    status,
  };
}

export function applyCompleted(task: Task, completed: boolean): Task {
  return normalizeTask({
    ...task,
    completed,
    status: completed ? "done" : "todo",
  });
}

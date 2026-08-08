import { createActivityInBackend } from "@/lib/backendApi";

export type TaskActivityAction =
  | "task.created"
  | "task.updated"
  | "task.deleted";

export async function logTaskActivity(
  action: TaskActivityAction,
  taskId: string,
): Promise<void> {
  await createActivityInBackend({
    action,
    info: taskId,
  });
}

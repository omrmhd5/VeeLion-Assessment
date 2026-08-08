import type { Task, TaskStatus } from "@/types/api";
import { TaskItem } from "@/components/tasks/TaskItem";

type TaskListProps = {
  tasks: Task[];
  updatingTaskId: string;
  deletingTaskId: string;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
  onUpdateTitle: (task: Task, title: string) => Promise<void>;
};

export function TaskList({
  tasks,
  updatingTaskId,
  deletingTaskId,
  onStatusChange,
  onDelete,
  onUpdateTitle,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <section className="card card--padded">
        <p className="state-message">No tasks match this filter.</p>
      </section>
    );
  }

  return (
    <section aria-label="Task list">
      <ul className="item-list">
        {tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            busy={updatingTaskId === task.id}
            deleting={deletingTaskId === task.id}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onUpdateTitle={onUpdateTitle}
          />
        ))}
      </ul>
    </section>
  );
}

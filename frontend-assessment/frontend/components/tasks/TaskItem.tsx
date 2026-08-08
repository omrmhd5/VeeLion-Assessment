import type { Task } from "@/types/api";

type TaskItemProps = {
  task: Task;
  busy: boolean;
  onToggle: (task: Task) => void;
};

function getStatusPresentation(task: Task) {
  if (task.status === "in-progress") {
    return {
      itemClass: "task-item--progress",
      badgeClass: "badge badge--progress",
      label: "In progress",
    };
  }

  if (task.completed || task.status === "done") {
    return {
      itemClass: "task-item--done",
      badgeClass: "badge badge--done",
      label: "Done",
    };
  }

  return {
    itemClass: "task-item--todo",
    badgeClass: "badge badge--todo",
    label: "To do",
  };
}

export function TaskItem({ task, busy, onToggle }: TaskItemProps) {
  const status = getStatusPresentation(task);
  const buttonClass = task.completed
    ? "button button--warning"
    : "button button--success";

  return (
    <li
      className={`card card--padded-sm task-item ${status.itemClass}`}>
      <div className="task-item__header">
        <p className="task-item__title">{task.title}</p>
        <span className={status.badgeClass}>{status.label}</span>
      </div>

      <small className="text-meta">
        Updated: {new Date(task.updatedAt).toLocaleString()}
      </small>

      <div>
        <button
          type="button"
          className={busy ? `${buttonClass} button--busy` : buttonClass}
          onClick={() => onToggle(task)}
          disabled={busy}
          aria-busy={busy}
          aria-label={`Mark ${task.title} as ${task.completed ? "pending" : "completed"}`}>
          {task.completed ? "Mark as Pending" : "Mark as Completed"}
        </button>
      </div>
    </li>
  );
}

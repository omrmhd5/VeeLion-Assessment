"use client";

import { FormEvent, useState } from "react";
import type { Task, TaskStatus } from "@/types/api";

type TaskItemProps = {
  task: Task;
  busy: boolean;
  deleting: boolean;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onDelete: (task: Task) => void;
  onUpdateTitle: (task: Task, title: string) => Promise<void>;
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

function CheckIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true">
      <path
        d="M20 6 9 17l-5-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ProgressIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true">
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true">
      <path
        d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true">
      <path
        d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TaskItem({
  task,
  busy,
  deleting,
  onStatusChange,
  onDelete,
  onUpdateTitle,
}: TaskItemProps) {
  const status = getStatusPresentation(task);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);
  const isDisabled = busy || deleting;
  const isDone = task.status === "done";
  const isInProgress = task.status === "in-progress";

  const handleComplete = () => {
    onStatusChange(task, isDone ? "todo" : "done");
  };

  const handleProgress = () => {
    onStatusChange(task, isInProgress ? "todo" : "in-progress");
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = draftTitle.trim();
    if (!trimmed || trimmed === task.title) {
      setDraftTitle(task.title);
      setIsEditing(false);
      return;
    }

    try {
      await onUpdateTitle(task, trimmed);
      setIsEditing(false);
    } catch {
      setDraftTitle(task.title);
    }
  };

  return (
    <li className={`card card--padded-sm task-item ${status.itemClass}`}>
      <div className="task-item__header">
        {isEditing ? (
          <form className="task-item__edit-form" onSubmit={handleEditSubmit}>
            <input
              className="input"
              value={draftTitle}
              onChange={(event) => setDraftTitle(event.target.value)}
              disabled={isDisabled}
              aria-label={`Edit title for ${task.title}`}
              autoFocus
            />
            <div className="button-row">
              <button
                type="submit"
                className="button button--primary"
                disabled={isDisabled || draftTitle.trim().length < 2}>
                Save
              </button>
              <button
                type="button"
                className="button"
                disabled={isDisabled}
                onClick={() => {
                  setDraftTitle(task.title);
                  setIsEditing(false);
                }}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <p className="task-item__title">{task.title}</p>
        )}
        <span className={status.badgeClass}>{status.label}</span>
      </div>

      <small className="text-meta">
        Updated: {new Date(task.updatedAt).toLocaleString()}
      </small>

      {!isEditing ? (
        <div className="task-item__footer">
          <div className="task-item__status-actions">
            <button
              type="button"
              className={
                busy
                  ? "icon-btn icon-btn--success icon-btn--active button--busy"
                  : isDone
                    ? "icon-btn icon-btn--success icon-btn--active"
                    : "icon-btn icon-btn--success"
              }
              onClick={handleComplete}
              disabled={isDisabled}
              aria-busy={busy}
              aria-pressed={isDone}
              title={isDone ? "Mark as to do" : "Mark as completed"}
              aria-label={
                isDone
                  ? `Mark ${task.title} as to do`
                  : `Mark ${task.title} as completed`
              }>
              <CheckIcon />
            </button>

            <button
              type="button"
              className={
                busy
                  ? "icon-btn icon-btn--info icon-btn--active button--busy"
                  : isInProgress
                    ? "icon-btn icon-btn--info icon-btn--active"
                    : "icon-btn icon-btn--info"
              }
              onClick={handleProgress}
              disabled={isDisabled}
              aria-busy={busy}
              aria-pressed={isInProgress}
              title={isInProgress ? "Stop in progress" : "Mark as in progress"}
              aria-label={
                isInProgress
                  ? `Stop progress on ${task.title}`
                  : `Mark ${task.title} as in progress`
              }>
              <ProgressIcon />
            </button>
          </div>

          <div className="task-item__meta-actions">
            <button
              type="button"
              className="icon-btn icon-btn--edit"
              onClick={() => setIsEditing(true)}
              disabled={isDisabled}
              title="Edit title"
              aria-label={`Edit ${task.title}`}>
              <PencilIcon />
            </button>

            <button
              type="button"
              className={
                deleting
                  ? "icon-btn icon-btn--danger button--busy"
                  : "icon-btn icon-btn--danger"
              }
              onClick={() => onDelete(task)}
              disabled={isDisabled}
              aria-busy={deleting}
              title="Delete task"
              aria-label={`Delete ${task.title}`}>
              <TrashIcon />
            </button>
          </div>
        </div>
      ) : null}
    </li>
  );
}

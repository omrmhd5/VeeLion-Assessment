"use client";

import { useTasks } from "@/hooks/useTasks";
import type { Task, TaskStatus } from "@/types/api";
import { StatusFilter } from "@/components/tasks/StatusFilter";
import { TaskCreateForm } from "@/components/tasks/TaskCreateForm";
import { TaskList } from "@/components/tasks/TaskList";

export function TaskDashboard() {
  const {
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
    createTask,
    updateTaskStatus,
    updateTaskTitle,
    deleteTask,
  } = useTasks();

  const handleStatusChange = (task: Task, status: TaskStatus) => {
    updateTaskStatus(task.id, status);
  };

  const handleDelete = (task: Task) => {
    deleteTask(task.id);
  };

  const handleUpdateTitle = (task: Task, title: string) => {
    return updateTaskTitle(task.id, title);
  };

  const showList = !isInitialLoading;

  return (
    <section className="stack">
      <header className="card card--padded page-header">
        <h1 className="page-header__title">Task Dashboard</h1>
        <p className="page-header__lead">
          Create, edit, filter, and complete tasks without leaving the page.
        </p>
      </header>

      <TaskCreateForm busy={isCreating} onCreate={createTask} />

      <StatusFilter value={filter} onChange={setFilter} />

      {isInitialLoading ? (
        <section
          className="card card--padded loading-card"
          aria-busy="true"
          role="status"
          aria-live="polite">
          <div className="skeleton skeleton--title" aria-hidden="true" />
          <div className="skeleton skeleton--line" aria-hidden="true" />
          <div className="skeleton skeleton--short" aria-hidden="true" />
          <p className="state-message">Loading tasks...</p>
        </section>
      ) : null}

      {error ? (
        <section className="card card--padded card--error" role="alert">
          <p className="error-message">
            {error}
            {isRefreshing ? " Refreshing..." : ""}
          </p>
          <button
            type="button"
            className="button button--primary"
            onClick={fetchTasks}
            disabled={isRefreshing}>
            Retry
          </button>
        </section>
      ) : null}

      {showList && (!error || filteredTasks.length > 0) ? (
        <TaskList
          tasks={filteredTasks}
          updatingTaskId={updatingTaskId}
          deletingTaskId={deletingTaskId}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
          onUpdateTitle={handleUpdateTitle}
        />
      ) : null}
    </section>
  );
}

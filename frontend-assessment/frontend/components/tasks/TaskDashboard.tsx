"use client";

import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/api";
import { StatusFilter } from "@/components/tasks/StatusFilter";
import { TaskList } from "@/components/tasks/TaskList";

export function TaskDashboard() {
  const {
    filteredTasks,
    filter,
    isInitialLoading,
    isRefreshing,
    error,
    updatingTaskId,
    setFilter,
    fetchTasks,
    updateTaskStatus,
  } = useTasks();

  const handleToggle = (task: Task) => {
    updateTaskStatus(task.id, !task.completed);
  };

  const showList = !isInitialLoading;

  return (
    <section className="stack">
      <header className="card card--padded page-header">
        <h1 className="page-header__title">Task Dashboard</h1>
        <p className="page-header__lead">
          Filter tasks and mark them complete without leaving the page.
        </p>
      </header>

      <StatusFilter value={filter} onChange={setFilter} />

      {isInitialLoading ? (
        <section className="card card--padded loading-card" aria-busy="true">
          <div className="skeleton skeleton--title" aria-hidden="true" />
          <div className="skeleton skeleton--line" aria-hidden="true" />
          <div className="skeleton skeleton--short" aria-hidden="true" />
          <p className="state-message">Loading tasks...</p>
        </section>
      ) : null}

      {error ? (
        <section className="card card--padded card--error">
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
          onToggle={handleToggle}
        />
      ) : null}
    </section>
  );
}

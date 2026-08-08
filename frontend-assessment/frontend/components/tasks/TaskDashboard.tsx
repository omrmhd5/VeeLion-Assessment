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
      <header className="card" style={{ padding: "1rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Task Dashboard</h1>
      </header>

      <StatusFilter value={filter} onChange={setFilter} />

      {isInitialLoading ? (
        <section className="card" style={{ padding: "1rem" }}>
          <p style={{ margin: 0 }}>Loading tasks...</p>
        </section>
      ) : null}

      {error ? (
        <section
          className="card"
          style={{
            padding: "1rem",
            borderColor: "#e3b4c0",
            background: "#fff8fa",
          }}>
          <p
            style={{
              marginTop: 0,
              marginBottom: "0.75rem",
              color: "var(--danger)",
            }}>
            {error}
            {isRefreshing ? " Refreshing..." : ""}
          </p>
          <button
            type="button"
            className="button"
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

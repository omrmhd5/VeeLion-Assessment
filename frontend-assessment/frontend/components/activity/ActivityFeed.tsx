"use client";

import { useActivity } from "@/hooks/useActivity";
import { ActivityList } from "@/components/activity/ActivityList";
import { ActivitySearch } from "@/components/activity/ActivitySearch";

export function ActivityFeed() {
  const {
    filteredActivity,
    query,
    loading,
    error,
    stats,
    setQuery,
    fetchActivity,
  } = useActivity();

  return (
    <section className="stack">
      <header className="card" style={{ padding: "1rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Activity Feed</h1>
        <ActivitySearch value={query} onChange={setQuery} />
      </header>

      {!loading && !error ? (
        <section className="card" style={{ padding: "1rem" }}>
          <small style={{ color: "var(--muted)" }}>
            Total: {stats.total} | Visible: {stats.visible}
          </small>
        </section>
      ) : null}

      {loading ? (
        <section className="card" style={{ padding: "1rem" }}>
          <p style={{ margin: 0 }}>Loading activity...</p>
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
          </p>
          <button type="button" className="button" onClick={fetchActivity}>
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !error ? (
        <ActivityList
          activities={filteredActivity}
          hasSearchQuery={query.trim().length > 0}
        />
      ) : null}
    </section>
  );
}

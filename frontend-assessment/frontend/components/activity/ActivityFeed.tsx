"use client";

import { useActivity } from "@/hooks/useActivity";
import { ActivityList } from "@/components/activity/ActivityList";
import { ActivitySearch } from "@/components/activity/ActivitySearch";

export function ActivityFeed() {
  const {
    filteredActivity,
    query,
    isInitialLoading,
    isRefreshing,
    error,
    stats,
    setQuery,
    fetchActivity,
  } = useActivity();

  const showContent = !isInitialLoading;

  return (
    <section className="stack">
      <header className="card card--padded page-header">
        <h1 className="page-header__title">Activity Feed</h1>
        <p className="page-header__lead">
          Search the log to find specific actions and updates.
        </p>
        <ActivitySearch value={query} onChange={setQuery} />
      </header>

      {showContent && !error ? (
        <section className="card card--padded-sm card--flat">
          <div className="stats-bar font-mono">
            <span className="stats-bar__pill">
              Total: <strong>{stats.total}</strong>
            </span>
            <span className="stats-bar__pill stats-bar__pill--visible">
              Visible: <strong>{stats.visible}</strong>
            </span>
          </div>
        </section>
      ) : null}

      {isInitialLoading ? (
        <section
          className="card card--padded loading-card"
          aria-busy="true"
          role="status"
          aria-live="polite">
          <div className="skeleton skeleton--title" aria-hidden="true" />
          <div className="skeleton skeleton--line" aria-hidden="true" />
          <p className="state-message">Loading activity...</p>
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
            onClick={fetchActivity}
            disabled={isRefreshing}>
            Retry
          </button>
        </section>
      ) : null}

      {showContent && (!error || stats.total > 0) ? (
        <ActivityList
          activities={filteredActivity}
          hasSearchQuery={query.trim().length > 0}
        />
      ) : null}
    </section>
  );
}

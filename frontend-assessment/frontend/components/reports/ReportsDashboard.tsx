"use client";

import { useReports } from "@/hooks/useReports";
import { StatusBreakdown } from "@/components/reports/StatusBreakdown";

export function ReportsDashboard() {
  const { summary, isInitialLoading, isRefreshing, error, fetchSummary } =
    useReports();

  const showSummary = !isInitialLoading && (!error || summary);

  return (
    <section className="stack">
      <header className="card card--padded page-header">
        <h1 className="page-header__title">Reports</h1>
        <p className="page-header__lead">
          Task and activity summary from the Reports API.
        </p>
      </header>

      {isInitialLoading ? (
        <section
          className="card card--padded loading-card"
          aria-busy="true"
          role="status"
          aria-live="polite">
          <div className="skeleton skeleton--title" aria-hidden="true" />
          <div className="skeleton skeleton--line" aria-hidden="true" />
          <p className="state-message">Loading report...</p>
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
            onClick={fetchSummary}
            disabled={isRefreshing}>
            Retry
          </button>
        </section>
      ) : null}

      {showSummary && summary ? (
        <>
          <section className="stats-grid">
            <article className="card card--padded stat-card stat-card--tasks">
              <h2 className="section-title">Total tasks</h2>
              <p className="stat-card__value">{summary.total}</p>
            </article>

            <article className="card card--padded stat-card stat-card--activity">
              <h2 className="section-title">Recent activity</h2>
              <p className="stat-card__value">{summary.recentActivityCount}</p>
              <small className="text-meta">Activity log entries</small>
            </article>
          </section>

          <StatusBreakdown byStatus={summary.byStatus} />
        </>
      ) : null}
    </section>
  );
}

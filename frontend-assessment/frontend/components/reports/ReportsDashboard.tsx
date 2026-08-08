"use client";

import { useReports } from "@/hooks/useReports";
import { StatusBreakdown } from "@/components/reports/StatusBreakdown";

export function ReportsDashboard() {
  const { summary, loading, error, fetchSummary } = useReports();

  return (
    <section className="stack">
      <header className="card" style={{ padding: "1rem" }}>
        <h1 style={{ marginTop: 0, marginBottom: "0.5rem" }}>Reports</h1>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          Task and activity summary from the Reports API.
        </p>
      </header>

      {loading ? (
        <section className="card" style={{ padding: "1rem" }}>
          <p style={{ margin: 0 }}>Loading report...</p>
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
          <button type="button" className="button" onClick={fetchSummary}>
            Retry
          </button>
        </section>
      ) : null}

      {!loading && !error && summary ? (
        <>
          <section className="card" style={{ padding: "1rem" }}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: "0.5rem",
                fontSize: "1rem",
              }}>
              Total tasks
            </h2>
            <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
              {summary.total}
            </p>
          </section>

          <StatusBreakdown byStatus={summary.byStatus} />

          <section className="card" style={{ padding: "1rem" }}>
            <h2
              style={{
                marginTop: 0,
                marginBottom: "0.5rem",
                fontSize: "1rem",
              }}>
              Recent activity
            </h2>
            <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
              {summary.recentActivityCount}
            </p>
            <small style={{ color: "var(--muted)" }}>
              Activity log entries
            </small>
          </section>
        </>
      ) : null}
    </section>
  );
}

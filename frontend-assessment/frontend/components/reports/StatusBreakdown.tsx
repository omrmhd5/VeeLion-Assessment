import type { TasksByStatus } from "@/types/api";

const STATUS_ROWS: Array<{ key: keyof TasksByStatus; label: string }> = [
  { key: "todo", label: "To do" },
  { key: "in-progress", label: "In progress" },
  { key: "done", label: "Done" },
];

type StatusBreakdownProps = {
  byStatus: TasksByStatus;
};

export function StatusBreakdown({ byStatus }: StatusBreakdownProps) {
  return (
    <section
      className="card"
      style={{ padding: "1rem" }}
      aria-label="Tasks by status">
      <h2 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1rem" }}>
        Tasks by status
      </h2>
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "grid",
          gap: "0.5rem",
        }}>
        {STATUS_ROWS.map((row) => (
          <li
            key={row.key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderBottom: "1px solid var(--border)",
              paddingBottom: "0.5rem",
            }}>
            <span>{row.label}</span>
            <span className="badge">{byStatus[row.key]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

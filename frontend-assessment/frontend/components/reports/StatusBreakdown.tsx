import type { TasksByStatus } from "@/types/api";

const STATUS_ROWS: Array<{
  key: keyof TasksByStatus;
  label: string;
  badgeClass: string;
}> = [
  { key: "todo", label: "To do", badgeClass: "badge badge--todo badge--count" },
  {
    key: "in-progress",
    label: "In progress",
    badgeClass: "badge badge--progress badge--count",
  },
  { key: "done", label: "Done", badgeClass: "badge badge--done badge--count" },
];

type StatusBreakdownProps = {
  byStatus: TasksByStatus;
};

export function StatusBreakdown({ byStatus }: StatusBreakdownProps) {
  return (
    <section className="card card--padded" aria-label="Tasks by status">
      <h2 className="section-title">Tasks by status</h2>
      <ul className="status-breakdown__list">
        {STATUS_ROWS.map((row) => (
          <li key={row.key} className="status-breakdown__row">
            <span>{row.label}</span>
            <span className={row.badgeClass}>{byStatus[row.key]}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

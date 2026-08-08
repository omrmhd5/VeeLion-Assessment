import type { ActivityLog } from "@/types/api";
import { ActivityItem } from "@/components/activity/ActivityItem";

type ActivityListProps = {
  activities: ActivityLog[];
  hasSearchQuery: boolean;
};

export function ActivityList({
  activities,
  hasSearchQuery,
}: ActivityListProps) {
  if (activities.length === 0) {
    return (
      <section className="card" style={{ padding: "1rem" }}>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {hasSearchQuery
            ? "No activity matches this search."
            : "No activity logged yet."}
        </p>
      </section>
    );
  }

  return (
    <section
      className="card"
      style={{ padding: "1rem" }}
      aria-label="Activity list">
      <ul
        style={{
          margin: 0,
          padding: 0,
          listStyle: "none",
          display: "grid",
          gap: "0.7rem",
        }}>
        {activities.map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

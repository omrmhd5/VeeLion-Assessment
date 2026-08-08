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
      <section className="card card--padded">
        <p className="state-message">
          {hasSearchQuery
            ? "No activity matches this search."
            : "No activity logged yet."}
        </p>
      </section>
    );
  }

  return (
    <section className="card card--padded" aria-label="Activity list">
      <ul className="activity-list">
        {activities.map((item) => (
          <ActivityItem key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

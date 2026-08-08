import { formatActivityTime } from "@/lib/activityUtils";
import type { ActivityLog } from "@/types/api";

type ActivityItemProps = {
  item: ActivityLog;
};

export function ActivityItem({ item }: ActivityItemProps) {
  return (
    <li className="activity-item">
      <div className="activity-item__action">
        {item.action || "(no action)"}
      </div>
      <div className="activity-item__info">{item.info || "(no info)"}</div>
      <small className="text-meta">{formatActivityTime(item.when)}</small>
    </li>
  );
}

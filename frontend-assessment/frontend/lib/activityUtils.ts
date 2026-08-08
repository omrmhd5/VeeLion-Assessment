import type { ActivityLog } from "@/types/api";

export function formatActivityTime(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function filterActivity(
  items: ActivityLog[],
  query: string,
): ActivityLog[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return items;
  }

  const lower = trimmed.toLowerCase();
  return items.filter(
    (item) =>
      (item.action || "").toLowerCase().includes(lower) ||
      (item.info || "").toLowerCase().includes(lower),
  );
}

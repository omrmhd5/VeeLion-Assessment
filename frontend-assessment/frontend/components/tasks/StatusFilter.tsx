import type { TaskFilter } from "@/types/api";

const FILTERS: Array<{ label: string; value: TaskFilter }> = [
  { label: "All", value: "all" },
  { label: "Done", value: "completed" },
  { label: "To do", value: "pending" },
];

const FILTER_BUTTON_CLASS: Record<TaskFilter, string> = {
  all: "button--filter-all",
  completed: "button--filter-done",
  pending: "button--filter-todo",
};

type StatusFilterProps = {
  value: TaskFilter;
  onChange: (value: TaskFilter) => void;
};

export function StatusFilter({ value, onChange }: StatusFilterProps) {
  return (
    <section
      aria-label="Filter tasks by status"
      className="card card--padded-sm card--flat">
      <div className="button-row">
        {FILTERS.map((filter) => {
          const active = filter.value === value;

          return (
            <button
              key={filter.value}
              type="button"
              className={
                active
                  ? `button ${FILTER_BUTTON_CLASS[filter.value]} button--filter-active`
                  : "button"
              }
              onClick={() => onChange(filter.value)}
              aria-pressed={active}>
              {filter.label}
            </button>
          );
        })}
      </div>
    </section>
  );
}

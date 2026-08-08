export type TaskStatus = "todo" | "in-progress" | "done";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  status?: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type ActivityLog = {
  id: string;
  action?: string;
  info?: string;
  when: string;
};

export type TasksResponse = {
  data: Task[];
};

export type TaskResponse = {
  data: Task;
};

export type ErrorResponse = {
  error?: {
    message?: string;
  };
};

export type TaskFilter = "all" | "completed" | "pending";

export type TasksByStatus = {
  todo: number;
  "in-progress": number;
  done: number;
};

export type TasksSummary = {
  total: number;
  byStatus: TasksByStatus;
  recentActivityCount: number;
};

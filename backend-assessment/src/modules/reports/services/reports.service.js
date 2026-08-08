const activityService = require("../../activity/services/activity.service");
const tasksService = require("../../tasks/services/tasks.service");

const RECENT_ACTIVITY_WINDOW_MS = 24 * 60 * 60 * 1000;

function countTasksByStatus(tasks) {
  const byStatus = {
    todo: 0,
    "in-progress": 0,
    done: 0,
  };

  for (const task of tasks) {
    byStatus[task.status] += 1;
  }

  return byStatus;
}

function countRecentActivity(activities) {
  const cutoff = Date.now() - RECENT_ACTIVITY_WINDOW_MS;

  return activities.filter((activity) => {
    const occurredAt = new Date(activity.when).getTime();
    return !Number.isNaN(occurredAt) && occurredAt >= cutoff;
  }).length;
}

async function getTasksSummary() {
  const [tasks, activities] = await Promise.all([
    tasksService.getAllTasks(),
    activityService.getAllActivity(),
  ]);

  return {
    total: tasks.length,
    byStatus: countTasksByStatus(tasks),
    recentActivityCount: countRecentActivity(activities),
  };
}

module.exports = {
  getTasksSummary,
};

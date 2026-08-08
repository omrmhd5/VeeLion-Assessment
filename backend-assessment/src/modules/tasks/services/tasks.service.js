const path = require("node:path");

const { createId } = require("../../../utils/id");
const { readJsonArray, writeJsonArray } = require("../../../utils/jsonStore");
const HttpError = require("../../../utils/httpError");

const TASKS_FILE_PATH = path.join(process.cwd(), "data", "tasks.json");

function syncStatusAndCompleted(task) {
  if (Object.hasOwn(task, "status")) {
    task.completed = task.status === "done";
    return task;
  }

  if (Object.hasOwn(task, "completed")) {
    task.status = task.completed ? "done" : "todo";
  }

  return task;
}

function buildTaskRecord(payload) {
  const now = new Date().toISOString();
  const task = {
    id: createId(),
    title: payload.title,
    status: payload.status,
    completed: payload.completed,
    createdAt: now,
    updatedAt: now,
  };

  return syncStatusAndCompleted(task);
}

async function getAllTasks() {
  return readJsonArray(TASKS_FILE_PATH);
}

async function getTaskById(taskId) {
  const tasks = await readJsonArray(TASKS_FILE_PATH);
  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    throw new HttpError(404, "Task not found.");
  }

  return task;
}

async function createTask(payload) {
  const tasks = await readJsonArray(TASKS_FILE_PATH);
  const newTask = buildTaskRecord(payload);

  tasks.push(newTask);
  await writeJsonArray(TASKS_FILE_PATH, tasks);

  return newTask;
}

async function updateTask(taskId, updates) {
  const tasks = await readJsonArray(TASKS_FILE_PATH);
  const taskIndex = tasks.findIndex((item) => item.id === taskId);

  if (taskIndex === -1) {
    throw new HttpError(404, "Task not found.");
  }

  const existingTask = tasks[taskIndex];
  const updatedTask = syncStatusAndCompleted({
    ...existingTask,
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  tasks[taskIndex] = updatedTask;
  await writeJsonArray(TASKS_FILE_PATH, tasks);

  return updatedTask;
}

async function deleteTask(taskId) {
  const tasks = await readJsonArray(TASKS_FILE_PATH);
  const taskIndex = tasks.findIndex((item) => item.id === taskId);

  if (taskIndex === -1) {
    throw new HttpError(404, "Task not found.");
  }

  const [removedTask] = tasks.splice(taskIndex, 1);
  await writeJsonArray(TASKS_FILE_PATH, tasks);

  return removedTask;
}

module.exports = {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
};

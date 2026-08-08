const path = require("node:path");

const { createId } = require("../../../utils/id");
const { readJsonArray, writeJsonArray } = require("../../../utils/jsonStore");

const ACTIVITY_FILE_PATH = path.join(process.cwd(), "data", "activity.json");

function buildActivityRecord(payload) {
  return {
    id: createId(),
    action: payload.action,
    info: payload.info,
    when: new Date().toISOString(),
  };
}

async function getAllActivity() {
  return readJsonArray(ACTIVITY_FILE_PATH);
}

async function createActivity(payload) {
  const activities = await readJsonArray(ACTIVITY_FILE_PATH);
  const activity = buildActivityRecord(payload);

  activities.push(activity);
  await writeJsonArray(ACTIVITY_FILE_PATH, activities);

  return activity;
}

module.exports = {
  getAllActivity,
  createActivity,
};

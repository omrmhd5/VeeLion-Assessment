const activityService = require("../services/activity.service");
const { validateCreateActivity } = require("../utils/activityValidator");

async function listActivity(req, res) {
  const activities = await activityService.getAllActivity();
  res.status(200).json({ data: activities });
}

async function createActivity(req, res) {
  const payload = validateCreateActivity(req.body);
  const activity = await activityService.createActivity(payload);

  res.status(201).json({ data: activity });
}

module.exports = {
  listActivity,
  createActivity,
};

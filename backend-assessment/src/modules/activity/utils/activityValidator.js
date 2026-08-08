const HttpError = require("../../../utils/httpError");

const ALLOWED_FIELDS = ["action", "info"];
const MAX_FIELD_LENGTH = 200;

function validatePayloadShape(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw new HttpError(400, "Body must be a JSON object.");
  }
}

function ensureNoUnknownFields(payload) {
  const unknownFields = Object.keys(payload).filter(
    (field) => !ALLOWED_FIELDS.includes(field),
  );

  if (unknownFields.length > 0) {
    throw new HttpError(400, "Body contains unsupported fields.", {
      unsupportedFields: unknownFields,
    });
  }
}

function normalizeStringField(payload, fieldName, normalized) {
  if (!Object.hasOwn(payload, fieldName)) {
    return;
  }

  if (typeof payload[fieldName] !== "string") {
    throw new HttpError(400, `"${fieldName}" must be a string.`);
  }

  const trimmedValue = payload[fieldName].trim();
  if (!trimmedValue) {
    throw new HttpError(400, `"${fieldName}" cannot be empty.`);
  }

  if (trimmedValue.length > MAX_FIELD_LENGTH) {
    throw new HttpError(
      400,
      `"${fieldName}" must be at most ${MAX_FIELD_LENGTH} characters.`,
    );
  }

  normalized[fieldName] = trimmedValue;
}

function validateCreateActivity(payload) {
  validatePayloadShape(payload);
  ensureNoUnknownFields(payload);

  const normalized = {};
  normalizeStringField(payload, "action", normalized);
  normalizeStringField(payload, "info", normalized);

  if (!Object.hasOwn(normalized, "action")) {
    throw new HttpError(400, '"action" is required.');
  }

  if (!Object.hasOwn(normalized, "info")) {
    throw new HttpError(400, '"info" is required.');
  }

  return normalized;
}

module.exports = {
  validateCreateActivity,
};

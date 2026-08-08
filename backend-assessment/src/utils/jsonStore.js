const fs = require("node:fs/promises");

const HttpError = require("./httpError");

async function readJsonArray(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf-8");
    if (!raw.trim()) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new HttpError(
        500,
        "Data file is corrupted: expected a JSON array.",
      );
    }

    return parsed;
  } catch (error) {
    if (error.code === "ENOENT") {
      await fs.writeFile(filePath, "[]\n", "utf-8");
      return [];
    }

    throw error;
  }
}

async function writeJsonArray(filePath, data) {
  await fs.writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

module.exports = {
  readJsonArray,
  writeJsonArray,
};

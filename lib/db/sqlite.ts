import Database from "better-sqlite3";

const getUsageDbPath = () => {
  const dbPath = process.env.USAGE_DB_PATH?.trim();

  if (!dbPath) {
    throw new Error("USAGE_DB_PATH is not set");
  }

  return dbPath;
};

export const isUsageDbConfigured = () =>
  Boolean(process.env.USAGE_DB_PATH?.trim());

export const openUsageDb = () => {
  const db = new Database(getUsageDbPath());

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return db;
};

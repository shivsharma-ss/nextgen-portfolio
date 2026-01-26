import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
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

const ensureUsageDbDirectory = (dbPath: string) => {
  mkdirSync(dirname(dbPath), { recursive: true });
};

export const openUsageDb = () => {
  const dbPath = getUsageDbPath();
  ensureUsageDbDirectory(dbPath);

  const db = new Database(dbPath);

  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  return db;
};

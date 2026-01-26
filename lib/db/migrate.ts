import { readFileSync } from "node:fs";
import type { Database as SqliteDatabase } from "better-sqlite3";
import { openUsageDb } from "@/lib/db/sqlite";

const migrationUrl = new URL(
  "../../db/migrations/001_usage.sql",
  import.meta.url,
);

type MigrationOptions = {
  db?: SqliteDatabase;
};

export const migrateUsageDb = (options: MigrationOptions = {}) => {
  const db = options.db ?? openUsageDb();
  const shouldClose = options.db === undefined;

  try {
    const sql = readFileSync(migrationUrl, "utf8");
    db.exec(sql);
  } finally {
    if (shouldClose) {
      db.close();
    }
  }
};

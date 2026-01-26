import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";
import { openUsageDb } from "@/lib/db/sqlite";

test("migrateUsageDb creates usage tables", async () => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "usage-db-"));
  const dbPath = path.join(tempDir, "usage.sqlite");
  const originalUsageDbPath = process.env.USAGE_DB_PATH;
  process.env.USAGE_DB_PATH = dbPath;

  let migrateUsageDb: (() => void) | undefined;

  try {
    try {
      ({ migrateUsageDb } = await import("@/lib/db/migrate"));
    } catch (error) {
      assert.fail("migrateUsageDb module is missing");
    }

    if (typeof migrateUsageDb !== "function") {
      assert.fail("migrateUsageDb export is missing");
    }

    migrateUsageDb();

    const db = new Database(dbPath);
    const tableRows = db
      .prepare("select name from sqlite_master where type = 'table'")
      .all() as Array<{ name: string }>;
    const tableNames = tableRows.map((row) => row.name);

    db.close();

    assert.ok(tableNames.includes("usage_visitors"));
    assert.ok(tableNames.includes("usage_sessions"));
  } finally {
    if (originalUsageDbPath === undefined) {
      delete process.env.USAGE_DB_PATH;
    } else {
      process.env.USAGE_DB_PATH = originalUsageDbPath;
    }
  }
});

test("migrateUsageDb closes db when migration read fails", async (t) => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "usage-db-"));
  const dbPath = path.join(tempDir, "usage.sqlite");
  const originalUsageDbPath = process.env.USAGE_DB_PATH;
  process.env.USAGE_DB_PATH = dbPath;

  const originalClose = Database.prototype.close;
  t.mock.method(
    Database.prototype,
    "close",
    function (this: InstanceType<typeof Database>) {
      return originalClose.call(this);
    },
  );
  const closeSpy = Database.prototype.close as unknown as {
    mock: { callCount: () => number };
  };

  const globalFs = globalThis as typeof globalThis & {
    readFileSync: typeof readFileSync;
  };
  const originalReadFileSync = globalFs.readFileSync;
  globalFs.readFileSync = () => {
    throw new Error("read failed");
  };

  try {
    const { migrateUsageDb } = await import("@/lib/db/migrate");
    assert.throws(() => migrateUsageDb(), /read failed/);
  } finally {
    globalFs.readFileSync = originalReadFileSync;
    if (originalUsageDbPath === undefined) {
      delete process.env.USAGE_DB_PATH;
    } else {
      process.env.USAGE_DB_PATH = originalUsageDbPath;
    }
  }

  assert.strictEqual(closeSpy.mock.callCount(), 1);
});

test("migrateUsageDb closes db when migration exec fails", async (t) => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "usage-db-"));
  const dbPath = path.join(tempDir, "usage.sqlite");
  const originalUsageDbPath = process.env.USAGE_DB_PATH;
  process.env.USAGE_DB_PATH = dbPath;

  const originalClose = Database.prototype.close;
  t.mock.method(
    Database.prototype,
    "close",
    function (this: InstanceType<typeof Database>) {
      return originalClose.call(this);
    },
  );
  const closeSpy = Database.prototype.close as unknown as {
    mock: { callCount: () => number };
  };
  t.mock.method(Database.prototype, "exec", () => {
    throw new Error("exec failed");
  });

  try {
    const { migrateUsageDb } = await import("@/lib/db/migrate");
    assert.throws(() => migrateUsageDb(), /exec failed/);
  } finally {
    if (originalUsageDbPath === undefined) {
      delete process.env.USAGE_DB_PATH;
    } else {
      process.env.USAGE_DB_PATH = originalUsageDbPath;
    }
  }

  assert.strictEqual(closeSpy.mock.callCount(), 1);
});

test("openUsageDb enables foreign keys", (t) => {
  const tempDir = mkdtempSync(path.join(tmpdir(), "usage-db-"));
  const dbPath = path.join(tempDir, "usage.sqlite");
  const originalUsageDbPath = process.env.USAGE_DB_PATH;
  process.env.USAGE_DB_PATH = dbPath;

  const originalPragma = Database.prototype.pragma;
  t.mock.method(
    Database.prototype,
    "pragma",
    function (
      this: InstanceType<typeof Database>,
      value: string,
      options?: { simple?: boolean },
    ) {
      return originalPragma.call(this, value, options);
    },
  );
  const pragmaSpy = Database.prototype.pragma as unknown as {
    mock: { calls: Array<{ arguments: unknown[] }> };
  };

  try {
    const db = openUsageDb();
    const foreignKeys = db.pragma("foreign_keys", { simple: true });
    db.close();

    assert.strictEqual(foreignKeys, 1);
    assert.ok(
      pragmaSpy.mock.calls.some(
        (call) => call.arguments[0] === "foreign_keys = ON",
      ),
    );
  } finally {
    if (originalUsageDbPath === undefined) {
      delete process.env.USAGE_DB_PATH;
    } else {
      process.env.USAGE_DB_PATH = originalUsageDbPath;
    }
  }
});

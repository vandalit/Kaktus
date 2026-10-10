const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const Database = require("better-sqlite3");
const {
  openDatabase,
  resolveDataDirectory,
  runMigrations
} = require("../database");

test("resolves platform-specific private data directories", () => {
  assert.equal(
    resolveDataDirectory({ XDG_DATA_HOME: "/tmp/kaktus-test" }, "/home/test", "linux"),
    "/tmp/kaktus-test/kaktus"
  );
  assert.equal(
    resolveDataDirectory(
      { LOCALAPPDATA: "C:\\Users\\test\\AppData\\Local" },
      "C:\\Users\\test",
      "win32"
    ),
    "C:\\Users\\test\\AppData\\Local\\Kaktus"
  );
  assert.equal(
    resolveDataDirectory({ KAKTUS_DATA_DIR: "./custom-data" }, "/home/test", "linux"),
    path.resolve("./custom-data")
  );
});

test("creates the schema and applies migrations only once", () => {
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kaktus-db-"));
  const database = openDatabase({ dataDirectory });
  try {
    assert.deepEqual(
      database.prepare("SELECT version FROM schema_migrations").all(),
      [{ version: 1 }]
    );
    assert.deepEqual(database.pragma("foreign_keys"), [{ foreign_keys: 1 }]);
    assert.equal(database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'projects'").get().name, "projects");
    runMigrations(database);
    assert.equal(database.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get().count, 1);
  } finally {
    database.close();
    fs.rmSync(dataDirectory, { recursive: true, force: true });
  }
});

test("enforces relationships and closed view catalogs", () => {
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kaktus-db-"));
  const database = openDatabase({ dataDirectory });
  try {
    assert.throws(() => database.prepare(`
      INSERT INTO roots (id, workspace_id, kind, display_name, local_path, created_at)
      VALUES ('root', 'missing-workspace', 'local', 'CaseUses', '/tmp/CaseUses', 'now')
    `).run(), /FOREIGN KEY constraint failed/);

    database.prepare(`
      INSERT INTO workspaces (id, name, created_at, updated_at)
      VALUES ('workspace', 'Demo', 'now', 'now')
    `).run();
    assert.throws(() => database.prepare(`
      INSERT INTO workspace_preferences (workspace_id, preferred_dashboard_view, updated_at)
      VALUES ('workspace', 'unknown', 'now')
    `).run(), /CHECK constraint failed/);
  } finally {
    database.close();
    fs.rmSync(dataDirectory, { recursive: true, force: true });
  }
});

test("rolls back a failed migration without recording it", () => {
  const database = new Database(":memory:");
  try {
    assert.throws(() => runMigrations(database, [{
      version: 1,
      sql: "CREATE TABLE partial_table (id INTEGER); INVALID SQL;"
    }]));
    assert.equal(
      database.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'partial_table'").get(),
      undefined
    );
    assert.equal(database.prepare("SELECT COUNT(*) AS count FROM schema_migrations").get().count, 0);
  } finally {
    database.close();
  }
});

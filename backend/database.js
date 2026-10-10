const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const Database = require("better-sqlite3");

const migrationsDirectory = path.join(__dirname, "db", "migrations");

function resolveDataDirectory(
  environment = process.env,
  homeDirectory = os.homedir(),
  platform = process.platform
) {
  const pathApi = platform === "win32" ? path.win32 : path;
  if (environment.KAKTUS_DATA_DIR) return pathApi.resolve(environment.KAKTUS_DATA_DIR);
  if (platform === "win32") {
    const baseDirectory = environment.LOCALAPPDATA
      ? pathApi.resolve(environment.LOCALAPPDATA)
      : pathApi.join(homeDirectory, "AppData", "Local");
    return pathApi.join(baseDirectory, "Kaktus");
  }
  const baseDirectory = environment.XDG_DATA_HOME
    ? pathApi.resolve(environment.XDG_DATA_HOME)
    : path.join(homeDirectory, ".local", "share");
  return path.join(baseDirectory, "kaktus");
}

function listMigrations(directory = migrationsDirectory) {
  return fs.readdirSync(directory)
    .filter((filename) => /^\d{3,}_.*\.sql$/.test(filename))
    .sort()
    .map((filename) => {
      const version = Number(filename.slice(0, filename.indexOf("_")));
      return { version, sql: fs.readFileSync(path.join(directory, filename), "utf8") };
    });
}

function runMigrations(database, migrations = listMigrations()) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);

  const appliedVersions = database
    .prepare("SELECT version FROM schema_migrations ORDER BY version")
    .all()
    .map(({ version }) => version);
  const knownVersions = new Set(migrations.map(({ version }) => version));
  const unknownVersion = appliedVersions.find((version) => !knownVersions.has(version));
  if (unknownVersion !== undefined) {
    throw new Error(`La base contiene una migración desconocida (${unknownVersion}).`);
  }

  for (const migration of migrations) {
    if (appliedVersions.includes(migration.version)) continue;
    const applyMigration = database.transaction(() => {
      database.exec(migration.sql);
      database
        .prepare("INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)")
        .run(migration.version, new Date().toISOString());
    });
    applyMigration.immediate();
  }
}

function openDatabase(options = {}) {
  const dataDirectory = options.dataDirectory || resolveDataDirectory();
  fs.mkdirSync(dataDirectory, { recursive: true, mode: 0o700 });
  if (process.platform !== "win32") fs.chmodSync(dataDirectory, 0o700);

  const filename = path.join(dataDirectory, "kaktus.sqlite");
  const database = new Database(filename, {
    timeout: 5000,
    fileMustExist: false
  });
  try {
    if (process.platform !== "win32") fs.chmodSync(filename, 0o600);
    database.pragma("foreign_keys = ON");
    database.pragma("busy_timeout = 5000");
    runMigrations(database, options.migrations);
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}

module.exports = {
  listMigrations,
  openDatabase,
  resolveDataDirectory,
  runMigrations
};

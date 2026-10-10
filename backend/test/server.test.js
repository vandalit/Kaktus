const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const Database = require("better-sqlite3");

async function getAvailablePort() {
  const portServer = http.createServer();
  await new Promise((resolve, reject) => {
    portServer.once("error", reject);
    portServer.listen(0, "127.0.0.1", resolve);
  });
  const { port } = portServer.address();
  await new Promise((resolve, reject) => {
    portServer.close((error) => error ? reject(error) : resolve());
  });
  return port;
}

test("starts the API with an isolated SQLite database and keeps demo reads working", async () => {
  const dataDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kaktus-api-"));
  const port = await getAvailablePort();
  const child = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: {
      ...process.env,
      KAKTUS_API_PORT: String(port),
      KAKTUS_DATA_DIR: dataDirectory
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  let output = "";
  child.stdout.setEncoding("utf8").on("data", (chunk) => { output += chunk; });
  child.stderr.setEncoding("utf8").on("data", (chunk) => { output += chunk; });

  try {
    const baseUrl = `http://127.0.0.1:${port}`;
    let healthResponse;
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (child.exitCode !== null) throw new Error(`API process exited early: ${output}`);
      try {
        healthResponse = await fetch(`${baseUrl}/api/health`);
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    assert.ok(healthResponse, `API did not start: ${output}`);
    assert.equal(healthResponse.status, 200);
    assert.deepEqual(await healthResponse.json(), { status: "ok" });

    const projectsResponse = await fetch(`${baseUrl}/api/projects`);
    assert.equal(projectsResponse.status, 200);
    const { projects } = await projectsResponse.json();
    assert.equal(projects.length, 3);
    assert.match(output, /SQLite inicializada/);
    assert.ok(fs.existsSync(path.join(dataDirectory, "kaktus.sqlite")));
    const database = new Database(path.join(dataDirectory, "kaktus.sqlite"), { readonly: true });
    try {
      assert.equal(database.prepare("SELECT COUNT(*) AS count FROM workspaces").get().count, 1);
      assert.equal(database.prepare("SELECT COUNT(*) AS count FROM projects WHERE is_present = 1").get().count, 3);
      assert.equal(database.prepare("SELECT COUNT(*) AS count FROM project_scans WHERE status = 'complete'").get().count, 3);
    } finally {
      database.close();
    }
  } finally {
    if (child.exitCode === null) {
      child.kill("SIGTERM");
      await new Promise((resolve) => child.once("exit", resolve));
    }
    fs.rmSync(dataDirectory, { recursive: true, force: true });
  }
});

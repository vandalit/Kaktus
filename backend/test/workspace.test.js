const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { openDatabase } = require("../database");
const { bootstrapDemoWorkspace, scanWorkspace } = require("../workspace");

function createFixture() {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "kaktus-workspace-"));
  const rootPath = path.join(temporaryDirectory, "CaseUses");
  const externalDirectory = path.join(temporaryDirectory, "external");
  fs.mkdirSync(rootPath);
  fs.mkdirSync(externalDirectory);
  fs.mkdirSync(path.join(rootPath, "01-mini-store", "src"), { recursive: true });
  fs.mkdirSync(path.join(rootPath, "01-mini-store", "node_modules"), { recursive: true });
  fs.mkdirSync(path.join(rootPath, "02-static"));
  fs.writeFileSync(
    path.join(rootPath, "01-mini-store", "README.md"),
    "# 01 · Tienda demo\n\nUna tienda de ejemplo.\n"
  );
  fs.writeFileSync(
    path.join(rootPath, "01-mini-store", "package.json"),
    JSON.stringify({ dependencies: { react: "1.0.0", vite: "1.0.0" } })
  );
  fs.writeFileSync(path.join(rootPath, "01-mini-store", "src", "app.js"), "export const app = true;\n");
  fs.writeFileSync(path.join(rootPath, "01-mini-store", "node_modules", "ignored.js"), "");
  fs.writeFileSync(path.join(externalDirectory, "linked-secret.js"), "");
  fs.writeFileSync(path.join(rootPath, "02-static", "index.html"), "<html></html>\n");
  fs.writeFileSync(path.join(rootPath, "02-static", "styles.css"), "body {}\n");
  fs.writeFileSync(path.join(rootPath, "02-static", "script.js"), "start();\n");
  fs.writeFileSync(path.join(rootPath, "loose-file.txt"), "not a project\n");
  fs.mkdirSync(path.join(rootPath, ".git"));
  fs.symlinkSync(externalDirectory, path.join(rootPath, "03-linked-project"), "dir");
  fs.symlinkSync(externalDirectory, path.join(rootPath, "01-mini-store", "linked"), "dir");
  const database = openDatabase({ dataDirectory: path.join(temporaryDirectory, "data") });

  return {
    database,
    rootPath,
    temporaryDirectory,
    close() {
      database.close();
      fs.rmSync(temporaryDirectory, { recursive: true, force: true });
    }
  };
}

test("bootstraps the demo workspace and records repeatable filesystem snapshots", async () => {
  const fixture = createFixture();
  try {
    const workspace = await bootstrapDemoWorkspace(fixture.database, fixture.rootPath);
    assert.equal(workspace.workspaceId, "workspace-demo");
    assert.equal(workspace.scan.complete, true);
    assert.equal(workspace.scan.projectCount, 2);
    assert.equal(fixture.database.prepare("SELECT COUNT(*) AS count FROM workspaces").get().count, 1);
    assert.equal(fixture.database.prepare("SELECT COUNT(*) AS count FROM roots").get().count, 1);

    const project = fixture.database.prepare(`
      SELECT id, name FROM projects WHERE relative_path = '01-mini-store'
    `).get();
    assert.equal(project.name, "Tienda demo");
    const firstScan = fixture.database.prepare(`
      SELECT id, files_count, folders_count
      FROM project_scans WHERE project_id = ? AND status = 'complete'
    `).get(project.id);
    assert.equal(firstScan.files_count, 3);
    assert.equal(firstScan.folders_count, 1);
    assert.deepEqual(
      fixture.database.prepare(`
        SELECT relative_path, kind FROM filesystem_entries
        WHERE scan_id = ? ORDER BY relative_path
      `).all(firstScan.id),
      [
        { relative_path: "README.md", kind: "file" },
        { relative_path: "package.json", kind: "file" },
        { relative_path: "src", kind: "directory" },
        { relative_path: "src/app.js", kind: "file" }
      ]
    );
    assert.deepEqual(
      fixture.database.prepare(`
        SELECT name FROM project_technologies
        WHERE scan_id = ? ORDER BY name
      `).all(firstScan.id).map(({ name }) => name),
        ["Bootstrap CDN", "JavaScript", "Node.js", "React", "Vite"]
    );

    const secondBootstrap = await bootstrapDemoWorkspace(fixture.database, fixture.rootPath);
    assert.equal(secondBootstrap.scan, null);
    const rescanned = await scanWorkspace(fixture.database, workspace.rootId);
    assert.equal(rescanned.complete, true);
    assert.equal(
      fixture.database.prepare("SELECT COUNT(*) AS count FROM projects WHERE relative_path = '01-mini-store'").get().count,
      1
    );
    assert.equal(
      fixture.database.prepare("SELECT COUNT(*) AS count FROM project_scans WHERE project_id = ? AND status = 'complete'").get(project.id).count,
      2
    );
  } finally {
    fixture.close();
  }
});

test("preserves the last complete project snapshot and only marks absences after a complete scan", async () => {
  const fixture = createFixture();
  try {
    const workspace = await bootstrapDemoWorkspace(fixture.database, fixture.rootPath);
    const project = fixture.database.prepare(`
      SELECT id FROM projects WHERE relative_path = '01-mini-store'
    `).get();
    const originalSnapshotId = fixture.database.prepare(`
      SELECT id FROM project_scans WHERE project_id = ? AND status = 'complete'
    `).get(project.id).id;

    fs.rmSync(path.join(fixture.rootPath, "02-static"), { recursive: true });
    const fileSystem = {
      ...fs.promises,
      async readdir(directory, ...args) {
        if (directory === path.join(fixture.rootPath, "01-mini-store", "src")) {
          throw new Error("Fallo simulado durante el recorrido.");
        }
        return fs.promises.readdir(directory, ...args);
      }
    };
    const partialScan = await scanWorkspace(fixture.database, workspace.rootId, { fileSystem });
    assert.equal(partialScan.complete, false);
    assert.deepEqual(partialScan.failedProjects, ["01-mini-store"]);
    assert.equal(
      fixture.database.prepare("SELECT name FROM projects WHERE relative_path = '01-mini-store'").get().name,
      "Tienda demo"
    );
    assert.equal(
      fixture.database.prepare("SELECT is_present FROM projects WHERE relative_path = '02-static'").get().is_present,
      1
    );
    assert.equal(
      fixture.database.prepare(`
        SELECT id FROM project_scans WHERE project_id = ? AND status = 'complete'
      `).get(project.id).id,
      originalSnapshotId
    );
    assert.equal(
      fixture.database.prepare(`
        SELECT COUNT(*) AS count FROM project_scans WHERE project_id = ? AND status = 'error'
      `).get(project.id).count,
      1
    );
    assert.equal(
      fixture.database.prepare(`
        SELECT error_message FROM project_scans WHERE project_id = ? AND status = 'error'
      `).get(project.id).error_message,
      "No se pudo completar el escaneo del proyecto."
    );

    const completeScan = await scanWorkspace(fixture.database, workspace.rootId);
    assert.equal(completeScan.complete, true);
    assert.equal(
      fixture.database.prepare("SELECT is_present FROM projects WHERE relative_path = '02-static'").get().is_present,
      0
    );

    fs.renameSync(fixture.rootPath, `${fixture.rootPath}-offline`);
    await assert.rejects(scanWorkspace(fixture.database, workspace.rootId), /ENOENT/);
    assert.equal(
      fixture.database.prepare("SELECT is_present FROM projects WHERE relative_path = '01-mini-store'").get().is_present,
      1
    );
    fs.renameSync(`${fixture.rootPath}-offline`, fixture.rootPath);
  } finally {
    fixture.close();
  }
});

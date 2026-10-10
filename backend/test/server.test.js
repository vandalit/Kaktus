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
    assert.deepEqual(await healthResponse.json(), { status: "ok", database: "ok" });
    assert.equal(
      (await fetch(`${baseUrl}/api/workspaces/workspace-demo/scan`)).status,
      405
    );
    assert.equal(
      (await fetch(`${baseUrl}/api/workspaces/missing-workspace/scan`, { method: "POST" })).status,
      404
    );

    const projectsResponse = await fetch(`${baseUrl}/api/projects`);
    assert.equal(projectsResponse.status, 200);
    const { projects } = await projectsResponse.json();
    assert.equal(projects.length, 3);
    const demoProject = projects.find(({ id }) => id === "01-mini-store");
    assert.ok(demoProject);
    assert.equal(demoProject.title, "Mini Store");
    const sourceBrowserResponse = await fetch(
      `${baseUrl}/api/workspaces/workspace-demo/source-browser`
    );
    assert.equal(sourceBrowserResponse.status, 200);
    const sourceBrowser = await sourceBrowserResponse.json();
    assert.equal(sourceBrowser.rootName, "CaseUses");
    assert.ok(sourceBrowser.rootPathSegments.length > 0);
    assert.ok(sourceBrowser.entries.some(
      ({ name, type }) => name === "01-mini-store" && type === "directory"
    ));
    assert.ok(sourceBrowser.entries.some(
      ({ name, type }) => name === "README.md" && type === "file"
    ));
    assert.equal(JSON.stringify(sourceBrowser).includes(path.resolve(__dirname, "../../CaseUses")), false);
    const nestedBrowserResponse = await fetch(
      `${baseUrl}/api/workspaces/workspace-demo/source-browser?path=01-mini-store%2Fbackend`
    );
    assert.equal(nestedBrowserResponse.status, 200);
    const nestedBrowser = await nestedBrowserResponse.json();
    assert.ok(nestedBrowser.entries.some(({ name }) => name === "server.js"));
    assert.equal(
      (await fetch(
        `${baseUrl}/api/workspaces/workspace-demo/source-browser?path=..%2F..`
      )).status,
      400
    );
    assert.equal(
      (await fetch(`${baseUrl}/api/workspaces/missing-workspace/source-browser`)).status,
      404
    );
    const workspacePreferencesUrl = `${baseUrl}/api/workspaces/workspace-demo/preferences`;
    const initialWorkspacePreferences = await fetch(workspacePreferencesUrl);
    assert.equal(initialWorkspacePreferences.status, 200);
    assert.deepEqual(await initialWorkspacePreferences.json(), {
      preferences: {
        preferred_dashboard_view: null,
        dashboard_sort: null,
        preferred_studio_view: null
      }
    });
    const workspacePatchResponse = await fetch(workspacePreferencesUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferred_dashboard_view: "console",
        dashboard_sort: "reverse_source_order"
      })
    });
    assert.equal(workspacePatchResponse.status, 200);
    assert.deepEqual((await workspacePatchResponse.json()).preferences, {
      preferred_dashboard_view: "console",
      dashboard_sort: "reverse_source_order",
      preferred_studio_view: null
    });
    const persistedWorkspacePreferences = await fetch(workspacePreferencesUrl);
    assert.deepEqual((await persistedWorkspacePreferences.json()).preferences, {
      preferred_dashboard_view: "console",
      dashboard_sort: "reverse_source_order",
      preferred_studio_view: null
    });
    const invalidWorkspacePreference = await fetch(workspacePreferencesUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferred_dashboard_view: "unknown" })
    });
    assert.equal(invalidWorkspacePreference.status, 400);
    assert.equal(
      (await fetch(`${baseUrl}/api/workspaces/missing-workspace/preferences`)).status,
      404
    );

    const projectPreferencesUrl = `${baseUrl}/api/projects/01-mini-store/preferences`;
    const initialProjectPreferences = await fetch(projectPreferencesUrl);
    assert.equal(initialProjectPreferences.status, 200);
    assert.deepEqual(await initialProjectPreferences.json(), {
      preferences: { preferred_studio_view: null, selected_file_path: null }
    });
    const projectPatchResponse = await fetch(projectPreferencesUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preferred_studio_view: "multipista",
        selected_file_path: "README.md"
      })
    });
    assert.equal(projectPatchResponse.status, 200);
    assert.deepEqual((await projectPatchResponse.json()).preferences, {
      preferred_studio_view: "multipista",
      selected_file_path: "README.md"
    });
    const persistedProjectPreferences = await fetch(projectPreferencesUrl);
    assert.deepEqual((await persistedProjectPreferences.json()).preferences, {
      preferred_studio_view: "multipista",
      selected_file_path: "README.md"
    });
    const invalidSelectedFile = await fetch(projectPreferencesUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_file_path: "../package.json" })
    });
    assert.equal(invalidSelectedFile.status, 400);
    const unindexedFilePreference = await fetch(projectPreferencesUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selected_file_path: "not-in-snapshot.txt" })
    });
    assert.equal(unindexedFilePreference.status, 400);
    const invalidPreferenceField = await fetch(projectPreferencesUrl, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terminal_command: "do-not-store" })
    });
    assert.equal(invalidPreferenceField.status, 400);
    const invalidContentType = await fetch(projectPreferencesUrl, {
      method: "PATCH",
      body: JSON.stringify({ preferred_studio_view: "ide" })
    });
    assert.equal(invalidContentType.status, 400);

    const legacyTreeResponse = await fetch(`${baseUrl}/api/projects/01-mini-store/tree`);
    assert.equal(legacyTreeResponse.status, 200);
    const legacyTree = await legacyTreeResponse.json();
    assert.equal(legacyTree.rootName, "01-mini-store");
    assert.ok(legacyTree.entries.some(({ name }) => name === "README.md"));
    assert.equal(
      (await fetch(`${baseUrl}/api/projects/missing-project/tree`)).status,
      404
    );
    assert.equal(
      (await fetch(`${baseUrl}/api/projects/%E0%A4%A/tree`)).status,
      400
    );

    assert.match(output, /SQLite inicializada/);
    assert.ok(fs.existsSync(path.join(dataDirectory, "kaktus.sqlite")));
    const database = new Database(path.join(dataDirectory, "kaktus.sqlite"));
    try {
      assert.equal(database.prepare("SELECT COUNT(*) AS count FROM workspaces").get().count, 1);
      assert.equal(database.prepare("SELECT COUNT(*) AS count FROM projects WHERE is_present = 1").get().count, 3);
      assert.equal(database.prepare("SELECT COUNT(*) AS count FROM project_scans WHERE status = 'complete'").get().count, 3);
      const root = database.prepare(`
        SELECT id, local_path FROM roots WHERE workspace_id = 'workspace-demo'
      `).get();
      const rescanResponse = await fetch(
        `${baseUrl}/api/workspaces/workspace-demo/scan`,
        { method: "POST" }
      );
      assert.equal(rescanResponse.status, 200);
      const { scan } = await rescanResponse.json();
      assert.equal(scan.workspaceId, "workspace-demo");
      assert.equal(scan.rootId, root.id);
      assert.equal(scan.complete, true);
      assert.equal(scan.projectCount, 3);
      assert.deepEqual(scan.failedProjects, []);

      database.prepare("UPDATE roots SET local_path = ? WHERE id = ?")
        .run(path.join(dataDirectory, "missing-workspace-root"), root.id);
      const inaccessibleScanResponse = await fetch(
        `${baseUrl}/api/workspaces/workspace-demo/scan`,
        { method: "POST" }
      );
      assert.equal(inaccessibleScanResponse.status, 503);
      assert.deepEqual(await inaccessibleScanResponse.json(), {
        error: "No se pudo acceder a la raíz local del workspace."
      });
      database.prepare("UPDATE roots SET local_path = ? WHERE id = ?")
        .run(root.local_path, root.id);

      const indexedProject = database.prepare(`
        SELECT project.id, scan.id AS scan_id
        FROM projects AS project
        JOIN project_scans AS scan ON scan.project_id = project.id
        WHERE project.relative_path = '01-mini-store' AND scan.status = 'complete'
        ORDER BY scan.completed_at DESC
        LIMIT 1
      `).get();
      database.prepare("UPDATE projects SET name = 'Título desde SQLite' WHERE id = ?")
        .run(indexedProject.id);
      database.prepare(`
        UPDATE project_scans
        SET description = 'Descripción desde SQLite', files_count = 987
        WHERE id = ?
      `).run(indexedProject.scan_id);
      database.prepare(`
        INSERT INTO filesystem_entries
          (scan_id, parent_path, relative_path, name, kind, extension, size_bytes)
        VALUES (?, NULL, 'solo-indice.txt', 'solo-indice.txt', 'file', '.txt', 42)
      `).run(indexedProject.scan_id);

      const uuidTreeResponse = await fetch(`${baseUrl}/api/projects/${indexedProject.id}/tree`);
      assert.equal(uuidTreeResponse.status, 200);
      const uuidTree = await uuidTreeResponse.json();
      assert.ok(uuidTree.entries.some(({ name }) => name === "solo-indice.txt"));

      const indexedProjectsResponse = await fetch(`${baseUrl}/api/projects`);
      assert.equal(indexedProjectsResponse.status, 200);
      const indexedProjects = await indexedProjectsResponse.json();
      const indexedDemo = indexedProjects.projects.find(({ id }) => id === "01-mini-store");
      assert.equal(indexedDemo.title, "Título desde SQLite");
      assert.equal(indexedDemo.description, "Descripción desde SQLite");
      assert.equal(indexedDemo.files, 987);

      const realFileResponse = await fetch(
        `${baseUrl}/api/projects/${indexedProject.id}/file?path=README.md`
      );
      assert.equal(realFileResponse.status, 200);
      assert.match((await realFileResponse.json()).file.content, /Mini Store/);

      const traversalResponse = await fetch(
        `${baseUrl}/api/projects/01-mini-store/file?path=..%2FREADME.md`
      );
      assert.equal(traversalResponse.status, 400);

      const indexedOnlyFileResponse = await fetch(
        `${baseUrl}/api/projects/${indexedProject.id}/file?path=solo-indice.txt`
      );
      assert.equal(indexedOnlyFileResponse.status, 404);
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

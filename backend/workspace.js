const { randomUUID } = require("node:crypto");
const { scanFilesystemRoot, validateRoot } = require("./scanner");

const detectorVersion = "1";

function safeScanError(error) {
  const errorCode = error && typeof error === "object" ? error.code : undefined;
  const errorMessage = error instanceof Error ? error.message : "";
  if (errorCode === "EACCES" || errorCode === "EPERM") {
    return "Acceso denegado durante el escaneo.";
  }
  if (errorCode === "ENOENT" || errorCode === "ENOTDIR") {
    return "El proyecto cambió o dejó de estar disponible durante el escaneo.";
  }
  if (errorMessage.includes("package.json")) {
    return "El package.json del proyecto no es válido.";
  }
  return "No se pudo completar el escaneo del proyecto.";
}

function ensureWorkspace(database, rootPath, now) {
  const workspaceId = "workspace-demo";
  database.prepare(`
    INSERT OR IGNORE INTO workspaces (id, name, created_at, updated_at)
    VALUES (?, 'CaseUses', ?, ?)
  `).run(workspaceId, now, now);
  database.prepare("UPDATE workspaces SET updated_at = ? WHERE id = ?").run(now, workspaceId);

  let root = database.prepare(`
    SELECT id FROM roots WHERE workspace_id = ? AND local_path = ?
  `).get(workspaceId, rootPath);
  if (!root) {
    const fixedIdAvailable = !database.prepare("SELECT 1 FROM roots WHERE id = ?").get("root-caseuses");
    const rootId = fixedIdAvailable ? "root-caseuses" : randomUUID();
    database.prepare(`
      INSERT INTO roots
        (id, workspace_id, kind, display_name, local_path, created_at, last_opened_at)
      VALUES (?, ?, 'local', 'CaseUses', ?, ?, ?)
    `).run(rootId, workspaceId, rootPath, now, now);
    root = { id: rootId };
  } else {
    database.prepare("UPDATE roots SET last_opened_at = ? WHERE id = ?").run(now, root.id);
  }
  return { workspaceId, rootId: root.id };
}

async function initializeDemoWorkspace(database, rootPath, options = {}) {
  const canonicalPath = await validateRoot(rootPath, options.fileSystem);
  const now = new Date().toISOString();
  return database.transaction(() => ensureWorkspace(database, canonicalPath, now)).immediate();
}

async function bootstrapDemoWorkspace(database, rootPath, options = {}) {
  const workspace = await initializeDemoWorkspace(database, rootPath, options);
  const hasSuccessfulScan = database.prepare(`
    SELECT 1
    FROM projects AS project
    JOIN project_scans AS scan ON scan.project_id = project.id
    WHERE project.root_id = ? AND scan.status = 'complete'
    LIMIT 1
  `).get(workspace.rootId);
  const scan = hasSuccessfulScan
    ? null
    : await scanWorkspace(database, workspace.rootId, options);
  return { ...workspace, scan };
}

async function scanWorkspace(database, rootId, options = {}) {
  const root = database.prepare(`
    SELECT id, workspace_id, local_path
    FROM roots WHERE id = ? AND kind = 'local'
  `).get(rootId);
  if (!root) throw new Error("No se encontró la raíz local del workspace.");
  const { results, startedAt, completedAt } = await scanFilesystemRoot(root.local_path, options);

  return database.transaction(() => {
    const upsertProject = database.prepare(`
      INSERT INTO projects
        (id, root_id, relative_path, name, first_seen_at, last_seen_at, is_present)
      VALUES (?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(root_id, relative_path) DO UPDATE SET
        name = excluded.name,
        last_seen_at = excluded.last_seen_at,
        is_present = 1
    `);
    const findProject = database.prepare(`
      SELECT id, name FROM projects WHERE root_id = ? AND relative_path = ?
    `);
    const addScan = database.prepare(`
      INSERT INTO project_scans
        (id, project_id, started_at, completed_at, status, files_count, folders_count,
         description, detected_type, detector_version, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const addTechnology = database.prepare(`
      INSERT INTO project_technologies (scan_id, name, source)
      VALUES (?, ?, ?)
    `);
    const addEntry = database.prepare(`
      INSERT INTO filesystem_entries
        (scan_id, parent_path, relative_path, name, kind, extension, size_bytes, modified_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const result of results) {
      const existingProject = findProject.get(rootId, result.projectName);
      const projectId = existingProject?.id || randomUUID();
      upsertProject.run(
        projectId,
        rootId,
        result.projectName,
        result.snapshot?.name || existingProject?.name || result.projectName,
        startedAt,
        completedAt
      );
      const currentProjectId = findProject.get(rootId, result.projectName).id;
      if (result.error) {
        addScan.run(
          randomUUID(),
          currentProjectId,
          startedAt,
          completedAt,
          "error",
          null,
          null,
          null,
          null,
          detectorVersion,
          safeScanError(result.error)
        );
        continue;
      }

      const scanId = randomUUID();
      addScan.run(
        scanId,
        currentProjectId,
        startedAt,
        completedAt,
        "complete",
        result.snapshot.filesCount,
        result.snapshot.foldersCount,
        result.snapshot.description,
        result.snapshot.detectedType,
        detectorVersion,
        null
      );
      for (const technology of result.snapshot.technologies) {
        addTechnology.run(scanId, technology.name, technology.source);
      }
      for (const entry of result.snapshot.entries) {
        addEntry.run(
          scanId,
          entry.parentPath,
          entry.relativePath,
          entry.name,
          entry.kind,
          entry.extension || null,
          entry.sizeBytes ?? null,
          entry.modifiedAt || null
        );
      }
    }

    const failedProjects = results.filter((result) => result.error).map((result) => result.projectName);
    if (failedProjects.length === 0) {
      const presentPaths = new Set(results.map((result) => result.projectName));
      const existingProjects = database.prepare(`
        SELECT id, relative_path FROM projects WHERE root_id = ?
      `).all(rootId);
      const markAbsent = database.prepare("UPDATE projects SET is_present = 0 WHERE id = ?");
      for (const project of existingProjects) {
        if (!presentPaths.has(project.relative_path)) markAbsent.run(project.id);
      }
    }
    return {
      workspaceId: root.workspace_id,
      rootId,
      projectCount: results.length,
      failedProjects,
      complete: failedProjects.length === 0
    };
  }).immediate();
}

module.exports = {
  bootstrapDemoWorkspace,
  initializeDemoWorkspace,
  scanWorkspace
};

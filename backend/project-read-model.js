function latestSuccessfulScan(database, projectId) {
  return database.prepare(`
    SELECT id, description, detected_type, files_count, folders_count
    FROM project_scans
    WHERE project_id = ? AND status = 'complete'
    ORDER BY completed_at DESC, id DESC
    LIMIT 1
  `).get(projectId);
}

function findIndexedProject(database, identifier) {
  return database.prepare(`
    SELECT
      project.id,
      project.root_id,
      project.relative_path,
      root.local_path
    FROM projects AS project
    JOIN roots AS root ON root.id = project.root_id
    WHERE project.is_present = 1
      AND root.kind = 'local'
      AND (project.id = ? OR project.relative_path = ?)
    ORDER BY CASE WHEN project.id = ? THEN 0 ELSE 1 END
    LIMIT 1
  `).get(identifier, identifier, identifier) || null;
}

function listIndexedProjects(database) {
  const projects = database.prepare(`
    SELECT
      project.id,
      project.relative_path,
      project.name,
      scan.id AS scan_id,
      scan.description,
      scan.detected_type,
      scan.files_count,
      scan.folders_count
    FROM projects AS project
    JOIN roots AS root ON root.id = project.root_id
    LEFT JOIN project_scans AS scan ON scan.id = (
      SELECT candidate.id
      FROM project_scans AS candidate
      WHERE candidate.project_id = project.id AND candidate.status = 'complete'
      ORDER BY candidate.completed_at DESC, candidate.id DESC
      LIMIT 1
    )
    WHERE project.is_present = 1 AND root.kind = 'local'
  `).all();
  if (projects.length === 0) return [];

  const scans = projects.filter((project) => project.scan_id);
  const technologiesByScan = new Map();
  if (scans.length > 0) {
    const placeholders = scans.map(() => "?").join(", ");
    const technologies = database.prepare(`
      SELECT scan_id, name
      FROM project_technologies
      WHERE scan_id IN (${placeholders})
      ORDER BY id
    `).all(...scans.map((project) => project.scan_id));
    for (const technology of technologies) {
      const names = technologiesByScan.get(technology.scan_id) || [];
      if (!names.includes(technology.name)) names.push(technology.name);
      technologiesByScan.set(technology.scan_id, names);
    }
  }

  return projects
    .sort((left, right) => left.relative_path.localeCompare(right.relative_path, "es"))
    .map((project) => ({
      id: project.relative_path,
      title: project.name,
      description: project.description || "Proyecto local listo para explorar.",
      folders: project.folders_count || 0,
      files: project.files_count || 0,
      stack: project.scan_id ? technologiesByScan.get(project.scan_id) || [] : [],
      projectType: project.detected_type || "Experiencia estática"
    }));
}

function readIndexedProjectTree(database, project) {
  const scan = latestSuccessfulScan(database, project.id);
  if (!scan) return [];

  const rows = database.prepare(`
    SELECT name, relative_path, parent_path, kind, size_bytes
    FROM filesystem_entries
    WHERE scan_id = ?
  `).all(scan.id);
  const entriesByParent = new Map();
  for (const row of rows) {
    const entries = entriesByParent.get(row.parent_path) || [];
    entries.push(row);
    entriesByParent.set(row.parent_path, entries);
  }

  function buildEntries(parentPath = null) {
    const entries = entriesByParent.get(parentPath) || [];
    return entries
      .sort((left, right) => {
        if (left.kind !== right.kind) return left.kind === "directory" ? -1 : 1;
        return left.name.localeCompare(right.name, "es");
      })
      .map((entry) => {
        if (entry.kind === "directory") {
          return {
            name: entry.name,
            path: entry.relative_path,
            type: "directory",
            children: buildEntries(entry.relative_path)
          };
        }
        return {
          name: entry.name,
          path: entry.relative_path,
          type: "file",
          size: entry.size_bytes
        };
      });
  }

  return buildEntries();
}

module.exports = {
  findIndexedProject,
  listIndexedProjects,
  readIndexedProjectTree
};

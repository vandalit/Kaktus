const workspacePreferenceFields = {
  preferred_dashboard_view: ["projects", "console"],
  dashboard_sort: ["source_order", "reverse_source_order"],
  preferred_studio_view: ["ide", "multipista"]
};
const projectPreferenceFields = {
  preferred_studio_view: ["ide", "multipista"],
  selected_file_path: null
};

function validatePatch(patch, allowedFields) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) {
    return "El cuerpo debe ser un objeto JSON.";
  }
  const fields = Object.keys(patch);
  if (fields.length === 0) return "El cuerpo debe incluir al menos una preferencia.";
  const unknownField = fields.find((field) => !Object.hasOwn(allowedFields, field));
  if (unknownField) return `La preferencia "${unknownField}" no está permitida.`;

  for (const field of fields) {
    if (field === "selected_file_path") {
      const value = patch[field];
      if (value !== null && (
        typeof value !== "string" ||
        !value ||
        value.includes("\\") ||
        value.startsWith("/") ||
        value.split("/").some((part) => !part || part === "." || part === "..")
      )) {
        return "La ruta seleccionada debe ser relativa y válida.";
      }
      continue;
    }
    const value = patch[field];
    if (value !== null && !allowedFields[field].includes(value)) {
      return `El valor de "${field}" no está permitido.`;
    }
  }
  return null;
}

function getWorkspacePreferences(database, workspaceId) {
  const workspace = database.prepare("SELECT id FROM workspaces WHERE id = ?").get(workspaceId);
  if (!workspace) return null;
  const preferences = database.prepare(`
    SELECT preferred_dashboard_view, dashboard_sort, preferred_studio_view
    FROM workspace_preferences WHERE workspace_id = ?
  `).get(workspaceId);
  return preferences || {
    preferred_dashboard_view: null,
    dashboard_sort: null,
    preferred_studio_view: null
  };
}

function patchWorkspacePreferences(database, workspaceId, patch) {
  const validationError = validatePatch(patch, workspacePreferenceFields);
  if (validationError) return { error: validationError };
  if (!database.prepare("SELECT 1 FROM workspaces WHERE id = ?").get(workspaceId)) {
    return { notFound: true };
  }

  const timestamp = new Date().toISOString();
  const columns = ["preferred_dashboard_view", "dashboard_sort", "preferred_studio_view"];
  const current = database.prepare(`
    SELECT ${columns.join(", ")}
    FROM workspace_preferences WHERE workspace_id = ?
  `).get(workspaceId) || Object.fromEntries(columns.map((column) => [column, null]));
  const updated = { ...current, ...patch };
  database.prepare(`
    INSERT INTO workspace_preferences
      (workspace_id, preferred_dashboard_view, dashboard_sort, preferred_studio_view, updated_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(workspace_id) DO UPDATE SET
      preferred_dashboard_view = excluded.preferred_dashboard_view,
      dashboard_sort = excluded.dashboard_sort,
      preferred_studio_view = excluded.preferred_studio_view,
      updated_at = excluded.updated_at
  `).run(
    workspaceId,
    updated.preferred_dashboard_view,
    updated.dashboard_sort,
    updated.preferred_studio_view,
    timestamp
  );
  return { preferences: updated };
}

function isIndexedFile(database, projectId, relativePath) {
  return Boolean(database.prepare(`
    SELECT 1
    FROM filesystem_entries AS entry
    JOIN project_scans AS scan ON scan.id = entry.scan_id
    WHERE scan.project_id = ? AND scan.status = 'complete'
      AND scan.id = (
        SELECT latest.id FROM project_scans AS latest
        WHERE latest.project_id = scan.project_id AND latest.status = 'complete'
        ORDER BY latest.completed_at DESC, latest.id DESC
        LIMIT 1
      )
      AND entry.relative_path = ? AND entry.kind = 'file'
  `).get(projectId, relativePath));
}

function getProjectPreferences(database, project) {
  const preferences = database.prepare(`
    SELECT preferred_studio_view, selected_file_path
    FROM project_preferences WHERE project_id = ?
  `).get(project.id);
  if (!preferences) {
    return { preferred_studio_view: null, selected_file_path: null };
  }
  return {
    ...preferences,
    selected_file_path: preferences.selected_file_path
      && isIndexedFile(database, project.id, preferences.selected_file_path)
      ? preferences.selected_file_path
      : null
  };
}

function patchProjectPreferences(database, project, patch) {
  const validationError = validatePatch(patch, projectPreferenceFields);
  if (validationError) return { error: validationError };
  if (
    Object.hasOwn(patch, "selected_file_path") &&
    patch.selected_file_path !== null &&
    !isIndexedFile(database, project.id, patch.selected_file_path)
  ) {
    return { error: "El archivo seleccionado no existe en el último snapshot completo." };
  }

  const timestamp = new Date().toISOString();
  const columns = ["preferred_studio_view", "selected_file_path"];
  const current = database.prepare(`
    SELECT ${columns.join(", ")}
    FROM project_preferences WHERE project_id = ?
  `).get(project.id) || Object.fromEntries(columns.map((column) => [column, null]));
  const updated = { ...current, ...patch };
  database.prepare(`
    INSERT INTO project_preferences
      (project_id, preferred_studio_view, selected_file_path, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(project_id) DO UPDATE SET
      preferred_studio_view = excluded.preferred_studio_view,
      selected_file_path = excluded.selected_file_path,
      updated_at = excluded.updated_at
  `).run(
    project.id,
    updated.preferred_studio_view,
    updated.selected_file_path,
    timestamp
  );
  return { preferences: updated };
}

module.exports = {
  getProjectPreferences,
  getWorkspacePreferences,
  patchProjectPreferences,
  patchWorkspacePreferences
};

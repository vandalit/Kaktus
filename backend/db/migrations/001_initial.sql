CREATE TABLE workspaces (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE roots (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('local', 'git')),
  display_name TEXT NOT NULL,
  local_path TEXT,
  remote_url TEXT,
  created_at TEXT NOT NULL,
  last_opened_at TEXT,
  CHECK (
    (kind = 'local' AND local_path IS NOT NULL AND remote_url IS NULL)
    OR (kind = 'git' AND local_path IS NULL AND remote_url IS NOT NULL)
  ),
  UNIQUE (workspace_id, local_path),
  UNIQUE (workspace_id, remote_url)
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  root_id TEXT NOT NULL REFERENCES roots(id) ON DELETE CASCADE,
  relative_path TEXT NOT NULL CHECK (relative_path <> ''),
  name TEXT NOT NULL,
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  is_present INTEGER NOT NULL DEFAULT 1 CHECK (is_present IN (0, 1)),
  UNIQUE (root_id, relative_path)
);

CREATE TABLE project_scans (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('running', 'complete', 'error')),
  files_count INTEGER CHECK (files_count IS NULL OR files_count >= 0),
  folders_count INTEGER CHECK (folders_count IS NULL OR folders_count >= 0),
  description TEXT,
  detected_type TEXT,
  detector_version TEXT,
  error_message TEXT,
  CHECK (
    (status = 'running' AND completed_at IS NULL)
    OR (status IN ('complete', 'error') AND completed_at IS NOT NULL)
  )
);

CREATE INDEX project_scans_project_completed
  ON project_scans (project_id, completed_at DESC);

CREATE TABLE project_technologies (
  id INTEGER PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES project_scans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence REAL CHECK (confidence IS NULL OR confidence BETWEEN 0 AND 1),
  UNIQUE (scan_id, name, source)
);

CREATE TABLE filesystem_entries (
  id INTEGER PRIMARY KEY,
  scan_id TEXT NOT NULL REFERENCES project_scans(id) ON DELETE CASCADE,
  parent_path TEXT,
  relative_path TEXT NOT NULL CHECK (relative_path <> ''),
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('directory', 'file')),
  extension TEXT,
  size_bytes INTEGER CHECK (size_bytes IS NULL OR size_bytes >= 0),
  modified_at TEXT,
  UNIQUE (scan_id, relative_path)
);

CREATE INDEX filesystem_entries_scan_parent
  ON filesystem_entries (scan_id, parent_path);

CREATE TABLE workspace_preferences (
  workspace_id TEXT PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  preferred_dashboard_view TEXT CHECK (
    preferred_dashboard_view IS NULL
    OR preferred_dashboard_view IN ('projects', 'console')
  ),
  dashboard_sort TEXT CHECK (
    dashboard_sort IS NULL
    OR dashboard_sort IN ('source_order', 'reverse_source_order')
  ),
  preferred_studio_view TEXT CHECK (
    preferred_studio_view IS NULL
    OR preferred_studio_view IN ('ide', 'multipista')
  ),
  updated_at TEXT NOT NULL
);

CREATE TABLE project_preferences (
  project_id TEXT PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  preferred_studio_view TEXT CHECK (
    preferred_studio_view IS NULL
    OR preferred_studio_view IN ('ide', 'multipista')
  ),
  selected_file_path TEXT,
  updated_at TEXT NOT NULL
);

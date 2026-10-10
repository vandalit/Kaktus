export type Project = {
  id: string;
  title: string;
  description: string;
  folders: number;
  files: number;
  stack: string[];
  projectType: string;
};

export type DashboardView = "projects" | "console";
export type StudioViewId = "ide" | "multipista";
export type DashboardSort = "source_order" | "reverse_source_order";

export type WorkspacePreferences = {
  preferred_dashboard_view: DashboardView | null;
  dashboard_sort: DashboardSort | null;
  preferred_studio_view: StudioViewId | null;
};

export type ProjectPreferences = {
  preferred_studio_view: StudioViewId | null;
  selected_file_path: string | null;
};

export type ProjectTreeEntry = {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: ProjectTreeEntry[];
};

export type SourceDirectoryEntry = {
  name: string;
  type: "file" | "directory";
  relativePath: string;
};

export type SourceBrowserDirectory = {
  rootName: string;
  rootPathSegments: string[];
  locationSegments: string[];
  relativePath: string;
  entries: SourceDirectoryEntry[];
  truncated: boolean;
};

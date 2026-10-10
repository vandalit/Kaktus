import type {
  DashboardSort,
  Project,
  ProjectPreferences,
  ProjectTreeEntry,
  SourceBrowserDirectory,
  WorkspacePreferences
} from "../types";

type ApiErrorResponse = {
  error?: string;
};

type ProjectsResponse = {
  projects: Project[];
};

type PreferencesResponse<T> = {
  preferences: T;
};

type ProjectTreeResponse = {
  rootName: string;
  entries: ProjectTreeEntry[];
};

type ProjectFileResponse = {
  file: {
    path: string;
    content: string;
    size: number;
  };
};

type ScanResponse = {
  scan: {
    projectCount: number;
    failedProjects: string[];
    complete: boolean;
  };
};

export type ApiHealth = {
  status: "ok" | "error";
  database: "ok" | "unavailable";
};

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json() as T & ApiErrorResponse;
  if (!response.ok) {
    throw new Error(body.error || `La solicitud local falló (${response.status}).`);
  }
  return body;
}

function jsonPatch(body: object): RequestInit {
  return {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

export async function getProjects(): Promise<Project[]> {
  const result = await requestJson<ProjectsResponse>("/api/projects");
  return result.projects;
}

export function getSourceBrowserDirectory(
  workspaceId: string,
  relativePath = "",
  signal?: AbortSignal
): Promise<SourceBrowserDirectory> {
  const query = new URLSearchParams();
  if (relativePath) query.set("path", relativePath);
  const suffix = query.size ? `?${query.toString()}` : "";
  return requestJson(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/source-browser${suffix}`,
    { signal }
  );
}

export function getApiHealth(): Promise<ApiHealth> {
  return requestJson("/api/health");
}

export async function getProjectTree(projectId: string, signal?: AbortSignal): Promise<ProjectTreeResponse> {
  return requestJson(`/api/projects/${encodeURIComponent(projectId)}/tree`, { signal });
}

export async function getProjectFile(
  projectId: string,
  relativePath: string,
  signal?: AbortSignal
): Promise<ProjectFileResponse["file"]> {
  const query = new URLSearchParams({ path: relativePath });
  const result = await requestJson<ProjectFileResponse>(
    `/api/projects/${encodeURIComponent(projectId)}/file?${query.toString()}`,
    { signal }
  );
  return result.file;
}

export async function getWorkspacePreferences(workspaceId: string): Promise<WorkspacePreferences> {
  const result = await requestJson<PreferencesResponse<WorkspacePreferences>>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/preferences`
  );
  return result.preferences;
}

export async function patchWorkspacePreferences(
  workspaceId: string,
  patch: Partial<WorkspacePreferences>
): Promise<WorkspacePreferences> {
  const result = await requestJson<PreferencesResponse<WorkspacePreferences>>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/preferences`,
    jsonPatch(patch)
  );
  return result.preferences;
}

export async function getProjectPreferences(projectId: string): Promise<ProjectPreferences> {
  const result = await requestJson<PreferencesResponse<ProjectPreferences>>(
    `/api/projects/${encodeURIComponent(projectId)}/preferences`
  );
  return result.preferences;
}

export async function patchProjectPreferences(
  projectId: string,
  patch: Partial<ProjectPreferences>
): Promise<ProjectPreferences> {
  const result = await requestJson<PreferencesResponse<ProjectPreferences>>(
    `/api/projects/${encodeURIComponent(projectId)}/preferences`,
    jsonPatch(patch)
  );
  return result.preferences;
}

export async function rescanWorkspace(workspaceId: string): Promise<ScanResponse["scan"]> {
  const result = await requestJson<ScanResponse>(
    `/api/workspaces/${encodeURIComponent(workspaceId)}/scan`,
    { method: "POST" }
  );
  return result.scan;
}

export function dashboardSortPreference(isSourceOrder: boolean): DashboardSort {
  return isSourceOrder ? "source_order" : "reverse_source_order";
}

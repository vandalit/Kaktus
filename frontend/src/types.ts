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

export type ProjectTreeEntry = {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: ProjectTreeEntry[];
};

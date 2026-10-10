import { ArrowLeft, ChevronDown, FolderKanban } from "lucide-react";
import StudioViewSwitcher from "./StudioViewSwitcher";
import type { Project, StudioViewId } from "../types";

type StudioNavigationBarProps = {
  project: Project;
  projects: Project[];
  activeView: StudioViewId;
  onBack: () => void;
  onChangeView: (view: StudioViewId) => void;
  onSwitchProject: (projectId: string) => void;
};

function StudioNavigationBar({ project, projects, activeView, onBack, onChangeView, onSwitchProject }: StudioNavigationBarProps) {
  return (
    <header className="studio-navigation">
      <button className="studio-navigation__back" type="button" onClick={onBack} aria-label="Volver al resumen del proyecto">
        <ArrowLeft size={15} />
      </button>
      <span className="studio-navigation__project-icon"><FolderKanban size={16} /></span>
      <div className="studio-navigation__identity">
        <label className="studio-navigation__project-picker">
          <select
            aria-label="Cambiar de proyecto"
            value={project.id}
            onChange={(event) => onSwitchProject(event.currentTarget.value)}
          >
            {projects.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
          <ChevronDown size={12} aria-hidden="true" />
        </label>
        <span>{project.id}</span>
      </div>
      <span className="studio-navigation__divider" />
      <StudioViewSwitcher activeView={activeView} onChange={onChangeView} />
      <div className="studio-navigation__context">
        <span><i /> STUDIO</span>
        <span>LOCAL</span>
      </div>
    </header>
  );
}

export default StudioNavigationBar;

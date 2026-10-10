import { ArrowLeft, FolderKanban } from "lucide-react";
import StudioViewSwitcher from "./StudioViewSwitcher";
import type { Project, StudioViewId } from "../types";

type StudioNavigationBarProps = {
  project: Project;
  activeView: StudioViewId;
  onBack: () => void;
  onChangeView: (view: StudioViewId) => void;
};

function StudioNavigationBar({ project, activeView, onBack, onChangeView }: StudioNavigationBarProps) {
  return (
    <header className="studio-navigation">
      <button className="studio-navigation__back" type="button" onClick={onBack} aria-label="Volver al resumen del proyecto">
        <ArrowLeft size={15} />
      </button>
      <span className="studio-navigation__project-icon"><FolderKanban size={16} /></span>
      <div className="studio-navigation__identity">
        <strong>{project.title}</strong>
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

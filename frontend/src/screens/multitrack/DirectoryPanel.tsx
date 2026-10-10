import { ChevronDown, File, Folder, FolderOpen } from "lucide-react";
import type { Project } from "../../types";

type DirectoryPanelProps = {
  project: Project;
};

function DirectoryPanel({ project }: DirectoryPanelProps) {
  return (
    <section className="multitrack-directory" aria-label="Directorio del proyecto">
      <header className="multitrack-panel-heading">
        <div><Folder size={14} /><span>DIRECTORIO</span></div>
        <span className="multitrack-panel-heading__mock">MAQUETA</span>
      </header>
      <div className="multitrack-directory__root">
        <ChevronDown size={13} />
        <FolderOpen size={14} />
        <strong>{project.id}</strong>
      </div>
      <div className="multitrack-directory__empty">
        <div><Folder size={19} /><File size={16} /></div>
        <span>Arrastra recursos aquí</span>
        <small>El directorio multipista está en construcción.</small>
      </div>
    </section>
  );
}

export default DirectoryPanel;

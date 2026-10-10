import { Maximize2, MonitorPlay, Play } from "lucide-react";
import type { Project } from "../../types";

type PreviewPanelProps = {
  project: Project;
};

function PreviewPanel({ project }: PreviewPanelProps) {
  return (
    <section className="multitrack-preview" aria-label="Preview del proyecto">
      <header className="multitrack-panel-heading">
        <div><MonitorPlay size={14} /><span>PREVIEW</span></div>
        <span className="multitrack-panel-heading__mock">MOCK</span>
      </header>
      <div className="multitrack-preview__canvas">
        <div className="multitrack-preview__frame">
          <span className="multitrack-preview__project">{project.title}</span>
          <span className="multitrack-preview__play"><Play size={17} fill="currentColor" /></span>
          <span className="multitrack-preview__caption">VISTA PREVIA NO DISPONIBLE</span>
        </div>
      </div>
      <footer className="multitrack-preview__footer">
        <span>00:00:00:00</span>
        <span>16:9 · 1080p</span>
        <Maximize2 size={13} />
      </footer>
    </section>
  );
}

export default PreviewPanel;

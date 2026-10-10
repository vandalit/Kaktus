import { MonitorPlay } from "lucide-react";

function PreviewPanel() {
  return (
    <section className="multitrack-preview" aria-label="Preview del proyecto">
      <header className="multitrack-panel-heading">
        <div><MonitorPlay size={14} /><span>PREVIEW</span></div>
      </header>
      <div className="multitrack-preview__canvas" />
    </section>
  );
}

export default PreviewPanel;

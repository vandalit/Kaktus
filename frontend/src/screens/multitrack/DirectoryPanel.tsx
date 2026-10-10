import { Folder } from "lucide-react";

function DirectoryPanel() {
  return (
    <section className="multitrack-directory" aria-label="Directorio del proyecto">
      <header className="multitrack-panel-heading">
        <div><Folder size={14} /><span>DIRECTORIO</span></div>
      </header>
      <div className="multitrack-directory__canvas" />
    </section>
  );
}

export default DirectoryPanel;

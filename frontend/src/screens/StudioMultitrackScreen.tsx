import { useState } from "react";
import type { Project } from "../types";
import DirectoryPanel from "./multitrack/DirectoryPanel";
import PreviewPanel from "./multitrack/PreviewPanel";
import TimelinePanel from "./multitrack/TimelinePanel";

type StudioMultitrackScreenProps = {
  project: Project;
};

function StudioMultitrackScreen({ project }: StudioMultitrackScreenProps) {
  const [glassTheme, setGlassTheme] = useState(false);

  return (
    <section
      className={`studio-multitrack${glassTheme ? " studio-multitrack--glass" : ""}`}
      aria-label={`Vista multipista de ${project.title}`}
    >
      <div className="studio-multitrack__workspace">
        <div className="studio-multitrack__top-panels">
          <PreviewPanel />
          <DirectoryPanel />
        </div>
        <TimelinePanel
          projectId={project.id}
          glassTheme={glassTheme}
          onToggleGlass={() => setGlassTheme((current) => !current)}
        />
      </div>
    </section>
  );
}

export default StudioMultitrackScreen;

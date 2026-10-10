import type { Project } from "../types";
import DirectoryPanel from "./multitrack/DirectoryPanel";
import PreviewPanel from "./multitrack/PreviewPanel";
import TimelinePanel from "./multitrack/TimelinePanel";

type StudioMultitrackScreenProps = {
  project: Project;
};

function StudioMultitrackScreen({ project }: StudioMultitrackScreenProps) {
  return (
    <section className="studio-multitrack" aria-label={`Vista multipista de ${project.title}`}>
      <div className="studio-multitrack__notice">
        Vista de maqueta: preview, recursos y pistas son bloques de estructura; todavía no hay reproducción ni edición de medios.
      </div>
      <div className="studio-multitrack__workspace">
        <div className="studio-multitrack__top-panels">
          <PreviewPanel project={project} />
          <DirectoryPanel project={project} />
        </div>
        <TimelinePanel />
      </div>
    </section>
  );
}

export default StudioMultitrackScreen;

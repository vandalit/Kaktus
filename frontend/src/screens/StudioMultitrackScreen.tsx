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
      <div className="studio-multitrack__workspace">
        <div className="studio-multitrack__top-panels">
          <PreviewPanel />
          <DirectoryPanel />
        </div>
        <TimelinePanel />
      </div>
    </section>
  );
}

export default StudioMultitrackScreen;

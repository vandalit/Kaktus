import { AudioLines } from "lucide-react";

const tracks = [
  { color: "violet", blocks: ["wide", "short"] },
  { color: "mint", blocks: ["medium"] },
  { color: "blue", blocks: ["short", "wide"] },
  { color: "amber", blocks: [] }
];

function TimelinePanel() {
  return (
    <section className="multitrack-timeline" aria-label="Editor multipista">
      <header className="multitrack-timeline__toolbar">
        <div className="multitrack-timeline__title">
          <span><AudioLines size={15} /></span>
          <strong>MULTIPISTA</strong>
        </div>
      </header>

      <div className="multitrack-timeline__scroll">
        <div className="multitrack-timeline__canvas">
          <div className="multitrack-tracks">
            <div className="multitrack-tracks__headers" aria-hidden="true">
              <div className="multitrack-tracks__label" />
              <div className="multitrack-tracks__columns">
                {tracks.map((track) => <span key={track.color} />)}
              </div>
            </div>
            {tracks.map((track, index) => (
              <div className="multitrack-track" key={track.color} aria-label={`Fila multipista ${index + 1}`}>
                <div className="multitrack-track__identity">
                  <span className={`multitrack-track__swatch is-${track.color}`} />
                </div>
                <div className="multitrack-track__lane">
                  {track.blocks.map((block, blockIndex) => (
                    <span className={`multitrack-clip is-${track.color} is-${block}`} key={`${track.color}-${blockIndex}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TimelinePanel;

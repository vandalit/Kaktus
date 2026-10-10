import { AudioLines, CirclePlus, Clock3, Layers3, Plus, SlidersHorizontal } from "lucide-react";

const tracks = [
  { label: "PISTA 01", color: "violet", blocks: ["wide", "short"] },
  { label: "PISTA 02", color: "mint", blocks: ["medium"] },
  { label: "PISTA 03", color: "blue", blocks: ["short", "wide"] },
  { label: "PISTA 04", color: "amber", blocks: [] }
];

function TimelinePanel() {
  return (
    <section className="multitrack-timeline" aria-label="Editor multipista">
      <header className="multitrack-timeline__toolbar">
        <div className="multitrack-timeline__title">
          <span><AudioLines size={15} /></span>
          <div><strong>SECUENCIA</strong><small>00:00:00:00 · 24 FPS</small></div>
        </div>
        <span className="multitrack-timeline__mock">MOCK · SIN REPRODUCCIÓN</span>
        <button type="button" disabled title="Añadir pistas estará disponible próximamente."><Plus size={14} /> Pista</button>
        <button className="multitrack-timeline__settings" type="button" disabled aria-label="Ajustes de pistas" title="Ajustes no disponibles"><SlidersHorizontal size={14} /></button>
      </header>

      <div className="multitrack-timeline__scroll">
        <div className="multitrack-timeline__canvas">
          <div className="multitrack-ruler">
            <div className="multitrack-ruler__label"><Clock3 size={12} /> TIEMPO</div>
            {["00:00", "00:05", "00:10", "00:15", "00:20", "00:25"].map((time) => (
              <span key={time}>{time}</span>
            ))}
          </div>

          <div className="multitrack-tracks">
            <div className="multitrack-tracks__headers">
              <div className="multitrack-tracks__label"><span>PISTAS</span><Layers3 size={13} /></div>
              <div className="multitrack-tracks__columns">
                {["A", "B", "C", "D", "E", "F"].map((column) => <span key={column}>{column}</span>)}
              </div>
            </div>
            {tracks.map((track, index) => (
              <div className="multitrack-track" key={track.label}>
                <div className="multitrack-track__identity">
                  <span className={`multitrack-track__swatch is-${track.color}`} />
                  <strong>{track.label}</strong>
                  <small>{index < 2 ? "VIDEO" : "AUDIO"}</small>
                  <button type="button" disabled aria-label={`Opciones de ${track.label}`} title="Opciones no disponibles">···</button>
                </div>
                <div className="multitrack-track__lane">
                  {track.blocks.map((block, blockIndex) => (
                    <span className={`multitrack-clip is-${track.color} is-${block}`} key={`${track.label}-${blockIndex}`} />
                  ))}
                  {track.blocks.length === 0 && <span className="multitrack-track__placeholder"><CirclePlus size={13} /> Área vacía</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="multitrack-timeline__footer">
        <span><i /> Skeleton de interfaz</span>
        <span>Las pistas y controles todavía no editan medios</span>
      </footer>
    </section>
  );
}

export default TimelinePanel;

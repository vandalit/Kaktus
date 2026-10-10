import { AudioLines, Braces, Code2, Database, Layers3, Palette, Workflow } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";

const tracks = [
  { color: "violet", icon: Code2 },
  { color: "cyan", icon: Workflow },
  { color: "coral", icon: Palette },
  { color: "lime", icon: Database },
  { color: "amber", icon: Layers3 },
  { color: "rose", icon: Braces }
];

type TimelinePanelProps = {
  projectId: string;
  glassTheme: boolean;
  onToggleGlass: () => void;
};

type BlockSize = {
  lengthColumns: number;
  startColumn: number;
};

type BlockSizes = Record<string, BlockSize>;

type ResizeSession = {
  pointerId: number;
  channel: string;
  mode: "move" | "resize-left" | "resize-right";
  startX: number;
  startColumn: number;
  startLength: number;
  gridUnit: number;
  moved: boolean;
};

const DEFAULT_BLOCK_SIZE: BlockSize = { lengthColumns: 3, startColumn: 0 };
const MIN_BLOCK_LENGTH = 2;
const MAX_BLOCK_LENGTH = 9;
const EXPANDED_BLOCK_HEIGHT = 320;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function storageKey(projectId: string) {
  return `kaktus:studio:multitrack-sizes:${projectId}`;
}

function expandedStorageKey(projectId: string) {
  return `kaktus:studio:multitrack-expanded:${projectId}`;
}

function readBlockSizes(projectId: string): BlockSizes {
  const stored = window.localStorage.getItem(storageKey(projectId));
  if (stored === null) return {};

  const parsed: unknown = JSON.parse(stored);
  if (!isRecord(parsed)) throw new Error("Las dimensiones guardadas de Multipista tienen un formato inválido.");

  const sizes: BlockSizes = {};
  for (const [channel, value] of Object.entries(parsed)) {
    if (!isRecord(value)) {
      throw new Error("Las dimensiones guardadas de Multipista no son válidas.");
    }
    const lengthColumns = value.lengthColumns ?? value.compactColumns;
    const startColumn = value.startColumn ?? 0;
    if (typeof lengthColumns !== "number"
      || !Number.isInteger(lengthColumns)
      || lengthColumns < MIN_BLOCK_LENGTH
      || lengthColumns > MAX_BLOCK_LENGTH
      || typeof startColumn !== "number"
      || !Number.isInteger(startColumn)
      || startColumn < 0
      || startColumn + lengthColumns > MAX_BLOCK_LENGTH) {
      throw new Error("Las dimensiones guardadas de Multipista no son válidas.");
    }
    sizes[channel] = { lengthColumns, startColumn };
  }
  return sizes;
}

function readExpandedTracks(projectId: string): Set<string> {
  const stored = window.localStorage.getItem(expandedStorageKey(projectId));
  if (stored === null) return new Set();

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed) || parsed.some((channel) => typeof channel !== "string")) {
    throw new Error("Las pistas expandidas guardadas no son válidas.");
  }
  const knownTracks = new Set(tracks.map((track) => track.color));
  return new Set(parsed.filter((channel: string) => knownTracks.has(channel)));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function TimelinePanel({ projectId, glassTheme, onToggleGlass }: TimelinePanelProps) {
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(() => new Set());
  const [expandedLoadedFor, setExpandedLoadedFor] = useState<string | null>(null);
  const [expandedLoadFailed, setExpandedLoadFailed] = useState(false);
  const [blockSizes, setBlockSizes] = useState<BlockSizes>({});
  const [sizesLoadedFor, setSizesLoadedFor] = useState<string | null>(null);
  const [sizeLoadFailed, setSizeLoadFailed] = useState(false);
  const [storageNotice, setStorageNotice] = useState("");
  const [draggingTrack, setDraggingTrack] = useState<string | null>(null);
  const resizeSession = useRef<ResizeSession | null>(null);
  const suppressNextToggle = useRef(false);

  useEffect(() => {
    setExpandedLoadedFor(null);
    setExpandedLoadFailed(false);
    try {
      setExpandedTracks(readExpandedTracks(projectId));
    } catch (error) {
      setExpandedTracks(new Set());
      setExpandedLoadFailed(true);
      setStorageNotice(`No se pudieron cargar las pistas expandidas: ${errorMessage(error)}`);
    }
    setExpandedLoadedFor(projectId);
  }, [projectId]);

  useEffect(() => {
    if (expandedLoadedFor !== projectId || expandedLoadFailed) return;
    try {
      window.localStorage.setItem(expandedStorageKey(projectId), JSON.stringify([...expandedTracks]));
      setStorageNotice("");
    } catch (error) {
      setStorageNotice(`No se pudo guardar el estado de expansión: ${errorMessage(error)}`);
    }
  }, [expandedLoadFailed, expandedLoadedFor, expandedTracks, projectId]);

  useEffect(() => {
    setSizesLoadedFor(null);
    setSizeLoadFailed(false);
    setStorageNotice("");
    try {
      setBlockSizes(readBlockSizes(projectId));
    } catch (error) {
      setBlockSizes({});
      setSizeLoadFailed(true);
      setStorageNotice(`No se pudieron cargar las dimensiones locales: ${errorMessage(error)}`);
    }
    setSizesLoadedFor(projectId);
  }, [projectId]);

  useEffect(() => {
    if (sizesLoadedFor !== projectId || sizeLoadFailed) return;
    try {
      window.localStorage.setItem(storageKey(projectId), JSON.stringify(blockSizes));
      setStorageNotice("");
    } catch (error) {
      setStorageNotice(`No se pudieron guardar las dimensiones locales: ${errorMessage(error)}`);
    }
  }, [blockSizes, projectId, sizeLoadFailed, sizesLoadedFor]);

  function getBlockSize(channel: string): BlockSize {
    return blockSizes[channel] ?? DEFAULT_BLOCK_SIZE;
  }

  function updateBlockSize(channel: string, nextSize: BlockSize) {
    setBlockSizes((current) => {
      const currentSize = current[channel] ?? DEFAULT_BLOCK_SIZE;
      if (currentSize.lengthColumns === nextSize.lengthColumns && currentSize.startColumn === nextSize.startColumn) return current;
      setSizeLoadFailed(false);
      setStorageNotice("");
      return { ...current, [channel]: nextSize };
    });
  }

  function toggleTrack(trackColor: string) {
    setExpandedTracks((current) => {
      const next = new Set(current);
      if (next.has(trackColor)) next.delete(trackColor);
      else next.add(trackColor);
      setExpandedLoadFailed(false);
      return next;
    });
  }

  function setAllTracksExpanded(expanded: boolean) {
    setExpandedTracks(expanded
      ? new Set(tracks.map((track) => track.color))
      : new Set());
    setExpandedLoadFailed(false);
  }

  function startBlockDrag(event: PointerEvent<HTMLButtonElement>, channel: string, mode: ResizeSession["mode"]) {
    const lane = event.currentTarget.closest(".multitrack-track__lane");
    if (!(lane instanceof HTMLElement)) {
      setStorageNotice("No se pudo iniciar el ajuste del bloque.");
      return;
    }

    const laneStyle = window.getComputedStyle(lane);
    const laneContentWidth = lane.clientWidth
      - Number.parseFloat(laneStyle.paddingLeft)
      - Number.parseFloat(laneStyle.paddingRight);
    const gridUnit = laneContentWidth / 9;
    if (gridUnit <= 0) {
      setStorageNotice("No se pudo medir el canvas para ajustar el bloque.");
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    const currentSize = getBlockSize(channel);
    resizeSession.current = {
      pointerId: event.pointerId,
      channel,
      mode,
      startX: event.clientX,
      startColumn: currentSize.startColumn,
      startLength: currentSize.lengthColumns,
      gridUnit,
      moved: false
    };
  }

  function continueResize(event: PointerEvent<HTMLButtonElement>) {
    const session = resizeSession.current;
    if (!session || session.pointerId !== event.pointerId) return;

    const pixelDelta = event.clientX - session.startX;
    if (session.mode === "move" && !session.moved) {
      if (Math.abs(pixelDelta) < 5) return;
      session.moved = true;
      setDraggingTrack(session.channel);
    }
    const columnDelta = Math.round((event.clientX - session.startX) / session.gridUnit);
    if (session.mode === "move") {
      const startColumn = Math.max(0, Math.min(MAX_BLOCK_LENGTH - session.startLength, session.startColumn + columnDelta));
      updateBlockSize(session.channel, { startColumn, lengthColumns: session.startLength });
      return;
    }

    if (session.mode === "resize-right") {
      const lengthColumns = Math.max(MIN_BLOCK_LENGTH, Math.min(MAX_BLOCK_LENGTH - session.startColumn, session.startLength + columnDelta));
      updateBlockSize(session.channel, { startColumn: session.startColumn, lengthColumns });
      return;
    }

    const endColumn = session.startColumn + session.startLength;
    const startColumn = Math.max(0, Math.min(endColumn - MIN_BLOCK_LENGTH, session.startColumn + columnDelta));
    updateBlockSize(session.channel, { startColumn, lengthColumns: endColumn - startColumn });
  }

  function finishResize(event: PointerEvent<HTMLButtonElement>) {
    const session = resizeSession.current;
    if (session?.pointerId !== event.pointerId) return;
    if (session.mode === "move" && session.moved) suppressNextToggle.current = true;
    resizeSession.current = null;
    setDraggingTrack(null);
  }

  function adjustBlockWithKeyboard(event: KeyboardEvent<HTMLButtonElement>, channel: string, mode: ResizeSession["mode"]) {
    const delta = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (delta === 0) return;

    event.preventDefault();
    const size = getBlockSize(channel);
    if (mode === "move") {
      const startColumn = Math.max(0, Math.min(MAX_BLOCK_LENGTH - size.lengthColumns, size.startColumn + delta));
      updateBlockSize(channel, { ...size, startColumn });
      return;
    }

    if (mode === "resize-right") {
      const lengthColumns = Math.max(MIN_BLOCK_LENGTH, Math.min(MAX_BLOCK_LENGTH - size.startColumn, size.lengthColumns + delta));
      updateBlockSize(channel, { ...size, lengthColumns });
      return;
    }

    const endColumn = size.startColumn + size.lengthColumns;
    const startColumn = Math.max(0, Math.min(endColumn - MIN_BLOCK_LENGTH, size.startColumn + delta));
    updateBlockSize(channel, { startColumn, lengthColumns: endColumn - startColumn });
  }

  return (
    <section className="multitrack-timeline" aria-label="Editor multipista">
      <header className="multitrack-timeline__toolbar">
        <div className="multitrack-timeline__title">
          <span><AudioLines size={15} /></span>
          <strong>MULTIPISTA</strong>
        </div>
        <div className="multitrack-timeline__toolbar-actions">
          <button
            className="multitrack-timeline__action"
            type="button"
            disabled={expandedTracks.size === tracks.length}
            onClick={() => setAllTracksExpanded(true)}
          >
            Expandir todo
          </button>
          <button
            className="multitrack-timeline__action"
            type="button"
            disabled={expandedTracks.size === 0}
            onClick={() => setAllTracksExpanded(false)}
          >
            Comprimir todo
          </button>
          <button
            className="multitrack-timeline__theme-toggle"
            type="button"
            aria-pressed={glassTheme}
            aria-label={`Cambiar estilo a ${glassTheme ? "sólido" : "cristal"}`}
            onClick={onToggleGlass}
          >
            {glassTheme ? "ESTILO · CRISTAL" : "ESTILO · SÓLIDO"}
          </button>
        </div>
      </header>
      {storageNotice && <div className="multitrack-timeline__storage-notice" role="alert">{storageNotice}</div>}

      <div className="multitrack-timeline__scroll">
        <div className="multitrack-timeline__canvas">
          <div className="multitrack-tracks">
            <div className="multitrack-tracks__headers" aria-hidden="true">
              <div className="multitrack-tracks__label" />
              <div className="multitrack-tracks__columns">
                {Array.from({ length: 9 }, (_, columnIndex) => <span key={columnIndex} />)}
              </div>
            </div>
            {tracks.map((track, trackIndex) => {
              const isExpanded = expandedTracks.has(track.color);
              const size = getBlockSize(track.color);

              return (
                <div
                  className={`multitrack-track${isExpanded ? " is-expanded" : ""}`}
                  key={track.color}
                  aria-label={`Canal ${trackIndex + 1}`}
                >
                  <div className="multitrack-track__identity">
                    <track.icon size={16} aria-hidden="true" />
                    <span>{String(trackIndex + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="multitrack-track__lane">
                    <div
                      className={`multitrack-clip is-${track.color}${isExpanded ? " is-expanded" : ""}${draggingTrack === track.color ? " is-dragging" : ""}`}
                      style={{
                        gridColumn: `${size.startColumn + 1} / span ${size.lengthColumns}`,
                        height: isExpanded ? EXPANDED_BLOCK_HEIGHT : undefined
                      }}
                    >
                      <button
                        className="multitrack-clip__toggle"
                        type="button"
                        aria-label={`${isExpanded ? "Contraer" : "Expandir"} bloque del canal ${trackIndex + 1}`}
                        aria-expanded={isExpanded}
                        onPointerDown={(event) => startBlockDrag(event, track.color, "move")}
                        onPointerMove={continueResize}
                        onPointerUp={finishResize}
                        onPointerCancel={finishResize}
                        onKeyDown={(event) => adjustBlockWithKeyboard(event, track.color, "move")}
                        onClick={() => {
                          if (suppressNextToggle.current) {
                            suppressNextToggle.current = false;
                            return;
                          }
                          toggleTrack(track.color);
                        }}
                      >
                        {!isExpanded && (
                          <track.icon className="multitrack-clip__icon" size={22} aria-hidden="true" />
                        )}
                      </button>
                      <button
                        className="multitrack-clip__edge multitrack-clip__edge--start"
                        type="button"
                        aria-label={`Ajustar inicio del bloque del canal ${trackIndex + 1}`}
                        title="Arrastra el borde para ajustar el inicio; usa flechas izquierda y derecha"
                        onPointerDown={(event) => startBlockDrag(event, track.color, "resize-left")}
                        onPointerMove={continueResize}
                        onPointerUp={finishResize}
                        onPointerCancel={finishResize}
                        onKeyDown={(event) => adjustBlockWithKeyboard(event, track.color, "resize-left")}
                      />
                      <button
                        className="multitrack-clip__edge multitrack-clip__edge--end"
                        type="button"
                        aria-label={`Ajustar fin del bloque del canal ${trackIndex + 1}`}
                        title="Arrastra el borde para ajustar el fin; usa flechas izquierda y derecha"
                        onPointerDown={(event) => startBlockDrag(event, track.color, "resize-right")}
                        onPointerMove={continueResize}
                        onPointerUp={finishResize}
                        onPointerCancel={finishResize}
                        onKeyDown={(event) => adjustBlockWithKeyboard(event, track.color, "resize-right")}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TimelinePanel;

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  File,
  Folder,
  FolderOpen,
  HardDrive,
  Home,
  LockKeyhole,
  RotateCw
} from "lucide-react";
import { getSourceBrowserDirectory } from "../api/client";
import type { SourceBrowserDirectory } from "../types";

type LocalFolderExplorerProps = {
  workspaceId: string;
  onBack: () => void;
  onAccept: () => void;
};

function LocalFolderExplorer({ workspaceId, onBack, onAccept }: LocalFolderExplorerProps) {
  const [relativePath, setRelativePath] = useState("");
  const [directory, setDirectory] = useState<SourceBrowserDirectory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    getSourceBrowserDirectory(workspaceId, relativePath, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDirectory(result);
      })
      .catch((loadError: unknown) => {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error
            ? loadError.message
            : "No se pudo leer el directorio local.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [relativePath, refreshVersion, workspaceId]);

  const rootDepth = directory?.rootPathSegments.length ?? 0;
  const relativeSegments = relativePath ? relativePath.split("/") : [];

  function navigateToBreadcrumb(index: number) {
    if (index < rootDepth - 1) return;
    setRelativePath(relativeSegments.slice(0, index - rootDepth + 1).join("/"));
  }

  function navigateUp() {
    setRelativePath(relativeSegments.slice(0, -1).join("/"));
  }

  return (
    <main className="folder-explorer">
      <header className="folder-explorer__topbar">
        <button className="folder-explorer__back" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Volver</span>
        </button>
        <span className="folder-explorer__title"><FolderOpen size={16} /> Explorador de carpetas</span>
        <span className="folder-explorer__environment"><LockKeyhole size={13} /> ENTORNO DEMO</span>
      </header>

      <div className="folder-explorer__body">
        <aside className="folder-explorer__sidebar" aria-label="Origen fijado">
          <div className="folder-explorer__sidebar-label">ORIGEN DEL WORKSPACE</div>
          {directory && (
            <div className="folder-explorer__root-card" aria-current="location">
              <span className="folder-explorer__root-icon"><FolderOpen size={17} /></span>
              <span>
                <strong>{directory.rootName}</strong>
                <small>Carpeta local de demostración</small>
              </span>
              <LockKeyhole size={13} aria-label="Ubicación bloqueada" />
            </div>
          )}
          <div className="folder-explorer__lock-note">
            <LockKeyhole size={14} />
            <span>La ubicación seleccionada está fijada durante el desarrollo. Puedes explorar su contenido, pero no cambiar la raíz.</span>
          </div>
          <div className="folder-explorer__sidebar-foot">
            <HardDrive size={14} />
            <span>LECTURA LOCAL · SIN SUBIR ARCHIVOS</span>
          </div>
        </aside>

        <section className="folder-explorer__main" aria-label="Contenido del directorio">
          <div className="folder-explorer__heading">
            <div>
              <span className="folder-explorer__eyebrow">SELECCIÓN DE CARPETA</span>
              <h1>Explora el filesystem local</h1>
              <p>La estructura y los nombres se leen desde el disco. La raíz de esta demo no se puede modificar.</p>
            </div>
            <button
              className="folder-explorer__refresh"
              type="button"
              aria-label="Actualizar directorio"
              title="Volver a leer este directorio"
              disabled={loading}
              onClick={() => {
                setDirectory(null);
                setRefreshVersion((current) => current + 1);
              }}
            >
              <RotateCw size={15} />
            </button>
          </div>

          {directory && (
            <nav className="folder-explorer__breadcrumbs" aria-label="Ubicación actual">
              {directory.locationSegments.map((segment, index) => {
                const isInsideRoot = index >= rootDepth - 1;
                const isCurrent = index === directory.locationSegments.length - 1;
                return (
                  <span className="folder-explorer__crumb" key={`${segment}-${index}`}>
                    {index > 0 && <ChevronRight size={13} aria-hidden="true" />}
                    <button
                      type="button"
                      disabled={!isInsideRoot || isCurrent}
                      aria-current={isCurrent ? "location" : undefined}
                      onClick={() => navigateToBreadcrumb(index)}
                    >
                      {index === 0 && segment === "~" && <Home size={13} />}
                      {segment}
                    </button>
                  </span>
                );
              })}
              <span className="folder-explorer__path-lock"><LockKeyhole size={12} /> RAÍZ FIJADA</span>
            </nav>
          )}

          <div className="folder-explorer__list">
            <div className="folder-explorer__list-heading">
              <span>ELEMENTO</span>
              <span>TIPO</span>
            </div>
            {loading && <div className="folder-explorer__state" role="status">Leyendo el directorio local…</div>}
            {!loading && error && (
              <div className="folder-explorer__state folder-explorer__state--error" role="alert">
                <span>{error}</span>
                <button type="button" onClick={() => {
                  setDirectory(null);
                  setRefreshVersion((current) => current + 1);
                }}>Reintentar</button>
              </div>
            )}
            {!loading && !error && directory?.relativePath && (
              <button className="folder-explorer__entry folder-explorer__entry--parent" type="button" onClick={navigateUp}>
                <span><Folder size={15} /> ..</span><small>Directorio superior</small>
              </button>
            )}
            {!loading && !error && directory?.entries.map((entry) => {
              const isDirectory = entry.type === "directory";
              return (
                <button
                  className={`folder-explorer__entry${isDirectory ? "" : " folder-explorer__entry--file"}`}
                  type="button"
                  key={entry.relativePath}
                  disabled={!isDirectory}
                  onClick={() => setRelativePath(entry.relativePath)}
                >
                  <span>{isDirectory ? <Folder size={15} /> : <File size={14} />}{entry.name}</span>
                  <small>{isDirectory ? "Carpeta" : "Archivo"}</small>
                  {isDirectory && <ChevronRight className="folder-explorer__entry-arrow" size={14} />}
                </button>
              );
            })}
            {!loading && !error && directory?.entries.length === 0 && (
              <div className="folder-explorer__state">Esta carpeta no contiene elementos.</div>
            )}
            {!loading && directory?.truncated && (
              <div className="folder-explorer__state">Mostrando los primeros 500 elementos de esta carpeta.</div>
            )}
          </div>

          <footer className="folder-explorer__footer">
            <span><FolderOpen size={14} /> Usar raíz fijada: <strong>{directory?.rootName ?? "Workspace demo"}</strong></span>
            <button className="button-primary" type="button" onClick={onAccept}>
              Aceptar y continuar <ArrowRight size={15} />
            </button>
          </footer>
        </section>
      </div>
    </main>
  );
}

export default LocalFolderExplorer;

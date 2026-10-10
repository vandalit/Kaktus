import { useEffect, useMemo, useState } from "react";
import type { CSSProperties, FormEvent } from "react";
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  File,
  FileCode2,
  Folder,
  FolderOpen,
  MessageSquare,
  Send,
  Terminal,
  Workflow
} from "lucide-react";
import type { Project, ProjectTreeEntry } from "../types";

type StudioIdeScreenProps = {
  project: Project;
  onBack: () => void;
};

type ProjectTreeResponse = {
  entries: ProjectTreeEntry[];
  error?: string;
};

type ProjectFileResponse = {
  file: {
    path: string;
    content: string;
    size: number;
  };
  error?: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function firstFile(entries: ProjectTreeEntry[]): string | null {
  for (const entry of entries) {
    if (entry.type === "file") return entry.path;
    const nestedFile = firstFile(entry.children || []);
    if (nestedFile) return nestedFile;
  }
  return null;
}

function StudioIdeScreen({ project, onBack }: StudioIdeScreenProps) {
  const [tree, setTree] = useState<ProjectTreeEntry[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState("");
  const [expandedDirectories, setExpandedDirectories] = useState<Record<string, boolean>>({});
  const [selectedPath, setSelectedPath] = useState("");
  const [fileContent, setFileContent] = useState("");
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatPending, setChatPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    async function loadTree() {
      setTreeLoading(true);
      setTreeError("");
      try {
        const response = await fetch(`/api/projects/${encodeURIComponent(project.id)}/tree`, { signal: controller.signal });
        const result = (await response.json()) as ProjectTreeResponse;
        if (!response.ok) throw new Error(result.error || `No se pudo leer el árbol (${response.status}).`);
        setTree(result.entries);
        setSelectedPath(firstFile(result.entries) || "");
        setExpandedDirectories({});
      } catch (error) {
        if (!controller.signal.aborted) {
          setTreeError(error instanceof Error ? error.message : "No se pudo leer el árbol local.");
        }
      } finally {
        if (!controller.signal.aborted) setTreeLoading(false);
      }
    }
    void loadTree();
    return () => controller.abort();
  }, [project.id]);

  useEffect(() => {
    if (!selectedPath) {
      setFileContent("");
      setFileError("");
      return;
    }

    const controller = new AbortController();
    async function loadFile() {
      setFileLoading(true);
      setFileError("");
      const query = new URLSearchParams({ path: selectedPath });
      try {
        const response = await fetch(
          `/api/projects/${encodeURIComponent(project.id)}/file?${query.toString()}`,
          { signal: controller.signal }
        );
        const result = (await response.json()) as ProjectFileResponse;
        if (!response.ok) throw new Error(result.error || `No se pudo leer el archivo (${response.status}).`);
        setFileContent(result.file.content);
      } catch (error) {
        if (!controller.signal.aborted) {
          setFileContent("");
          setFileError(error instanceof Error ? error.message : "No se pudo leer el archivo local.");
        }
      } finally {
        if (!controller.signal.aborted) setFileLoading(false);
      }
    }
    void loadFile();
    return () => controller.abort();
  }, [project.id, selectedPath]);

  useEffect(() => {
    if (!chatPending) return;
    const responseTimer = window.setTimeout(() => {
      setMessages((current) => [...current, {
        role: "assistant",
        content: "No disponible en esta demo. El chat todavía no está conectado a un asistente."
      }]);
      setChatPending(false);
    }, 10_000);
    return () => window.clearTimeout(responseTimer);
  }, [chatPending]);

  const lineCount = useMemo(() => fileContent.split("\n"), [fileContent]);

  function toggleDirectory(directoryPath: string) {
    setExpandedDirectories((current) => ({
      ...current,
      [directoryPath]: !current[directoryPath]
    }));
  }

  function renderEntries(entries: ProjectTreeEntry[], depth = 0) {
    return entries.map((entry) => {
      if (entry.type === "directory") {
        const isExpanded = expandedDirectories[entry.path] ?? true;
        const FolderIcon = isExpanded ? FolderOpen : Folder;
        return (
          <div className="studio-tree__branch" key={entry.path}>
            <button
              className="studio-tree__item studio-tree__item--directory"
              type="button"
              aria-expanded={isExpanded}
              onClick={() => toggleDirectory(entry.path)}
              style={{ "--tree-depth": depth } as CSSProperties}
            >
              {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              <FolderIcon size={14} />
              <span>{entry.name}</span>
            </button>
            {isExpanded && <div role="group">{renderEntries(entry.children || [], depth + 1)}</div>}
          </div>
        );
      }

      const Icon = /\.[cm]?[jt]sx?$/.test(entry.name) ? FileCode2 : File;
      return (
        <button
          className={`studio-tree__item${selectedPath === entry.path ? " is-selected" : ""}`}
          type="button"
          key={entry.path}
          aria-current={selectedPath === entry.path ? "page" : undefined}
          onClick={() => setSelectedPath(entry.path)}
          style={{ "--tree-depth": depth } as CSSProperties}
          title={entry.path}
        >
          <span className="studio-tree__indent" />
          <Icon size={14} />
          <span>{entry.name}</span>
        </button>
      );
    });
  }

  function submitMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = chatInput.trim();
    if (!message || chatPending) return;
    setMessages((current) => [...current, { role: "user", content: message }]);
    setChatInput("");
    setChatPending(true);
  }

  return (
    <section className="studio-ide" aria-label={`Studio IDE de ${project.title}`}>
      <header className="studio-ide__header">
        <button className="studio-ide__back" type="button" onClick={onBack}>
          <ArrowLeft size={15} />
          <span>Resumen del proyecto</span>
        </button>
        <div className="studio-ide__breadcrumb" aria-label="Ubicación actual">
          <span>Workspace demo</span><span>/</span><span>{project.title}</span><span>/</span><strong>Studio · IDE</strong>
        </div>
        <div className="studio-ide__badges">
          <span className="studio-ide__local"><i /> LOCAL</span>
          <span className="studio-ide__readonly">SOLO LECTURA</span>
        </div>
      </header>

      <div className="studio-ide__notice" role="note">
        <Workflow size={15} />
        <span>
          Árbol y código leídos desde <code>CaseUses/{project.id}/</code>. El editor no guarda cambios.
          Terminal y chat son simulaciones.
        </span>
      </div>

      <div className="studio-ide__layout">
        <aside className="studio-explorer" aria-label="Explorador de archivos">
          <div className="studio-panel-title">
            <span>EXPLORADOR</span>
            <span>{project.files.toString().padStart(2, "0")} ARCHIVOS</span>
          </div>
          <button className="studio-tree__root" type="button" aria-label={`Raíz del proyecto ${project.id}`}>
            <ChevronDown size={13} />
            <FolderOpen size={15} />
            <strong>{project.id}</strong>
          </button>
          {treeLoading && <div className="studio-state"><span className="studio-spinner" /> Leyendo carpeta...</div>}
          {!treeLoading && treeError && <div className="studio-state studio-state--error" role="alert"><CircleAlert size={15} />{treeError}</div>}
          {!treeLoading && !treeError && tree.length === 0 && <div className="studio-state">La carpeta está vacía.</div>}
          {!treeLoading && !treeError && <div className="studio-tree" role="tree">{renderEntries(tree)}</div>}
        </aside>

        <div className="studio-center">
          <section className="studio-editor" aria-label="Editor de código">
            <div className="studio-editor__tabs">
              <div className="studio-editor__tab"><FileCode2 size={14} /><span>{selectedPath ? selectedPath.split("/").at(-1) : "Sin archivo"}</span><i /></div>
              <span className="studio-editor__mode">LECTURA LOCAL</span>
            </div>
            <div className="studio-editor__body">
              {fileLoading && <div className="studio-state"><span className="studio-spinner" /> Leyendo archivo...</div>}
              {!fileLoading && fileError && <div className="studio-state studio-state--error" role="alert"><CircleAlert size={15} />{fileError}</div>}
              {!fileLoading && !fileError && !selectedPath && <div className="studio-state">Selecciona un archivo del explorador.</div>}
              {!fileLoading && !fileError && selectedPath && (
                <pre className="studio-editor__code" aria-label={`Contenido de ${selectedPath}`}>
                  <code>{lineCount.map((line, index) => (
                    <span className="studio-editor__line" key={index}><i>{index + 1}</i><span>{line || " "}</span></span>
                  ))}</code>
                </pre>
              )}
            </div>
            <footer className="studio-editor__status">
              <span>{selectedPath || "Sin archivo seleccionado"}</span>
              <span>{fileContent ? `${lineCount.length} líneas` : "—"}</span>
            </footer>
          </section>

          <section className="studio-terminal" aria-label="Terminal simulada">
            <div className="studio-panel-title">
              <span><Terminal size={14} /> TERMINAL</span>
              <span>MOCK · NO EJECUTA COMANDOS</span>
            </div>
            <div className="studio-terminal__body">
              <div><span>kaktus</span> <b>~/CaseUses/{project.id}</b> $ npm run dev</div>
              <p>Terminal de demostración. La ejecución de comandos todavía no está disponible.</p>
              <div className="studio-terminal__prompt"><span>kaktus</span> <b>~/CaseUses/{project.id}</b> $ <i /></div>
            </div>
          </section>
        </div>

        <aside className="studio-chat" aria-label="Chat del proyecto">
          <div className="studio-panel-title">
            <span><MessageSquare size={14} /> CHAT</span>
            <span className="studio-mock-pill">MOCK</span>
          </div>
          <div className="studio-chat__scope"><Bot size={15} /><span><strong>Asistente del proyecto</strong><small>Respuesta de prueba con demora de 10 s</small></span></div>
          <div className="studio-chat__messages" aria-live="polite">
            <div className="studio-chat__welcome">
              <span><Bot size={16} /></span>
              <p>Escribe un mensaje para probar el estado de espera. No hay un asistente conectado.</p>
            </div>
            {messages.map((message, index) => (
              <div className={`studio-chat__message studio-chat__message--${message.role}`} key={`${message.role}-${index}`}>
                {message.content}
              </div>
            ))}
            {chatPending && <div className="studio-chat__pending" role="status"><span /><span /><span /> Respuesta en 10 segundos…</div>}
          </div>
          <form className="studio-chat__form" onSubmit={submitMessage}>
            <label className="visually-hidden" htmlFor="studio-chat-input">Mensaje para el asistente</label>
            <textarea
              id="studio-chat-input"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Pregunta sobre el proyecto..."
              rows={3}
            />
            <div className="studio-chat__form-footer">
              <span>El asistente aún no está disponible</span>
              <button type="submit" aria-label="Enviar mensaje" disabled={!chatInput.trim() || chatPending}>
                <Send size={14} />
              </button>
            </div>
          </form>
        </aside>
      </div>
    </section>
  );
}

export default StudioIdeScreen;

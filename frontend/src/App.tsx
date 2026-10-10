import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowDownUp,
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Folder,
  FolderOpen,
  Layers3,
  LayoutGrid,
  ListFilter,
  LoaderCircle,
  RotateCw,
  Search,
  Sparkles,
  X
} from "lucide-react";
import OnboardingScreen from "./screens/OnboardingScreen";
import ConsoleDashboardView from "./screens/ConsoleDashboardView";
import ProjectDetailScreen from "./screens/ProjectDetailScreen";
import StudioIdeScreen from "./screens/StudioIdeScreen";
import DashboardViewSwitcher from "./components/DashboardViewSwitcher";
import type { DashboardView, Project } from "./types";

type ProjectsResponse = {
  projects: Project[];
  error?: string;
};

const accents = ["violet", "peach", "mint", "blue"];

type DashboardScreenProps = {
  projectId: string | null;
  dashboardView: DashboardView;
  onOpenProject: (project: Project) => void;
  onOpenStudio: (project: Project) => void;
  onBackToProject: (project: Project) => void;
  onBackToDashboard: () => void;
  onChangeDashboardView: (view: DashboardView) => void;
};

function DashboardScreen({ projectId, studioView, dashboardView, onOpenProject, onOpenStudio, onBackToProject, onBackToDashboard, onChangeDashboardView }: DashboardScreenProps & { studioView: boolean }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [flipped, setFlipped] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [sortNewest, setSortNewest] = useState(true);
  const searchInputRef = useRef<HTMLInputElement>(null);

  async function loadProjects() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/projects");
      const result = (await response.json()) as ProjectsResponse;
      if (!response.ok) throw new Error(result.error || `No se pudieron leer los proyectos (${response.status}).`);
      setProjects(result.projects);
      setFlipped([]);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "No se pudieron leer los proyectos locales.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [projectId]);

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  const visibleProjects = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("es");
    const matching = projects.filter((project) =>
      [project.title, project.description, project.projectType, ...project.stack]
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(query)
    );
    return sortNewest ? matching : [...matching].reverse();
  }, [projects, search, sortNewest]);

  const totalFiles = projects.reduce((sum, project) => sum + project.files, 0);
  const totalFolders = projects.reduce((sum, project) => sum + project.folders, 0);

  function toggleFlip(id: string) {
    setFlipped((current) => current.includes(id)
      ? current.filter((projectId) => projectId !== id)
      : [...current, id]);
  }

  async function copyPath() {
    try {
      await navigator.clipboard.writeText("CaseUses/");
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1700);
    } catch {
      setError("No se pudo copiar la ruta. Puedes encontrarla en la raíz del proyecto.");
    }
  }

  function openProject(project: Project) {
    onOpenProject(project);
  }

  const selectedProject = projects.find((project) => project.id === projectId) ?? null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="/" aria-label="Kaktus, inicio">
          <span className="brand-mark"><span /></span>
          <span>Kaktus</span>
          <span className="brand-beta">LAB</span>
        </a>

        <div className="workspace-card">
          <span className="workspace-icon"><Layers3 size={17} strokeWidth={1.8} /></span>
          <span className="workspace-copy"><strong>Workspace local</strong><small>Este equipo</small></span>
          <ChevronDown size={14} className="muted-icon" />
        </div>

        <p className="nav-caption">EXPLORADOR</p>
        <nav className="sidebar-nav" aria-label="Navegación">
          <a className="nav-item active" href="#proyectos"><LayoutGrid size={17} strokeWidth={1.8} /><span>Proyectos</span><span className="nav-count">{projects.length.toString().padStart(2, "0")}</span></a>
          <button className="nav-item subdued" type="button" onClick={() => setError("La vista de actividad estará disponible más adelante.")}><ArrowDownUp size={17} strokeWidth={1.8} /><span>Actividad</span></button>
        </nav>

        <div className="sidebar-bottom">
          <div className="local-status"><span className="status-pulse" /><span><strong>Solo local</strong><small>Tus archivos no salen de aquí</small></span></div>
          <button className="sidebar-profile" type="button" onClick={copyPath}>
            <span className="profile-avatar">K</span><span><strong>Kaktus</strong><small>{copied ? "Ruta copiada" : "Directorio raíz"}</small></span>
            {copied ? <Check size={15} /> : <ArrowUpRight size={15} />}
          </button>
        </div>
      </aside>

      <main className="main-area" id="proyectos">
        {!projectId && <header className="topbar">
          <div className="breadcrumbs"><span>Workspace</span><span className="crumb-divider">/</span><strong>Proyectos</strong></div>
          <div className="topbar-right">
            <DashboardViewSwitcher activeView={dashboardView} onChange={onChangeDashboardView} />
            <span className="local-badge"><span /> LOCAL WORKSPACE</span><span className="topbar-divider" /><button className="avatar-button" type="button" aria-label="Perfil Kaktus">K</button>
          </div>
        </header>}

        {projectId ? (
          selectedProject ? (
            studioView ? (
              <StudioIdeScreen
                project={selectedProject}
                onBack={() => onBackToProject(selectedProject)}
              />
            ) : (
              <ProjectDetailScreen
                project={selectedProject}
                onBack={onBackToDashboard}
                onEdit={() => onOpenStudio(selectedProject)}
              />
            )
          ) : (
            <div className="project-detail__missing" role={loading ? "status" : "alert"}>
              <strong>{loading ? "Cargando proyecto..." : "No encontramos este proyecto"}</strong>
              {!loading && <button className="button-secondary" type="button" onClick={onBackToDashboard}>Volver a proyectos</button>}
              {error && <span>{error}</span>}
            </div>
          )
        ) : dashboardView === "console" ? (
          <div className="content-wrap content-wrap--console">
            <ConsoleDashboardView
              projects={visibleProjects}
              loading={loading}
              error={error}
            />
          </div>
        ) : <div className="content-wrap">
          <section className="intro-row">
            <div className="intro-copy">
              <div className="overline"><span className="overline-line" /> MAPA DEL WORKSPACE <span className="overline-index">01 — 03</span></div>
              <h1>Hola, <span>explorador.</span></h1>
              <p className="intro-subtitle">Tus proyectos, vistos desde otra perspectiva.</p>
            </div>
            <div className="intro-art" aria-hidden="true">
              <div className="art-orbit orbit-a" /><div className="art-orbit orbit-b" />
              <span className="art-spark spark-a">✳</span><span className="art-spark spark-b">✳</span>
              <span className="art-center"><Layers3 size={24} strokeWidth={1.4} /></span>
            </div>
          </section>

          <section className="overview-grid" aria-label="Resumen del workspace">
            <article className="metric-tile metric-projects">
              <div className="metric-heading"><span>Proyectos encontrados</span><span className="metric-glyph"><FolderOpen size={16} /></span></div>
              <div className="metric-value">{loading ? "—" : projects.length.toString().padStart(2, "0")}<span className="metric-suffix"> proyectos</span></div>
              <div className="metric-foot"><span className="live-dot" /> Leídos desde <code>CaseUses/</code></div>
            </article>
            <article className="metric-tile metric-files">
              <div className="metric-heading"><span>Superficie de código</span><span className="metric-glyph"><Folder size={16} /></span></div>
              <div className="metric-value">{loading ? "—" : totalFiles.toString().padStart(2, "0")}<span className="metric-suffix"> archivos</span></div>
              <div className="metric-foot">En <strong>{loading ? "—" : totalFolders}</strong> carpetas de proyecto</div>
            </article>
            <button className="note-tile" type="button" onClick={copyPath}>
              <span className="note-mark"><Sparkles size={15} /></span>
              <span className="note-text"><strong>{copied ? "Ruta copiada" : "Tu mapa empieza aquí"}</strong><small>{copied ? "CaseUses/ está en el portapapeles" : "Una lectura local. Sin subir archivos."}</small></span>
              <ArrowUpRight size={16} className="note-arrow" />
              <span className="note-decoration" aria-hidden="true">K</span>
            </button>
          </section>

          <section className="projects-section">
            <div className="section-heading">
              <div><div className="section-kicker">TU ESPACIO DE TRABAJO</div><h2>Proyectos <span className="heading-count">{loading ? "…" : projects.length}</span></h2></div>
              <div className="section-actions">
                <label className="search-field"><Search size={16} strokeWidth={1.8} /><input ref={searchInputRef} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar proyecto..." aria-label="Buscar proyecto" /><kbd>Ctrl K</kbd></label>
                <button className="icon-action" type="button" aria-label="Cambiar orden" title="Invertir orden" onClick={() => setSortNewest((current) => !current)}><ListFilter size={17} /><ArrowDown size={11} className="sort-arrow" /></button>
                <button className={`icon-action refresh-button${loading ? " is-loading" : ""}`} type="button" aria-label="Actualizar proyectos" title="Volver a leer CaseUses" onClick={() => void loadProjects()} disabled={loading}><RotateCw size={16} /></button>
              </div>
            </div>

            {error && <div className="error-banner" role="alert"><span>{error}</span><button type="button" onClick={() => void loadProjects()}>Reintentar <ArrowRight size={14} /></button></div>}
            {loading && <div className="loading-state"><LoaderCircle size={19} /><span>Leyendo proyectos locales...</span></div>}
            {!loading && !error && visibleProjects.length === 0 && (
              <div className="empty-state"><Search size={22} /><strong>{projects.length ? "No encontramos ese proyecto" : "Aún no hay proyectos aquí"}</strong><span>{projects.length ? "Prueba con otro nombre o tecnología." : "Añade una carpeta de proyecto dentro de CaseUses/."}</span></div>
            )}

            {!loading && !error && visibleProjects.length > 0 && (
              <div className="project-grid">
                {visibleProjects.map((project, index) => {
                  const accent = accents[index % accents.length];
                  const isFlipped = flipped.includes(project.id);
                  return (
                    <article className={`project-card card-${accent}${index === 0 ? " card-featured" : ""}${isFlipped ? " is-flipped" : ""}`} key={project.id}>
                      <div className="card-inner">
                        <div className="card-face card-front" inert={isFlipped}>
                          <button className="card-open-overlay" type="button" aria-label={`Abrir detalle de ${project.title}`} onClick={() => openProject(project)} />
                          <div className="card-topline">
                            <span className="project-type"><span className="type-dot" />{project.projectType}</span>
                            <button className="flip-control" type="button" aria-label={`Ver ficha de ${project.title}`} aria-pressed={isFlipped} onClick={() => toggleFlip(project.id)}><ArrowDownUp size={15} /></button>
                          </div>
                          <div className="project-visual" aria-hidden="true">
                            <span className="visual-orbit visual-orbit-one" /><span className="visual-orbit visual-orbit-two" />
                            <span className="visual-glyph">{project.title.slice(0, 1).toLocaleUpperCase("es")}</span>
                            <span className="visual-index">{(index + 1).toString().padStart(2, "0")} / {projects.length.toString().padStart(2, "0")}</span>
                            <span className="visual-spark">✳</span>
                          </div>
                          <div className="project-info">
                            <div className="project-title-line"><h3>{project.title}</h3><span className="project-open-mark"><ArrowUpRight size={17} /></span></div>
                            <p className="project-description">{project.description}</p>
                            <div className="stack-list">{project.stack.slice(0, 4).map((item) => <span className="stack-chip" key={item}>{item}</span>)}{project.stack.length > 4 && <span className="stack-chip more-chip">+{project.stack.length - 4}</span>}</div>
                            <div className="card-footer"><span><Folder size={13} /> {project.folders} carpetas</span><span className="footer-divider" /><span>{project.files} archivos</span><button type="button" onClick={() => openProject(project)}>Explorar <ArrowRight size={14} /></button></div>
                          </div>
                        </div>
                        <div className="card-face card-back" inert={!isFlipped}>
                          <button className="card-open-overlay" type="button" aria-label={`Abrir detalle de ${project.title}`} onClick={() => openProject(project)} />
                          <div className="back-header"><span className="back-kicker"><Sparkles size={13} /> FICHA RÁPIDA</span><button className="flip-control" type="button" aria-label={`Volver a ${project.title}`} onClick={() => toggleFlip(project.id)}><X size={15} /></button></div>
                          <div className="back-title">{project.title}<span> / anatomía</span></div>
                          <p className="back-description">{project.description}</p>
                          <div className="back-stats"><div><strong>{project.folders.toString().padStart(2, "0")}</strong><span>carpetas</span></div><div><strong>{project.files.toString().padStart(2, "0")}</strong><span>archivos</span></div><div><strong>{project.stack.length.toString().padStart(2, "0")}</strong><span>tecnologías</span></div></div>
                          <div className="back-stack-label">STACK DETECTADO</div><div className="back-stack">{project.stack.map((item) => <span className="stack-chip" key={item}>{item}</span>)}</div>
                          <button className="back-action" type="button" onClick={() => openProject(project)}>Abrir mapa del proyecto <ArrowUpRight size={15} /></button>
                          <span className="back-watermark">K</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
          <footer className="page-footer"><span><span className="footer-status" /> Kaktus lee el workspace en modo local</span><span>HECHO PARA ENTENDER, NO SOLO PARA VER <span className="footer-star">✳</span></span></footer>
        </div>}
      </main>
      {notice && <div className="notice-toast" role="status" aria-live="polite">{notice}</div>}
    </div>
  );
}

function App() {
  const [pathname, setPathname] = useState(() => window.location.pathname);
  const [dashboardView, setDashboardView] = useState<DashboardView>(() =>
    window.location.pathname.endsWith("/console") ? "console" : "projects"
  );

  useEffect(() => {
    function syncPathname() {
      const nextPathname = window.location.pathname;
      setPathname(nextPathname);
      if (nextPathname.startsWith("/workspaces/demo/dashboard/")) {
        setDashboardView(nextPathname.endsWith("/console") ? "console" : "projects");
      }
    }
    window.addEventListener("popstate", syncPathname);
    return () => window.removeEventListener("popstate", syncPathname);
  }, []);

  function connectDemo() {
    const dashboardPath = "/workspaces/demo/dashboard/projects";
    window.history.pushState({}, "", dashboardPath);
    setDashboardView("projects");
    setPathname(dashboardPath);
  }

  function changeDashboardView(view: DashboardView) {
    const dashboardPath = `/workspaces/demo/dashboard/${view}`;
    window.history.pushState({}, "", dashboardPath);
    setDashboardView(view);
    setPathname(dashboardPath);
  }

  function openProject(project: Project) {
    const projectPath = `/workspaces/demo/projects/${encodeURIComponent(project.id)}`;
    window.history.pushState({}, "", projectPath);
    setPathname(projectPath);
  }

  function openStudio(project: Project) {
    const studioPath = `/workspaces/demo/projects/${encodeURIComponent(project.id)}/studio/ide`;
    window.history.pushState({}, "", studioPath);
    setPathname(studioPath);
  }

  function backToProject(project: Project) {
    const projectPath = `/workspaces/demo/projects/${encodeURIComponent(project.id)}`;
    window.history.pushState({}, "", projectPath);
    setPathname(projectPath);
  }

  function backToDashboard() {
    const dashboardPath = `/workspaces/demo/dashboard/${dashboardView}`;
    window.history.pushState({}, "", dashboardPath);
    setPathname(dashboardPath);
  }

  const projectRoute = pathname.match(/^\/workspaces\/demo\/projects\/([^/]+)(?:\/(studio\/ide))?$/);
  const projectId = projectRoute ? decodeURIComponent(projectRoute[1]) : null;
  const studioView = projectRoute?.[2] === "studio/ide";

  if (pathname.startsWith("/workspaces/demo/dashboard/") || projectId) {
    return (
      <DashboardScreen
        projectId={projectId}
        studioView={studioView}
        dashboardView={dashboardView}
        onOpenProject={openProject}
        onOpenStudio={openStudio}
        onBackToProject={backToProject}
        onBackToDashboard={backToDashboard}
        onChangeDashboardView={changeDashboardView}
      />
    );
  }
  return <OnboardingScreen onConnectDemo={connectDemo} />;
}

export default App;

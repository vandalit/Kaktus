import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Cable,
  Check,
  CircleHelp,
  Clock3,
  Folder,
  HeartPulse,
  PencilLine,
  Radio,
  ShieldCheck
} from "lucide-react";
import type { Project } from "../types";
import StatusBanner from "../components/StatusBanner";

type ProjectDetailScreenProps = {
  project: Project;
  onBack: () => void;
  onEdit: () => void;
};

const mockMonitors = [
  { name: "Lectura del proyecto", state: "Operativo", icon: ShieldCheck },
  { name: "Integridad de estructura", state: "Simulado", icon: Radio },
  { name: "Actividad reciente", state: "Simulado", icon: Activity }
];

const mockConnections = ["Repositorio remoto", "Pipeline CI", "Entorno de despliegue"];

function ProjectDetailScreen({ project, onBack, onEdit }: ProjectDetailScreenProps) {
  return (
    <section className="project-detail" aria-labelledby="project-detail-title">
      <header className="project-detail__header">
        <button className="detail-back" type="button" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Volver a proyectos</span>
        </button>
        <div className="detail-breadcrumb" aria-label="Ubicación actual">
          <span>Workspace demo</span><span>/</span><span>Proyectos</span><span>/</span><strong>{project.title}</strong>
        </div>
      </header>

      <div className="project-detail__content">
        <StatusBanner tone="info" label="RESUMEN LOCAL">
          Descripción, tipo, stack y conteos provienen del análisis local de <code>CaseUses/{project.id}/</code>.
          La clasificación tecnológica es aproximada.
        </StatusBanner>

        <section className="project-hero">
          <div className="project-hero__identity">
            <div className="project-hero__mark" aria-hidden="true">{project.title.slice(0, 1).toLocaleUpperCase("es")}</div>
            <div className="project-hero__copy">
              <div className="project-hero__eyebrow"><span className="project-live-dot" /> {project.projectType} <span>/</span> {project.id}</div>
              <h1 id="project-detail-title">{project.title}</h1>
              <p>{project.description}</p>
            </div>
          </div>
          <button className="project-edit-button" type="button" onClick={onEdit}>
            <PencilLine size={17} />
            <span><strong>Editar proyecto</strong><small>Interacción de demostración</small></span>
            <ArrowRight size={17} />
          </button>
        </section>

        <section className="project-facts" aria-label="Resumen del proyecto">
          <article className="project-fact">
            <span className="project-fact__label"><Folder size={14} /> ARCHIVOS</span>
            <strong>{project.files.toString().padStart(2, "0")}</strong>
            <small>leídos localmente</small>
          </article>
          <article className="project-fact">
            <span className="project-fact__label"><Folder size={14} /> CARPETAS</span>
            <strong>{project.folders.toString().padStart(2, "0")}</strong>
            <small>en el proyecto</small>
          </article>
          <article className="project-fact project-fact--wide">
            <span className="project-fact__label">STACK DETECTADO <CircleHelp size={13} /></span>
            <div className="project-detail__stack">{project.stack.map((item) => <span className="stack-chip" key={item}>{item}</span>)}</div>
            <small>Estimación por archivos y dependencias</small>
          </article>
        </section>

        <div className="project-detail__section-heading">
          <div>
            <div className="section-kicker">ESTADO DEL PROYECTO</div>
            <h2>Monitores y conexiones</h2>
          </div>
          <span className="mock-indicator"><span /> DATOS MOCK</span>
        </div>

        <StatusBanner tone="warning" label="VISTA SIMULADA">
          Monitores, conexiones y salud son indicadores de interfaz de muestra. Kaktus todavía no ejecuta
          verificaciones, no conecta servicios ni mide la salud del proyecto.
        </StatusBanner>

        <section className="health-overview" aria-label="Métricas simuladas de salud">
          <article className="health-score">
            <div className="health-score__heading"><HeartPulse size={17} /> SALUD GENERAL <span>MOCK</span></div>
            <div className="health-score__value">92<span>/100</span></div>
            <div className="health-score__meter"><span /></div>
            <small>Valor ilustrativo, no calculado desde el proyecto.</small>
          </article>
          <article className="health-metric">
            <div className="health-metric__icon"><Radio size={16} /></div>
            <span>Monitores activos</span>
            <strong>03 <small>/ 03</small></strong>
            <em>MOCK</em>
          </article>
          <article className="health-metric">
            <div className="health-metric__icon"><Cable size={16} /></div>
            <span>Conexiones</span>
            <strong>00 <small>/ 03</small></strong>
            <em>MOCK</em>
          </article>
          <article className="health-metric">
            <div className="health-metric__icon"><Clock3 size={16} /></div>
            <span>Última revisión</span>
            <strong>—</strong>
            <em>SIN MEDICIÓN REAL</em>
          </article>
        </section>

        <section className="detail-lower-grid">
          <article className="detail-panel">
            <div className="detail-panel__heading"><div><span className="section-kicker">SEÑALES DE ESTADO</span><h3>Monitores</h3></div><span className="mock-pill">MOCK</span></div>
            <div className="monitor-list">
              {mockMonitors.map(({ name, state, icon: Icon }) => (
                <div className="monitor-row" key={name}>
                  <span className="monitor-row__icon"><Icon size={15} /></span>
                  <span className="monitor-row__name">{name}</span>
                  <span className="monitor-row__state"><span />{state}</span>
                </div>
              ))}
            </div>
          </article>
          <article className="detail-panel">
            <div className="detail-panel__heading"><div><span className="section-kicker">SERVICIOS</span><h3>Conexiones</h3></div><span className="mock-pill">MOCK</span></div>
            <div className="connection-list">
              {mockConnections.map((connection) => (
                <div className="connection-row" key={connection}>
                  <span className="connection-row__icon"><Cable size={15} /></span>
                  <span>{connection}</span>
                  <span className="connection-row__state">No conectado</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <footer className="project-detail__footer">
          <span><Check size={14} /> Los archivos fuente no se han modificado.</span>
          <button type="button" onClick={onBack}>Volver al dashboard <ArrowRight size={14} /></button>
        </footer>
      </div>
    </section>
  );
}

export default ProjectDetailScreen;

import { Fragment, useState } from "react";
import {
  Activity,
  Boxes,
  Braces,
  CircleDot,
  Clock3,
  ChevronDown,
  ChevronRight,
  FileCode2,
  Filter,
  FolderTree,
  Gauge,
  Search,
  SlidersHorizontal,
  Terminal
} from "lucide-react";
import type { Project } from "../types";

type ConsoleDashboardViewProps = {
  projects: Project[];
  loading: boolean;
  error: string;
};

const monitorData = [
  { label: "CPU", value: 18, valueText: "18%", icon: Activity },
  { label: "MEM", value: 42, valueText: "42%", icon: Boxes },
  { label: "IO", value: 7, valueText: "07%", icon: Gauge }
];

function ConsoleDashboardView({ projects, loading, error }: ConsoleDashboardViewProps) {
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);

  return (
    <section className="console-dashboard" aria-label="Dashboard técnico">
      <div className="console-dashboard__topline">
        <div className="console-dashboard__title">
          <span className="console-dashboard__prompt"><Terminal size={16} /></span>
          <div>
            <div className="console-dashboard__eyebrow">KAKTUS / WORKSPACE</div>
            <h1>CaseUses<span>_</span></h1>
          </div>
        </div>
        <div className="console-dashboard__meta">
          <span className="console-live"><i /> INDEX LOCAL</span>
          <span className="console-dashboard__timestamp"><Clock3 size={13} /> SESIÓN DEMO</span>
        </div>
      </div>

      <div className="console-dashboard__toolbar">
        <div className="console-dashboard__location"><FolderTree size={14} /> <span>/workspace/CaseUses</span></div>
        <div className="console-tools" aria-label="Herramientas de demostración">
          <button className="console-tool" type="button" disabled title="Búsqueda avanzada: no disponible en esta vista demo" aria-label="Búsqueda avanzada no disponible"><Search size={15} /></button>
          <button className="console-tool" type="button" disabled title="Filtros técnicos: no disponibles en esta vista demo" aria-label="Filtros técnicos no disponibles"><Filter size={15} /></button>
          <button className="console-tool" type="button" disabled title="Ajustes de columnas: no disponibles en esta vista demo" aria-label="Ajustes de columnas no disponibles"><SlidersHorizontal size={15} /></button>
        </div>
      </div>

      <div className="console-monitors" aria-label="Mini monitores de rendimiento simulados">
        {monitorData.map(({ label, value, valueText, icon: Icon }) => (
          <article className="console-monitor" key={label} title="Dato visual simulado; no mide el rendimiento real del workspace">
            <div className="console-monitor__label"><Icon size={13} /> {label} <span>MOCK</span></div>
            <strong>{valueText}</strong>
            <div className="console-monitor__track"><i style={{ width: `${value}%` }} /></div>
          </article>
        ))}
        <div className="console-monitors__notice"><span /> Monitores ilustrativos · sin métricas reales</div>
      </div>

      <div className="console-section-heading">
        <div>
          <span className="console-section-heading__index">01 / PROJECT INDEX</span>
          <h2>Proyectos del workspace <small>{loading ? "…" : projects.length.toString().padStart(2, "0")}</small></h2>
        </div>
        <span className="console-section-heading__source"><CircleDot size={12} /> DATOS LOCALES</span>
      </div>

      {error && <div className="console-error" role="alert">{error}</div>}
      {loading && <div className="console-empty"><span className="console-spinner" /> Leyendo índice local...</div>}
      {!loading && !error && projects.length === 0 && (
        <div className="console-empty"><Braces size={18} /> No hay proyectos en el índice.</div>
      )}
      {!loading && !error && projects.length > 0 && (
        <div className="console-project-list">
          {projects.map((project, index) => (
            <Fragment key={project.id}>
              <button
                className={`console-project-row${expandedProjectId === project.id ? " is-expanded" : ""}`}
                type="button"
                aria-expanded={expandedProjectId === project.id}
                aria-controls={`console-detail-${project.id}`}
                onClick={() => setExpandedProjectId((current) => current === project.id ? null : project.id)}
              >
                <span className="console-project-row__index">{String(index + 1).padStart(2, "0")}</span>
                <span className="console-project-row__icon"><FileCode2 size={17} /></span>
                <span className="console-project-row__identity">
                  <span className="console-project-row__name">{project.title}<small>{project.id}/</small></span>
                  <span className="console-project-row__description">{project.description}</span>
                </span>
                <span className="console-project-row__tags">
                  {project.stack.slice(0, 3).map((technology) => <span className="console-tag" key={technology}>{technology}</span>)}
                  {project.stack.length > 3 && <span className="console-tag console-tag--more">+{project.stack.length - 3}</span>}
                </span>
                <span className="console-project-row__metrics"><span>{project.files} <small>FILES</small></span><span>{project.folders} <small>DIRS</small></span></span>
                <span className="console-project-row__status"><i /> READY</span>
                <span className="console-project-row__open">{expandedProjectId === project.id ? "CLOSE" : "DETAIL"} {expandedProjectId === project.id ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
              </button>
              {expandedProjectId === project.id && (
                <section className="console-expanded-detail" id={`console-detail-${project.id}`} aria-label={`Detalle de ${project.title}`}>
                  <div className="console-expanded-detail__summary">
                    <span className="console-expanded-detail__eyebrow">PROJECT SUMMARY <span>REAL DATA</span></span>
                    <p>{project.description}</p>
                    <div className="console-expanded-detail__tags">
                      {project.stack.map((technology) => <span className="console-tag" key={technology}>{technology}</span>)}
                    </div>
                  </div>
                  <div className="console-expanded-detail__metrics">
                    <div><span>FILES</span><strong>{String(project.files).padStart(2, "0")}</strong></div>
                    <div><span>DIRECTORIES</span><strong>{String(project.folders).padStart(2, "0")}</strong></div>
                    <div><span>HEALTH <em>MOCK</em></span><strong className="is-mock">92%</strong></div>
                  </div>
                  <div className="console-expanded-detail__status">
                    <span><CircleDot size={12} /> MONITORS <b>MOCK</b> <small>simulated</small></span>
                    <span><CircleDot size={12} /> CONNECTIONS <b>MOCK</b> <small>not connected</small></span>
                  </div>
                </section>
              )}
            </Fragment>
          ))}
        </div>
      )}

      <footer className="console-dashboard__footer">
        <span><CircleDot size={11} /> SOURCE: FILESYSTEM / CaseUses</span>
        <span><span className="console-footer-mock">MOCK</span> PERFORMANCE MONITORS</span>
        <span>{loading ? "INDEXING..." : `${projects.length.toString().padStart(2, "0")} RECORDS`}</span>
      </footer>
    </section>
  );
}

export default ConsoleDashboardView;

import { Braces, Gauge, SlidersHorizontal } from "lucide-react";

type Metric = {
  value: string;
  label: string;
  detail: string;
};

type Parameter = {
  name: string;
  value: string;
  source: string;
};

type ParameterGroup = {
  name: string;
  items: Parameter[];
};

type ParameterProfile = {
  name: string;
  metrics: Metric[];
  groups: ParameterGroup[];
  tags: string[];
};

const profiles: Record<string, ParameterProfile> = {
  "01-mini-store": {
    name: "MINI STORE",
    metrics: [
      { value: "01", label: "PÁGINA", detail: "HTML" },
      { value: "02", label: "SUPERFICIES", detail: "página + bolsa" },
      { value: "03", label: "TABLAS SQL", detail: "SQLite" },
      { value: "04", label: "PRODUCTOS", detail: "seed inicial" }
    ],
    groups: [
      {
        name: "SERVIDOR + API",
        items: [
          { name: "PORT", value: "4171 · PORT || 4171", source: "backend/server.js" },
          { name: "GET", value: "/api/products", source: "catálogo" },
          { name: "POST", value: "/api/orders", source: "checkout" }
        ]
      },
      {
        name: "INTERFAZ + VALIDACIÓN",
        items: [
          { name: "BOOTSTRAP", value: "5.3.3", source: "frontend/index.html" },
          { name: "MAX CUSTOMER NAME", value: "80 CARACTERES", source: "#customer-name" },
          { name: "MONEDA", value: "CLP · 0 DECIMALES", source: "Intl.NumberFormat" }
        ]
      }
    ],
    tags: ["#configuration", "#api", "#inventory"]
  },
  "02-forma-studio": {
    name: "FORMA STUDIO",
    metrics: [
      { value: "04", label: "VISTAS", detail: "paneles HTML" },
      { value: "03", label: "CASOS", detail: "tarjetas" },
      { value: "01", label: "DIÁLOGO", detail: "nativo" },
      { value: "00", label: "API", detail: "sitio estático" }
    ],
    groups: [
      {
        name: "NAVEGACIÓN + MOVIMIENTO",
        items: [
          { name: "ROUTE MODE", value: "HASH · history.pushState", source: "app.js" },
          { name: "REVEAL", value: "650 MS", source: "styles.css · rise-in" },
          { name: "STAGGER", value: "70 / 130 / 190 MS", source: "styles.css · nth-child" }
        ]
      },
      {
        name: "BRAND + LAYOUT",
        items: [
          { name: "--acid", value: "#DCF45D", source: "styles.css" },
          { name: "TICKER", value: "26 S · LINEAR", source: "styles.css" },
          { name: "BREAKPOINT", value: "760 PX", source: "styles.css" }
        ]
      }
    ],
    tags: ["#views", "#motion", "#design-tokens"]
  },
  "03-pulse-board": {
    name: "PULSE BOARD",
    metrics: [
      { value: "03", label: "COLUMNAS", detail: "todo · doing · done" },
      { value: "07", label: "TASK SEEDS", detail: "initialTasks" },
      { value: "09", label: "CAMPOS", detail: "Task" },
      { value: "01", label: "STORAGE KEY", detail: "browser" }
    ],
    groups: [
      {
        name: "MODELO + PERSISTENCIA",
        items: [
          { name: "STORAGE_KEY", value: "pulse-board-tasks-v1", source: "app.js" },
          { name: "STATUS", value: "todo · doing · done", source: "app.js · statuses" },
          { name: "PRIORITY", value: "low · normal · high", source: "app.js · validación" }
        ]
      },
      {
        name: "LÍMITES DE FORMULARIO",
        items: [
          { name: "TITLE", value: "100 CARACTERES", source: "index.html" },
          { name: "DESCRIPTION", value: "300 CARACTERES", source: "index.html" },
          { name: "ASSIGNEES", value: "ARRAY · initials", source: "Task[]" }
        ]
      }
    ],
    tags: ["#parameters", "#task-model", "#localstorage"]
  }
};

const fallbackProfile: ParameterProfile = {
  name: "PROYECTO",
  metrics: [{ value: "—", label: "PENDIENTE", detail: "mapa manual" }],
  groups: [],
  tags: ["#pendiente"]
};

function ParametersCanvas({ projectId }: { projectId: string }) {
  const profile = profiles[projectId] ?? fallbackProfile;

  return (
    <section className="parameters-canvas" aria-label={`Métricas y parámetros de ${profile.name}`}>
      <header className="anatomy-canvas__header">
        <div className="anatomy-canvas__identity">
          <span className="anatomy-canvas__mark"><Braces size={13} aria-hidden="true" /></span>
          <span><strong>MÉTRICAS + PARÁMETROS</strong><small>{profile.name} / CONFIGURACIÓN</small></span>
        </div>
        <span className="parameters-canvas__source">LECTURA MANUAL · NO RUNTIME</span>
      </header>

      <div className="parameters-canvas__body">
        <section className="parameters-canvas__globals" aria-label="Indicadores globales">
          <h3><Gauge size={11} aria-hidden="true" /> INDICADORES GLOBALES <small>01 / OVERVIEW</small></h3>
          <div className="parameters-canvas__metrics">
            {profile.metrics.map((metric) => (
              <article className="parameters-metric" key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
                <small>{metric.detail}</small>
              </article>
            ))}
          </div>
        </section>

        <div className="parameters-canvas__groups">
          {profile.groups.map((group, index) => (
            <section className="parameters-group" key={group.name}>
              <h3><SlidersHorizontal size={10} aria-hidden="true" /> {group.name} <small>{String(index + 2).padStart(2, "0")}</small></h3>
              <div className="parameters-group__items">
                {group.items.map((parameter) => (
                  <article className="parameter-chip" key={parameter.name}>
                    <span><small>{parameter.name}</small><strong>{parameter.value}</strong></span>
                    <small>{parameter.source}</small>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <footer className="anatomy-canvas__tags">
        {profile.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </footer>
    </section>
  );
}

export default ParametersCanvas;

import { useState } from "react";
import { ArrowDown, Braces, Code2, Database, File, HardDrive, Palette, Server, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type CodeNode = {
  path: string;
  role: string;
  icon: LucideIcon;
  chips: string[];
};

type CodeModel = {
  label: string;
  summary: string;
  nodes: CodeNode[];
  edges: string[];
  tags: string[];
};

const codeModels: Record<string, CodeModel> = {
  "01-mini-store": {
    label: "MINI STORE",
    summary: "6 UI FN · 4 SERVER FN · 2 TX",
    nodes: [
      {
        path: "frontend/app.js",
        role: "INTERFAZ + ESTADO",
        icon: Code2,
        chips: ["loadProducts()", "renderProducts()", "renderCart()", "localStorage"]
      },
      {
        path: "backend/server.js",
        role: "HTTP · CONTROL",
        icon: Server,
        chips: ["GET /api/products", "POST /api/orders", "validOrder()"]
      },
      {
        path: "backend/database.js",
        role: "SQL · PERSISTENCIA",
        icon: Database,
        chips: ["products", "orders", "order_items", "createOrder()"]
      }
    ],
    edges: ["JSON · HTTP", "SQL · TRANSACCIÓN"],
    tags: ["#frontend", "#api", "#sqlite", "#checkout"]
  },
  "02-forma-studio": {
    label: "FORMA STUDIO",
    summary: "1 CONTROLADOR · 4 VISTAS · SIN API",
    nodes: [
      {
        path: "index.html",
        role: "SHELL · CONTENIDO",
        icon: File,
        chips: ["inicio", "estudio", "proyectos", "contacto"]
      },
      {
        path: "app.js",
        role: "NAVEGACIÓN",
        icon: Workflow,
        chips: ["showView()", "hash / history", "project dialog"]
      },
      {
        path: "styles.css",
        role: "PRESENTACIÓN",
        icon: Palette,
        chips: ["responsive", "motion", "composición CSS"]
      }
    ],
    edges: ["DOM · DATA-*", "ESTADOS VISUALES"],
    tags: ["#sitio-estatico", "#vistas", "#history-api", "#sin-backend"]
  },
  "03-pulse-board": {
    label: "PULSE BOARD",
    summary: "10 FUNCIONES · 3 ESTADOS · SIN SQL",
    nodes: [
      {
        path: "app.js",
        role: "MODELO · TAREA",
        icon: Braces,
        chips: ["Task[] · 7 seeds", "status / priority", "assignees[]"]
      },
      {
        path: "app.js",
        role: "OPERACIONES UI",
        icon: Code2,
        chips: ["filteredTasks()", "render()", "openTaskForm()"]
      },
      {
        path: "localStorage",
        role: "PERSISTENCIA LOCAL",
        icon: HardDrive,
        chips: ["loadTasks()", "persistTasks()", "pulse-board-tasks-v1"]
      }
    ],
    edges: ["FILTRA · RENDERIZA", "SERIALIZA · RESTAURA"],
    tags: ["#kanban", "#tareas", "#localstorage", "#sin-api"]
  }
};

const fallbackModel: CodeModel = {
  label: "PROYECTO",
  summary: "MAPA SEMÁNTICO PENDIENTE",
  nodes: [
    { path: "origen no mapeado", role: "CÓDIGO", icon: Code2, chips: ["sin análisis manual"] }
  ],
  edges: [],
  tags: ["#pendiente"]
};

function CodeAnatomyCanvas({ projectId }: { projectId: string }) {
  const model = codeModels[projectId] ?? fallbackModel;
  const [expandedNode, setExpandedNode] = useState<number | null>(null);

  return (
    <section className="code-anatomy" aria-label={`Grafo de código de ${model.label}`}>
      <header className="anatomy-canvas__header">
        <div className="anatomy-canvas__identity">
          <span className="anatomy-canvas__mark"><Code2 size={13} aria-hidden="true" /></span>
          <span>
            <strong>GRAFO DE CÓDIGO</strong>
            <small>{model.label} / MAPEADO A MANO</small>
          </span>
        </div>
        <span className="code-anatomy__count">{model.summary}</span>
      </header>

      <div className="code-anatomy__graph">
        {model.nodes.map((node, index) => (
          <div className="code-anatomy__step" key={`${node.path}-${node.role}`}>
            <button
              className={`code-module${expandedNode === index ? " is-focused" : ""}`}
              type="button"
              aria-expanded={expandedNode === index}
              onClick={() => setExpandedNode((current) => current === index ? null : index)}
            >
              <span className="code-module__icon"><node.icon size={13} aria-hidden="true" /></span>
              <span className="code-module__content">
                <small>{node.role}</small>
                <strong>{node.path}</strong>
                <span className="code-module__chips">
                  {(expandedNode === index ? node.chips : node.chips.slice(0, 3)).map((chip) => <i key={chip}>{chip}</i>)}
                </span>
              </span>
              <span className="code-module__ordinal">{String(index + 1).padStart(2, "0")}</span>
            </button>
            {index < model.nodes.length - 1 && (
              <div className="code-anatomy__edge">
                <span>{model.edges[index]}</span><ArrowDown size={11} aria-hidden="true" />
              </div>
            )}
          </div>
        ))}
      </div>

      <footer className="anatomy-canvas__tags">
        {model.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </footer>
    </section>
  );
}

export default CodeAnatomyCanvas;

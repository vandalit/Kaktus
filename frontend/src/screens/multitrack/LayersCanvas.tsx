import { useState } from "react";
import {
  ArrowDown,
  Braces,
  Database,
  FileText,
  Layers3,
  LayoutPanelTop,
  Package,
  PanelRight,
  ShoppingCart,
  Workflow
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

type SectionLayer = {
  name: string;
  role: string;
  detail: string;
  icon: LucideIcon;
  isCore?: boolean;
};

type ProductSurface = {
  id: string;
  name: string;
  kind: string;
  source: string;
  sections: SectionLayer[];
};

type EntityLayer = {
  id: string;
  name: string;
  role: string;
  store: string;
  size: string;
  fields: string[];
  icon: LucideIcon;
  isCore?: boolean;
};

type LayerModel = {
  name: string;
  note: string;
  surfaces: ProductSurface[];
  entities: EntityLayer[];
  tags: string[];
};

const models: Record<string, LayerModel> = {
  "01-mini-store": {
    name: "MINI STORE",
    note: "HTML real · secciones y componentes manualmente mapeados.",
    surfaces: [
      {
        id: "storefront",
        name: "Tienda",
        kind: "PÁGINA · /",
        source: "frontend/index.html",
        sections: [
          { name: "Hero / portada", role: "INTRO ESTÁTICA", detail: "Marca Domingo · promoción", icon: LayoutPanelTop },
          { name: "Catálogo de productos", role: "LIBRERÍA · product-grid", detail: "Bootstrap row + cards · GET /api/products · no es carrusel", icon: Package, isCore: true }
        ]
      },
      {
        id: "cart",
        name: "Bolsa",
        kind: "OVERLAY · #cartPanel",
        source: "Bootstrap Offcanvas",
        sections: [
          { name: "Líneas del carrito", role: "COMPONENTE · #cart-items", detail: "Estado local del navegador", icon: ShoppingCart },
          { name: "Checkout", role: "FORM · #checkout-form", detail: "POST /api/orders · crea el pedido", icon: Workflow, isCore: true }
        ]
      }
    ],
    entities: [
      { id: "products", name: "products", role: "CATÁLOGO · CORE", store: "SQLITE · 06 COL.", size: "04 SEEDS", fields: ["id", "name", "price_cents", "stock"], icon: Package, isCore: true },
      { id: "orders", name: "orders", role: "VENTA · CABECERA", store: "SQLITE · 04 COL.", size: "02 MUESTRAS", fields: ["id", "customer_name", "total_cents"], icon: FileText },
      { id: "order_items", name: "order_items", role: "PUENTE · DETALLE", store: "SQLITE · 05 COL.", size: "2 MUESTRAS", fields: ["order_id", "product_id", "quantity", "unit_price_cents"], icon: Workflow }
    ],
    tags: ["#bootstrap-grid", "#api", "#catalogo"]
  },
  "02-forma-studio": {
    name: "FORMA STUDIO",
    note: "HTML real · navegación entre paneles, no páginas de servidor.",
    surfaces: [
      {
        id: "inicio",
        name: "Inicio",
        kind: "VISTA · #inicio",
        source: "data-view-panel",
        sections: [
          { name: "Hero", role: "CONTENIDO PRINCIPAL", detail: "Identidad · propuesta del estudio", icon: LayoutPanelTop, isCore: true },
          { name: "CTA a proyectos", role: "ACCIÓN · data-go", detail: "Navega a #proyectos", icon: Workflow }
        ]
      },
      {
        id: "proyectos",
        name: "Proyectos",
        kind: "VISTA · #proyectos",
        source: "data-view-panel",
        sections: [
          { name: "Grilla de casos", role: "3 TARJETAS · data-project", detail: "Casa Nube · Marea · Feria Local", icon: Package, isCore: true },
          { name: "Diálogo de caso", role: "DIALOG NATIVO", detail: "Abre descripción desde la tarjeta", icon: PanelRight }
        ]
      },
      {
        id: "estudio",
        name: "Estudio",
        kind: "VISTA · #estudio",
        source: "data-view-panel",
        sections: [
          { name: "Principios", role: "3 BLOQUES EDITORIALES", detail: "Menos ruido · Más intención · Juntos", icon: FileText },
          { name: "Manifiesto", role: "CONTENIDO ESTÁTICO", detail: "Capa de marca", icon: Braces }
        ]
      },
      {
        id: "contacto",
        name: "Contacto",
        kind: "VISTA · #contacto",
        source: "data-view-panel",
        sections: [
          { name: "Datos y enlaces", role: "CONTACTO", detail: "Acciones HTML · sin backend", icon: Workflow }
        ]
      }
    ],
    entities: [
      { id: "projects", name: "project-card", role: "CONTENIDO · PORTFOLIO", store: "HTML · data-*", size: "03 CASOS", fields: ["data-project", "data-description"], icon: Package, isCore: true },
      { id: "views", name: "view-panels", role: "NAVEGACIÓN · hash", store: "HTML · data-view-panel", size: "04 VISTAS", fields: ["inicio", "estudio", "proyectos", "contacto"], icon: LayoutPanelTop },
      { id: "dialog", name: "project-dialog", role: "INTERFAZ · NATIVA", store: "HTML · <dialog>", size: "01 MODAL", fields: ["title", "description"], icon: PanelRight }
    ],
    tags: ["#portfolio", "#hash-navigation", "#static-html"]
  },
  "03-pulse-board": {
    name: "PULSE BOARD",
    note: "Interfaz de una página · los cambios de navegación son estados locales.",
    surfaces: [
      {
        id: "board",
        name: "Mi tablero",
        kind: "VISTA · BOARD",
        source: "index.html · #board",
        sections: [
          { name: "Barra de herramientas", role: "BÚSQUEDA + FILTROS", detail: "Refina tareas visibles", icon: Workflow },
          { name: "Columnas Kanban", role: "3 ESTADOS · todo / doing / done", detail: "Task cards · lista de tareas", icon: LayoutPanelTop, isCore: true }
        ]
      },
      {
        id: "overview",
        name: "Resumen",
        kind: "ESTADO · overview",
        source: "side-link[data-page]",
        sections: [
          { name: "Resumen del equipo", role: "NAVEGACIÓN LATERAL", detail: "Estado de vista; no cambia la ruta", icon: FileText }
        ]
      },
      {
        id: "timeline",
        name: "Actividad",
        kind: "ESTADO · timeline",
        source: "side-link[data-page]",
        sections: [
          { name: "Acceso de actividad", role: "NAVEGACIÓN LATERAL", detail: "Estado de vista; no es un feed conectado", icon: Workflow }
        ]
      }
    ],
    entities: [
      { id: "tasks", name: "Task[]", role: "MODELO · CORE", store: "localStorage · JSON", size: "07 INICIALES", fields: ["id", "title", "status", "priority", "assignees[]"], icon: Braces, isCore: true },
      { id: "status", name: "status", role: "ESTADOS DEL MODELO", store: "ENUM · NO ES TABLA", size: "03 VALORES", fields: ["todo", "doing", "done"], icon: Workflow },
      { id: "storage", name: "pulse-board-tasks-v1", role: "PERSISTENCIA", store: "localStorage · navegador", size: "1 COLECCIÓN", fields: ["loadTasks()", "persistTasks()"], icon: Database }
    ],
    tags: ["#kanban", "#task-model", "#localstorage"]
  }
};

const fallbackModel: LayerModel = {
  name: "PROYECTO",
  note: "Mapa manual pendiente para este proyecto.",
  surfaces: [],
  entities: [],
  tags: ["#pendiente"]
};

function LayersCanvas({ projectId }: { projectId: string }) {
  const model = models[projectId] ?? fallbackModel;
  const [view, setView] = useState<"surfaces" | "entities">("surfaces");
  const [selectedSurface, setSelectedSurface] = useState(model.surfaces[0]?.id ?? "");
  const [selectedEntity, setSelectedEntity] = useState(model.entities[0]?.id ?? "");
  const surface = model.surfaces.find(({ id }) => id === selectedSurface) ?? model.surfaces[0];
  const entity = model.entities.find(({ id }) => id === selectedEntity) ?? model.entities[0];

  return (
    <section className="layers-canvas" aria-label={`Inspector de vistas y entidades de ${model.name}`}>
      <header className="anatomy-canvas__header">
        <div className="anatomy-canvas__identity">
          <span className="anatomy-canvas__mark"><Layers3 size={13} aria-hidden="true" /></span>
          <span><strong>LAYERS · INSPECTOR</strong><small>{model.name} / VISTAS + ENTIDADES</small></span>
        </div>
        <div className="layers-canvas__switch" role="group" aria-label="Tipo de capa">
          <button type="button" aria-pressed={view === "surfaces"} onClick={() => setView("surfaces")}>VISTAS</button>
          <button type="button" aria-pressed={view === "entities"} onClick={() => setView("entities")}>ENTIDADES</button>
        </div>
      </header>

      {view === "surfaces" ? (
        <div className="layers-inspector">
          <nav className="layers-inspector__index" aria-label="Páginas y superficies">
            {model.surfaces.map((item, index) => (
              <button
                className={surface?.id === item.id ? "is-selected" : ""}
                key={item.id}
                type="button"
                aria-pressed={surface?.id === item.id}
                onClick={() => setSelectedSurface(item.id)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong>
              </button>
            ))}
          </nav>
          {surface && (
            <div className="layers-inspector__detail">
              <header><span>{surface.kind}</span><strong>{surface.name}</strong><small>{surface.source}</small></header>
              <div className="layers-inspector__sections">
                {surface.sections.map((section, index) => (
                  <div className={`layers-section${section.isCore ? " is-core" : ""}`} key={section.name}>
                    {index > 0 && <span className="layers-section__connector"><ArrowDown size={10} aria-hidden="true" /></span>}
                    <div className="layers-section__node">
                      <span className="layers-section__icon"><section.icon size={12} aria-hidden="true" /></span>
                      <span><small>{section.role}</small><strong>{section.name}</strong><em>{section.detail}</em></span>
                      {section.isCore && <b>CORE</b>}
                    </div>
                  </div>
                ))}
              </div>
              <p className="layers-inspector__note">{model.note}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="layers-entity-inspector">
          <div className="layers-entity-stack" role="group" aria-label="Pila de entidades">
            {model.entities.map((item, index) => (
              <button
                className={`layers-entity${item.isCore ? " is-core" : ""}${entity?.id === item.id ? " is-selected" : ""}`}
                key={item.id}
                type="button"
                aria-pressed={entity?.id === item.id}
                onClick={() => setSelectedEntity(item.id)}
              >
                <span className="layers-entity__order">{String(index + 1).padStart(2, "0")}</span>
                <item.icon size={12} aria-hidden="true" />
                <span className="layers-entity__name"><small>{item.role}</small><strong>{item.name}</strong></span>
                <small className="layers-entity__size">{item.size}</small>
              </button>
            ))}
          </div>
          {entity && (
            <section className="layers-entity-detail" aria-label={`Detalle de ${entity.name}`}>
              <header><span>{entity.store}</span><strong>{entity.name}</strong></header>
              <p>{entity.role} <b>{entity.size}</b></p>
              <div className="layers-entity-detail__fields">{entity.fields.map((field) => <span key={field}>{field}</span>)}</div>
              <small>CAPA DE DATOS · ESTRUCTURA MANUAL</small>
            </section>
          )}
        </div>
      )}

      <footer className="anatomy-canvas__tags">
        {model.tags.map((tag) => <span key={tag}>{tag}</span>)}
      </footer>
    </section>
  );
}

export default LayersCanvas;

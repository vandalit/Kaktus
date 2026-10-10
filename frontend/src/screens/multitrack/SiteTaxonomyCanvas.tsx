import { ArrowDown, Boxes, LayoutPanelTop, Navigation, Package, ReceiptText, Search, ShoppingBag, Store, UsersRound, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Branch = {
  relation: string;
  label: string;
  icon: LucideIcon;
  detail: string;
  emphasis?: boolean;
};

type Taxonomy = {
  name: string;
  root: string;
  focus: string;
  focusRole: string;
  focusIcon: LucideIcon;
  focusChips: string[];
  branches: Branch[];
  footer: string[];
};

const taxonomies: Record<string, Taxonomy> = {
  "01-mini-store": {
    name: "MINI STORE",
    root: "index.html · STORE",
    focus: "CATÁLOGO",
    focusRole: "NODO CENTRAL · PRODUCTS",
    focusIcon: Package,
    focusChips: ["product-grid", "GET /api/products", "04 seed"],
    branches: [
      { relation: "CONTIENE", label: "NAVEGACIÓN", icon: Navigation, detail: "marca · abre bolsa" },
      { relation: "CARGA", label: "PRODUCTOS", icon: Boxes, detail: "API → catálogo", emphasis: true },
      { relation: "MANTIENE", label: "BOLSA", icon: ShoppingBag, detail: "localStorage · carrito" },
      { relation: "ENVÍA", label: "CHECKOUT", icon: ReceiptText, detail: "POST /api/orders", emphasis: true }
    ],
    footer: ["$ Y STOCK", "ORDERS + ORDER_ITEMS"]
  },
  "02-forma-studio": {
    name: "FORMA STUDIO",
    root: "index.html · PORTFOLIO",
    focus: "PROYECTOS",
    focusRole: "NODO CENTRAL · SELECTED WORK",
    focusIcon: LayoutPanelTop,
    focusChips: ["3 casos", "#proyectos", "dialog nativo"],
    branches: [
      { relation: "NAVEGA", label: "INICIO", icon: Store, detail: "hero · entrada" },
      { relation: "NAVEGA", label: "ESTUDIO", icon: UsersRound, detail: "principios · manifiesto" },
      { relation: "NAVEGA", label: "CONTACTO", icon: Navigation, detail: "mail · enlaces" },
      { relation: "ABRE", label: "CASO", icon: ReceiptText, detail: "tarjeta → dialog", emphasis: true }
    ],
    footer: ["4 VISTAS · HASH", "SIN API · SIN STORAGE"]
  },
  "03-pulse-board": {
    name: "PULSE BOARD",
    root: "index.html · TABLERO",
    focus: "TAREAS",
    focusRole: "NODO CENTRAL · TASK[]",
    focusIcon: Boxes,
    focusChips: ["7 seeds", "9 campos", "localStorage"],
    branches: [
      { relation: "AGRUPA", label: "TODO", icon: Workflow, detail: "3 tareas · pendientes" },
      { relation: "AGRUPA", label: "DOING", icon: Search, detail: "2 tareas · activas", emphasis: true },
      { relation: "AGRUPA", label: "DONE", icon: ReceiptText, detail: "2 tareas · cerradas" },
      { relation: "FILTRA", label: "BÚSQUEDA", icon: Navigation, detail: "texto · persona · prioridad" }
    ],
    footer: ["FORMULARIO → TASK[]", "PERSISTE EN NAVEGADOR"]
  }
};

const fallbackTaxonomy: Taxonomy = {
  name: "PROYECTO",
  root: "ORIGEN NO MAPEADO",
  focus: "ANATOMÍA",
  focusRole: "NODO CENTRAL",
  focusIcon: Store,
  focusChips: ["sin análisis manual"],
  branches: [],
  footer: ["#PENDIENTE"]
};

function SiteTaxonomyCanvas({ projectId }: { projectId: string }) {
  const taxonomy = taxonomies[projectId] ?? fallbackTaxonomy;
  const FocusIcon = taxonomy.focusIcon;

  return (
    <section className="site-taxonomy" aria-label={`Taxonomía semántica de ${taxonomy.name}`}>
      <header className="anatomy-canvas__header">
        <div className="anatomy-canvas__identity">
          <span className="anatomy-canvas__mark"><Navigation size={13} aria-hidden="true" /></span>
          <span>
            <strong>GRAFO DE TAXONOMÍA</strong>
            <small>{taxonomy.name} / MAPA MANUAL</small>
          </span>
        </div>
        <span className="site-taxonomy__source">PESO · ROL · FLUJO</span>
      </header>

      <div className="site-taxonomy__map">
        <div className="site-taxonomy__root">
          <Store size={12} aria-hidden="true" />
          <strong>{taxonomy.root}</strong>
          <span>RAÍZ</span>
        </div>
        <div className="site-taxonomy__trunk" aria-hidden="true"><ArrowDown size={11} /></div>
        <article className="site-taxonomy__focus">
          <span className="site-taxonomy__focus-icon"><FocusIcon size={15} aria-hidden="true" /></span>
          <span className="site-taxonomy__focus-copy">
            <small>{taxonomy.focusRole}</small>
            <strong>{taxonomy.focus}</strong>
            <span>{taxonomy.focusChips.map((chip) => <i key={chip}>{chip}</i>)}</span>
          </span>
          <b>CORE</b>
        </article>
        <div className="site-taxonomy__trunk site-taxonomy__trunk--branches" aria-hidden="true"><ArrowDown size={11} /></div>
        <div className="site-taxonomy__branches">
          {taxonomy.branches.map((branch) => (
            <article className={`site-branch${branch.emphasis ? " is-emphasis" : ""}`} key={branch.label}>
              <span className="site-branch__relation">{branch.relation}</span>
              <strong><branch.icon size={10} aria-hidden="true" /> {branch.label}</strong>
              <small>{branch.detail}</small>
            </article>
          ))}
        </div>
        <div className="site-taxonomy__legend">
          {taxonomy.footer.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
      <footer className="anatomy-canvas__tags">
        <span>#grafo</span><span>#jerarquía</span><span>#rol</span><span>#flujo</span>
      </footer>
    </section>
  );
}

export default SiteTaxonomyCanvas;

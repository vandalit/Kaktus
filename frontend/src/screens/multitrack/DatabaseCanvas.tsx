import { useState } from "react";
import { ArrowDown, Database, KeyRound, Link2, TableProperties, X } from "lucide-react";

type DatabaseView = "map" | "tables";
type DataValue = string | number | boolean | string[];

type SampleRow = {
  label: string;
  summary: string;
  data: Record<string, DataValue>;
};

type DataEntity = {
  name: string;
  role: string;
  fields: string[];
  keys: string[];
  rows: SampleRow[];
};

const productSeeds = [
  { id: 1, name: "Taza de domingo", price: 1800, stock: 11, description: "Cerámica hecha para mañanas sin prisa.", emoji: "☕" },
  { id: 2, name: "Cuaderno de ideas", price: 1250, stock: 17, description: "Papel grueso para planes grandes y pequeños.", emoji: "📓" },
  { id: 3, name: "Bolso de paseo", price: 3200, stock: 6, description: "Lona resistente, bolsillo interior y cero complicaciones.", emoji: "👜" },
  { id: 4, name: "Lámpara de mesa", price: 4550, stock: 4, description: "Luz cálida para leer un capítulo más.", emoji: "💡" }
];

const entitiesByProject: Record<string, DataEntity[]> = {
  "01-mini-store": [
    {
      name: "products",
      role: "SQL · CATÁLOGO",
      fields: ["id", "name", "description", "price_cents", "stock", "emoji"],
      keys: ["PK id"],
      rows: productSeeds.slice(0, 2).map((product) => ({
        label: `#${product.id} ${product.name}`,
        summary: `$${product.price.toLocaleString("es-CL")} · ${product.stock} u.`,
        data: { ...product, price_cents: product.price }
      }))
    },
    {
      name: "orders",
      role: "SQL · PEDIDOS",
      fields: ["id", "customer_name", "total_cents", "created_at"],
      keys: ["PK id"],
      rows: [
        {
          label: "#1 Demo · Ana Soto",
          summary: "$3.050 · 2 líneas",
          data: { id: 1, customer_name: "Demo · Ana Soto", total_cents: 3050, created_at: "generado al iniciar" }
        },
        {
          label: "#2 Demo · Leo Paz",
          summary: "$7.750 · 2 líneas",
          data: { id: 2, customer_name: "Demo · Leo Paz", total_cents: 7750, created_at: "generado al iniciar" }
        }
      ]
    },
    {
      name: "order_items",
      role: "SQL · DETALLE",
      fields: ["order_id", "product_id", "product_name", "quantity", "unit_price_cents"],
      keys: ["PK order_id + product_id", "FK order_id → orders.id", "FK product_id → products.id"],
      rows: [
        {
          label: "Pedido 1 · Taza",
          summary: "1 × $1.800",
          data: { order_id: 1, product_id: 1, product_name: "Taza de domingo", quantity: 1, unit_price_cents: 1800 }
        },
        {
          label: "Pedido 1 · Cuaderno",
          summary: "1 × $1.250",
          data: { order_id: 1, product_id: 2, product_name: "Cuaderno de ideas", quantity: 1, unit_price_cents: 1250 }
        }
      ]
    }
  ],
  "02-forma-studio": [
    {
      name: "project-card",
      role: "HTML DATA-* · CASOS",
      fields: ["data-project", "data-description"],
      keys: ["data-project"],
      rows: [
        {
          label: "Casa Nube",
          summary: "data-project · tarjeta 01",
          data: { "data-project": "Casa Nube", "data-description": "Un refugio de montaña que necesitaba sentirse tan cálido en pantalla como en persona. Identidad, dirección de arte y experiencia web." }
        },
        {
          label: "Marea",
          summary: "data-project · tarjeta 02",
          data: { "data-project": "Marea", "data-description": "Una identidad fluida para una marca de cuidado personal que encuentra inspiración en el ritmo del océano. Estrategia, identidad y packaging." }
        }
      ]
    }
  ],
  "03-pulse-board": [
    {
      name: "tasks",
      role: "LOCALSTORAGE · TASK[]",
      fields: ["id", "title", "description", "status", "category", "priority", "due", "assignees", "mine"],
      keys: ["id lógico", "status: todo | doing | done"],
      rows: [
        {
          label: "t1 · Definir estructura de navegación",
          summary: "done · research · normal",
          data: { id: "t1", title: "Definir estructura de navegación", description: "Alinear las secciones y sus jerarquías antes de pasar a detalle.", status: "done", category: "research", priority: "normal", due: "09 oct", assignees: ["VP", "AM"], mine: true }
        },
        {
          label: "t2 · Inventario de páginas actuales",
          summary: "done · research · low",
          data: { id: "t2", title: "Inventario de páginas actuales", description: "Listar vistas, estados vacíos y contenido que se debe conservar.", status: "done", category: "research", priority: "low", due: "10 oct", assignees: ["JC"], mine: false }
        }
      ]
    }
  ]
};

const formatPrice = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

function DatabaseCanvas({ projectId }: { projectId: string }) {
  const [view, setView] = useState<DatabaseView>("map");
  const [detailEntity, setDetailEntity] = useState<string | null>(null);
  const isMiniStore = projectId === "01-mini-store";
  const isPulseBoard = projectId === "03-pulse-board";
  const entities = entitiesByProject[projectId] ?? [];
  const title = isMiniStore ? "MODELO RELACIONAL" : isPulseBoard ? "MODELO LOCAL · TASK" : "MODELO DE CONTENIDO";
  const projectName = isMiniStore ? "01-MINI-STORE / SQLITE" : isPulseBoard ? "03-PULSE-BOARD / NAVEGADOR" : "02-FORMA-STUDIO / HTML DATA-*";

  return (
    <section className={`database-canvas${isPulseBoard ? " is-pulse" : ""}${!isMiniStore && !isPulseBoard ? " is-static" : ""}`} aria-label="Canvas de datos del proyecto">
      <header className="anatomy-canvas__header">
        <div className="anatomy-canvas__identity">
          <span className="anatomy-canvas__mark"><Database size={13} aria-hidden="true" /></span>
          <span>
            <strong>{title}</strong>
            <small>{projectName}</small>
          </span>
        </div>
        <div className="anatomy-canvas__views" role="group" aria-label="Vista del modelo de datos">
          <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>
            <Link2 size={11} aria-hidden="true" /> MAPA
          </button>
          <button type="button" aria-pressed={view === "tables"} onClick={() => setView("tables")}>
            <TableProperties size={11} aria-hidden="true" /> DATOS
          </button>
        </div>
      </header>

      <div className="anatomy-canvas__metrics" aria-label="Resumen del modelo">
        {isMiniStore ? (
          <><span><b>03</b> TABLAS</span><span><b>02</b> FK</span><span><b>04</b> SEEDS</span></>
        ) : isPulseBoard ? (
          <><span><b>01</b> MODELO</span><span><b>09</b> CAMPOS</span><span><b>03</b> ESTADOS</span></>
        ) : (
          <><span><b>04</b> VISTAS</span><span><b>03</b> CASOS</span><span><b>00</b> STORAGE</span></>
        )}
        <span className="anatomy-canvas__source">{isMiniStore ? "SQL" : isPulseBoard ? "LOCAL" : "DOM"}</span>
      </div>

      {isMiniStore && view === "map" ? (
        <div className="database-map">
          <div className="database-map__parents">
            <article className="database-entity database-entity--source">
              <span className="database-entity__eyebrow"><Database size={10} /> CATÁLOGO / 06 COL.</span>
              <strong>products</strong>
              <span className="database-entity__detail"><KeyRound size={9} /> PK id · price_cents · stock</span>
              <span className="database-entity__field-cloud"><i>name</i><i>description</i><i>emoji</i></span>
            </article>
            <article className="database-entity database-entity--source">
              <span className="database-entity__eyebrow"><Database size={10} /> CABECERA / 04 COL.</span>
              <strong>orders</strong>
              <span className="database-entity__detail"><KeyRound size={9} /> PK id · customer_name</span>
              <span className="database-entity__field-cloud"><i>total_cents</i><i>created_at</i></span>
            </article>
          </div>

          <div className="database-map__relations" aria-label="Relaciones hacia order_items">
            <span><Link2 size={9} /> product_id → products.id</span>
            <span><Link2 size={9} /> order_id → orders.id</span>
          </div>
          <ArrowDown className="database-map__merge" size={13} aria-hidden="true" />
          <article className="database-entity database-entity--bridge">
            <span className="database-entity__bridge-icon"><Link2 size={13} /></span>
            <span className="database-entity__bridge-copy">
              <span className="database-entity__eyebrow">DETALLE DE COMPRA / PUENTE</span>
              <strong>order_items</strong>
            </span>
            <span className="database-entity__composite"><KeyRound size={9} /> PK COMPUESTA · order_id + product_id</span>
            <span className="database-entity__field-cloud"><i>quantity</i><i>product_name</i><i>unit_price_cents</i></span>
          </article>

          <div className="database-seeds">
            <div className="database-seeds__heading"><span>STOCK DISPONIBLE / products</span><span>TRAS PEDIDOS DEMO</span></div>
            <div className="database-seeds__grid">
              {productSeeds.map((product) => (
                <div className="database-seed" key={product.name}>
                  <span>{product.name}</span>
                  <strong>{formatPrice.format(product.price)}</strong>
                  <progress value={product.stock} max={20} aria-label={`${product.stock} unidades disponibles`} />
                  <small>{product.stock} U. STOCK</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="database-entities">
          {entities.map((entity) => (
            <article className="database-entity-card" key={entity.name}>
              <div className="database-entity-card__head">
                <span>{entity.role}</span>
                <strong>{entity.name}</strong>
                <small>{entity.rows.length} FILAS MUESTRA</small>
              </div>
              <div className="database-entity-card__keys">
                {entity.keys.map((key) => <span key={key}><KeyRound size={9} /> {key}</span>)}
              </div>
              <div className="database-entity-card__rows">
                {entity.rows.slice(0, 2).map((row) => (
                  <div className="database-entity-card__row" key={row.label}>
                    <strong>{row.label}</strong><span>{row.summary}</span>
                  </div>
                ))}
              </div>
              <button className="database-entity-card__detail" type="button" onClick={() => setDetailEntity(entity.name)}>
                VER CONTENIDO <span>↗</span>
              </button>
            </article>
          ))}
          <p className="database-entities__note">
            {isMiniStore
              ? "Muestra manual alineada al seeder; no es consulta runtime."
              : isPulseBoard
                ? "JSON inicial del tablero · no es una tabla SQL."
                : "Tarjetas escritas en HTML · no es una tabla SQL ni un seeder JS."}
          </p>
          {detailEntity && (
            <div className="database-data-detail" role="dialog" aria-modal="false" aria-label={`Contenido de ${detailEntity}`}>
              <header><strong>{detailEntity} · 2 FILAS MUESTRA</strong><button type="button" aria-label="Cerrar detalle" onClick={() => setDetailEntity(null)}><X size={13} /></button></header>
              <div>
                {entities.find((entity) => entity.name === detailEntity)?.rows.slice(0, 2).map((row) => (
                  <article key={row.label}>
                    <strong>{row.label}</strong>
                    <pre>{JSON.stringify(row.data, null, 2)}</pre>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <footer className="anatomy-canvas__tags">
        {isMiniStore
          ? <><span>#ecommerce</span><span>#pedido</span><span>#inventario</span><span>#transacción</span></>
          : isPulseBoard
            ? <><span>#kanban</span><span>#tareas</span><span>#json</span><span>#localstorage</span></>
            : <><span>#portfolio</span><span>#html-data</span><span>#estático</span></>}
      </footer>
    </section>
  );
}

export default DatabaseCanvas;

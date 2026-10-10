import { useState } from "react";
import { ArrowDown, ArrowRight, Database, KeyRound, Link2, TableProperties } from "lucide-react";

type DatabaseView = "map" | "tables";

const tables = [
  {
    name: "products",
    role: "CATÁLOGO",
    fields: ["id", "name", "description", "price_cents", "stock", "emoji"],
    primaryKey: "id",
    foreignKeys: []
  },
  {
    name: "orders",
    role: "PEDIDO",
    fields: ["id", "customer_name", "total_cents", "created_at"],
    primaryKey: "id",
    foreignKeys: []
  },
  {
    name: "order_items",
    role: "PUENTE",
    fields: ["order_id", "product_id", "product_name", "quantity", "unit_price_cents"],
    primaryKey: "order_id + product_id",
    foreignKeys: ["order_id → orders.id", "product_id → products.id"]
  }
];

const productSeeds = [
  { name: "TAZA", price: 1800, stock: 12 },
  { name: "CUADERNO", price: 1250, stock: 18 },
  { name: "BOLSO", price: 3200, stock: 7 },
  { name: "LÁMPARA", price: 4550, stock: 5 }
];

const formatPrice = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0
});

function DatabaseCanvas() {
  const [view, setView] = useState<DatabaseView>("map");

  return (
    <section className="database-canvas" aria-label="Canvas del modelo de datos">
      <header className="anatomy-canvas__header">
        <div className="anatomy-canvas__identity">
          <span className="anatomy-canvas__mark"><Database size={13} aria-hidden="true" /></span>
          <span>
            <strong>MODELO RELACIONAL</strong>
            <small>01-MINI-STORE / SQLITE</small>
          </span>
        </div>
        <div className="anatomy-canvas__views" role="group" aria-label="Vista del modelo de datos">
          <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}>
            <Link2 size={11} aria-hidden="true" /> MAPA
          </button>
          <button type="button" aria-pressed={view === "tables"} onClick={() => setView("tables")}>
            <TableProperties size={11} aria-hidden="true" /> ENTIDADES
          </button>
        </div>
      </header>

      <div className="anatomy-canvas__metrics" aria-label="Resumen del esquema">
        <span><b>03</b> TABLAS</span>
        <span><b>02</b> FK</span>
        <span><b>04</b> SEEDS</span>
        <span className="anatomy-canvas__source">MANUAL</span>
      </div>

      {view === "map" ? (
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
            <div className="database-seeds__heading"><span>VALORES INICIALES / products</span><span>SEED EN CÓDIGO</span></div>
            <div className="database-seeds__grid">
              {productSeeds.map((product) => (
                <div className="database-seed" key={product.name}>
                  <span>{product.name}</span>
                  <strong>{formatPrice.format(product.price)}</strong>
                  <i style={{ "--stock-level": `${product.stock / 20 * 100}%` } as React.CSSProperties} />
                  <small>{product.stock} U. STOCK</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="database-entities">
          {tables.map((table, index) => (
            <article className="database-entity-card" key={table.name}>
              <div className="database-entity-card__head">
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{table.name}</strong>
                <small>{table.role} · {table.fields.length} CAMPOS</small>
              </div>
              <div className="database-entity-card__keys">
                <span><KeyRound size={9} /> PK {table.primaryKey}</span>
                {table.foreignKeys.map((foreignKey) => <span key={foreignKey}><Link2 size={9} /> FK {foreignKey}</span>)}
              </div>
              <div className="database-entity-card__fields">
                {table.fields.map((field) => (
                  <span className={field.includes("price") || field === "stock" ? "is-business-field" : ""} key={field}>
                    {field}
                  </span>
                ))}
              </div>
            </article>
          ))}
          <p className="database-entities__note">customer_name vive en orders; no existe una tabla customers.</p>
        </div>
      )}

      <footer className="anatomy-canvas__tags">
        <span>#ecommerce</span><span>#pedido</span><span>#inventario</span><span>#transacción</span>
      </footer>
    </section>
  );
}

export default DatabaseCanvas;

const fs = require("node:fs");
const path = require("node:path");
const Database = require("better-sqlite3");

const dataDirectory = path.join(__dirname, "..", "data");
fs.mkdirSync(dataDirectory, { recursive: true });

const database = new Database(path.join(dataDirectory, "store.sqlite"));
database.pragma("journal_mode = WAL");

database.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    stock INTEGER NOT NULL CHECK (stock >= 0),
    emoji TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    total_cents INTEGER NOT NULL CHECK (total_cents >= 0),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS order_items (
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_cents INTEGER NOT NULL CHECK (unit_price_cents >= 0),
    PRIMARY KEY (order_id, product_id)
  );
`);

const seedProducts = database.prepare(`
  INSERT OR IGNORE INTO products
    (id, name, description, price_cents, stock, emoji)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const seed = database.transaction(() => {
  [
    [1, "Taza de domingo", "Cerámica hecha para mañanas sin prisa.", 1800, 12, "☕"],
    [2, "Cuaderno de ideas", "Papel grueso para planes grandes y pequeños.", 1250, 18, "📓"],
    [3, "Bolso de paseo", "Lona resistente, bolsillo interior y cero complicaciones.", 3200, 7, "👜"],
    [4, "Lámpara de mesa", "Luz cálida para leer un capítulo más.", 4550, 5, "💡"]
  ].forEach((product) => seedProducts.run(...product));
});

seed();

const listProducts = database.prepare(`
  SELECT id, name, description, price_cents AS priceCents, stock, emoji
  FROM products
  ORDER BY id
`);

const getProduct = database.prepare(`
  SELECT id, name, price_cents AS priceCents, stock
  FROM products
  WHERE id = ?
`);

const insertOrder = database.prepare(`
  INSERT INTO orders (customer_name, total_cents)
  VALUES (?, ?)
`);

const insertOrderItem = database.prepare(`
  INSERT INTO order_items
    (order_id, product_id, product_name, quantity, unit_price_cents)
  VALUES (?, ?, ?, ?, ?)
`);

const reduceStock = database.prepare(`
  UPDATE products
  SET stock = stock - ?
  WHERE id = ? AND stock >= ?
`);

const createOrder = database.transaction((customerName, items) => {
  let totalCents = 0;
  const resolvedItems = items.map(({ productId, quantity }) => {
    const product = getProduct.get(productId);
    if (!product) {
      throw new Error(`No existe el producto ${productId}.`);
    }
    if (product.stock < quantity) {
      throw new Error(`No hay stock suficiente de "${product.name}".`);
    }
    totalCents += product.priceCents * quantity;
    return { ...product, quantity };
  });

  const order = insertOrder.run(customerName, totalCents);
  for (const item of resolvedItems) {
    const update = reduceStock.run(item.quantity, item.id, item.quantity);
    if (update.changes !== 1) {
      throw new Error(`No hay stock suficiente de "${item.name}".`);
    }
    insertOrderItem.run(
      order.lastInsertRowid,
      item.id,
      item.name,
      item.quantity,
      item.priceCents
    );
  }

  return { id: Number(order.lastInsertRowid), totalCents };
});

module.exports = { createOrder, listProducts };

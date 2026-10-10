# 01 · Mini Store

Tienda full-stack mínima: vitrina estática con Bootstrap, API local en Node y
base SQLite. El navegador conserva el carrito; los pedidos y descuentos de
stock se registran en esta máquina.

## Run locally

```sh
npm install
npm start
```

Open <http://localhost:4171>. The database is created and seeded in `data/` on
the first run. Stop the server with `Ctrl+C`.

## Anatomy

- `frontend/`: product listing, cart interactions and checkout.
- `backend/server.js`: static-file server and JSON API.
- `backend/database.js`: schema, seed data and transactional order creation.
- `data/`: generated local database; it is intentionally not committed.

The Bootstrap stylesheet is loaded from its CDN. This demo is intentionally
small and is not intended for production use.

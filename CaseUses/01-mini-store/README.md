# 01 · Mini Store

A tiny full-stack shop: a static Bootstrap storefront, a Node HTTP API and a
SQLite database. The browser keeps the active cart in local storage; completed
orders and stock changes are stored in SQLite on this machine.

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

# Kaktus

Kaktus is a local, visual workspace for understanding and navigating software
projects. The current frontend reads project summaries from `CaseUses/`. The
interface has mock onboarding, a project dashboard with separate view modes,
and per-project detail views including an IDE and a multitrack skeleton.
Onboarding and editing controls are clearly marked as simulated; project
contents continue to come from the local filesystem.

Product structure and UX contracts:

- [Information architecture](./docs/product/arquitectura-de-informacion.md)
- [UX proposal](./docs/product/experiencia-ux.md)
- [Navigation and screens](./docs/product/navegacion-y-pantallas.md)
- [Product logic](./docs/product/logica-del-producto.md)
- [Taxonomy, views, and data audit](./docs/product/auditoria-taxonomia-y-datos.md)
- [Case-study software anatomy audit](./docs/product/auditoria-anatomia-caseuses.md)
- [Frontend conventions](./docs/product/convenciones-frontend.md)
- [SQLite data model](./docs/data/modelo-de-datos.md)
- [SQLite and backend roadmap](./docs/roadmap/sqlite-y-backend.md)

See [Bitacora.md](./Bitacora.md) for implementation history and current status.
The local Node.js API uses SQLite for workspace metadata, project snapshots,
file-tree indexes, and validated UI preferences. The filesystem remains
authoritative: file contents are read from disk on demand and are never stored
in SQLite. The dashboard and Studio persist order, Studio view, and selected
file preferences, and expose manual workspace rescans; the URL remains
authoritative for the active view. A stored default dashboard view is not yet
used to resolve an entry route; see the
[taxonomy and data audit](./docs/product/auditoria-taxonomia-y-datos.md).
The onboarding folder explorer reads real local directories under the demo
root; navigation within that root is available, but changing the selected root
is locked until folder selection is implemented.

## GitHub Pages demo

The `Deploy GitHub Pages` workflow publishes the frontend as a static demo from
the `master` branch. To build the same artifact locally, run
`npm --prefix frontend run build:pages`; the output is written to
`frontend/dist/`. The Pages build opens directly in the Mini Store Multipista
view and does not include the local API or filesystem access, so project
anatomy shown there is illustrative demo content.

## Run in local development

Use two terminals from the workspace root:

```sh
npm run api
```

```sh
npm --prefix frontend install
npm run dev
```

Open the Vite URL printed in the frontend terminal. The current API is bound to
`127.0.0.1:4170`, initializes SQLite under the user data directory, and reads
project summaries/trees from the latest successful snapshots. It reads selected
text files from `CaseUses/` on demand with bounded, read-only access. Workspace
rescans and workspace/project preferences are available through the API.

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
- [Frontend conventions](./docs/product/convenciones-frontend.md)
- [SQLite data model](./docs/data/modelo-de-datos.md)
- [SQLite and backend roadmap](./docs/roadmap/sqlite-y-backend.md)

See [Bitacora.md](./Bitacora.md) for implementation history and current status.
The backend now opens a local SQLite database and applies the initial schema;
the filesystem remains authoritative, and project metadata is not indexed in
SQLite yet.

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
`127.0.0.1:4170`, reads summaries, project trees and selected text files from
`CaseUses/`, and initializes its SQLite schema under the user data directory.
File access is read-only and bounded. Persisted scans and preferences are not
connected yet.

# Kaktus

Kaktus is a local, visual workspace for understanding and navigating software
projects. The current frontend reads project summaries from `CaseUses/`. The
product design phase defines an IDE-like flow: mock onboarding, a project
dashboard with its own view modes, and per-project detail views. Onboarding and
editing controls will be clearly marked as simulated; project data continues to
come from the local filesystem.

The current product proposals are:

- [Information architecture](./docs/product/arquitectura-de-informacion.md)
- [UX proposal](./docs/product/experiencia-ux.md)
- [Navigation and screens](./docs/product/navegacion-y-pantallas.md)
- [Product logic](./docs/product/logica-del-producto.md)
- [Frontend conventions](./docs/product/convenciones-frontend.md)
- [Data model proposal](./docs/data/modelo-de-datos.md)

See [Bitacora.md](./Bitacora.md) for the current implementation state and
step-by-step work roadmap. Validate these proposals with Figma before building
the frontend view structure.

## Run in local development

Use two terminals from the workspace root:

```sh
npm run api
```

```sh
npm --prefix frontend install
npm run dev
```

Open the Vite URL printed in the frontend terminal. The API is bound to
`127.0.0.1:4170` and only exposes project summaries for the workspace's
`CaseUses/` folder. It does not upload or modify project files.

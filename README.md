# CeJey

CeJey starts as a local visual explorer for development projects. The first
screen reads project folders from `CaseUses/` and shows their file/folder
counts and an inferred stack. Project details and source editing are future
steps.

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

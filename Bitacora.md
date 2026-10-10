# Bitácora de CeJey

**Última actualización:** 2026-10-09  
**Propósito:** conservar el contexto funcional y técnico para retomar el trabajo
si se pierde la conversación.

## Qué es CeJey

CeJey (CJ) es una herramienta local para comprender y navegar visualmente
proyectos de desarrollo. El código fuente sigue siendo la fuente de verdad; el
canvas/dashboard es una representación navegable de su estructura y significado.
No se está construyendo una extensión de IDE ni una experiencia VR.

Principios acordados:

- Ejecutar y probar primero en local; los archivos del proyecto no se suben a
  ningún servicio.
- Priorizar comprensión, navegación y visualización antes que edición desde el
  canvas.
- Separar lectura, análisis e interpretación semántica a medida que evolucione
  el producto.
- Distinguir hechos detectados de inferencias. El código no entendido debe
  permanecer visible y no presentarse como código muerto sin evidencia.
- Mantener `CaseUses/` como colección de proyectos de prueba para observar cómo
  CeJey representa anatomías de software distintas.

## Entorno de desarrollo

- Trabajamos en WSL2 remoto, Linux x86_64.
- El shell configurado es zsh 5.9.
- Node.js 20 y npm 10 están disponibles.
- Workspace actual: `/home/vandalit/work/vandalit/CeJey`.
- No se ha conectado ni publicado este repositorio en GitHub.
- El directorio raíz se puede renombrar localmente: Git conserva el historial
  si se mueve también el directorio oculto `.git`. Después hay que volver a
  abrir la nueva ruta en VS Code/WSL; las terminales y tareas antiguas pueden
  necesitar reiniciarse.

## Estructura actual

```text
CeJey/
├── backend/
│   └── server.js             # API local de lectura del workspace
├── frontend/
│   ├── src/
│   │   ├── App.tsx           # Dashboard de proyectos
│   │   ├── main.tsx          # Entrada de React
│   │   └── styles.css        # Sistema visual y responsive
│   ├── index.html
│   ├── package.json          # React, Vite, TypeScript, Lucide
│   └── vite.config.ts        # Proxy /api hacia el backend local
├── CaseUses/
│   ├── 01-mini-store/        # Ecommerce full-stack y SQLite
│   ├── 02-forma-studio/      # Sitio estático multi-vista animado
│   ├── 03-pulse-board/       # Tablero client-side con CRUD
│   └── README.md
├── README.md
├── Bitacora.md
└── package.json              # Scripts de arranque de CeJey
```

## Demos de `CaseUses/`

1. **Mini Store**: tienda rudimentaria con frontend HTML/CSS/Bootstrap CDN,
   backend Node, API de catálogo/pedidos y SQLite local. El carrito vive en el
   navegador; pedidos y stock se guardan en la base local.
2. **Forma Studio**: web estática de varias vistas, navegación y animaciones CSS
   originales.
3. **Pulse Board**: aplicación estática de tablero de tareas con vistas Kanban y
   lista, filtros, creación/edición/eliminación y `localStorage`.

Cada demo tiene su propio README. Son material de análisis, no forman parte de
la interfaz principal de CeJey.

## Implementación actual de CeJey

### Backend

`backend/server.js` expone:

- `GET /api/health`: verificación básica.
- `GET /api/projects`: lee las carpetas directas de `CaseUses/` y resume cada
  proyecto.

El resumen incluye id/carpeta, nombre derivado del README, descripción, número
de archivos y subcarpetas, tipo general y stack aproximado. Los directorios
pesados o generados —por ejemplo `node_modules`, `dist`, `build`, `.git` y
`coverage`— se omiten. Se ignoran enlaces simbólicos para evitar seguir rutas
fuera del workspace. El servicio se enlaza a `127.0.0.1:4170`, no escribe en los
proyectos y solo entrega metadatos del contenido.

El stack es una primera heurística, no un análisis semántico: combina
extensiones, dependencias de `package.json` y unas señales explícitas para los
demos. Revisarlo/mejorarlo será parte del futuro análisis.

### Frontend

`frontend/src/App.tsx` implementa el dashboard inicial:

- Dashboard estilo bento con resumen del número de proyectos, archivos y
  carpetas.
- Tarjetas de proyecto con descripción, chips de stack, métricas y una cara
  posterior (“ficha rápida”) con más metadatos.
- Búsqueda, inversión del orden, recarga de datos, atajo `Ctrl+K`, estados de
  carga/error/vacío y aviso para la futura vista de detalle.
- Responsive, con consideración para `prefers-reduced-motion`.

Las tarjetas “Explorar”/“Abrir mapa” aún no abren una vista de detalle; solo
indican que esa vista será el siguiente paso.

## Cómo ejecutar localmente

Desde la raíz del workspace, en dos terminales:

```sh
npm run api
```

```sh
npm run dev
```

Abre la URL que imprima Vite (normalmente `http://localhost:5173`). El frontend
envía `/api` al backend local del puerto 4170. Al terminar, detén ambas
terminales con `Ctrl+C`.

Si faltan dependencias del frontend:

```sh
npm --prefix frontend install
```

Para construir y comprobar tipos:

```sh
npm --prefix frontend run build
```

La tienda demo tiene dependencias separadas; sus instrucciones están en
`CaseUses/01-mini-store/README.md`.

## Estado registrado al escribir esta bitácora

- El frontend se construyó correctamente con `npm --prefix frontend run build`.
- Se comprobó en navegador la lectura de tres proyectos, búsqueda, flip de
  tarjeta, aviso de detalle, atajo `Ctrl+K` y responsive hasta 320 px sin
  desbordamiento horizontal.
- La API devolvió los tres resúmenes esperados.
- Los servidores locales de CeJey y de los demos quedaron detenidos.
- `git status` estaba limpio al iniciar esta bitácora. Los cambios previos
  están en commits locales, aún no publicados a un remoto.

## Siguiente rumbo

Continuar refinando la interfaz del dashboard y, después, definir la vista de
detalle del proyecto. Esa vista podrá comenzar con árbol de archivos,
estructura y enlaces entre entidades; conviene acordar su anatomía antes de
implementar análisis más profundo o edición de código.

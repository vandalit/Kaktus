# Bitácora de Kaktus

**Última actualización:** 2026-10-10
**Propósito:** conservar el contexto funcional y técnico para retomar el trabajo
si se pierde la conversación.

## Qué es Kaktus

Kaktus es el producto y el nombre del repositorio: un entorno local, visual y
tipo IDE para comprender y navegar proyectos de desarrollo. El código fuente
sigue siendo la fuente de verdad; sus vistas son representaciones navegables
de la estructura y el significado del proyecto. El MVP ya incluye API local,
SQLite para snapshots/preferencias y un frontend conectado al workspace demo;
no incluye edición real ni análisis semántico profundo.

Principios acordados:

- Ejecutar y probar primero en local; los archivos del proyecto no se suben a
  ningún servicio.
- Avanzar paso a paso: definir el modelo, la navegación y los componentes antes
  de implementar cada vista; al cerrar cada objetivo, revisar la coherencia del
  conjunto.
- Diferenciar explícitamente datos reales, datos mock y funciones simuladas con
  banners horizontales de contexto técnico/funcional.
- Priorizar comprensión, navegación y visualización; la edición real queda fuera
  del alcance de las maquetas.
- Separar lectura, análisis e interpretación semántica a medida que evolucione
  el producto.
- Distinguir hechos detectados de inferencias. El código no entendido debe
  permanecer visible y no presentarse como código muerto sin evidencia.
- Mantener `CaseUses/` como colección de proyectos de prueba para observar cómo
  Kaktus representa anatomías de software distintas.

## Taxonomía del producto

Usar estos términos de manera consistente en diseño, código y documentación:

- **Workspace / espacio de trabajo:** contexto que contiene una o más raíces de
  proyecto. El MVP solo inicializa el workspace demo `workspace-demo`.
- **Origen / raíz:** carpeta seleccionada para explorar. Conectar o seleccionar
  una carpeta/repositorio desde el onboarding sigue siendo mock; `CaseUses/` es
  la raíz local real que alimenta la demo.
- **Proyecto:** carpeta de proyecto detectada dentro de la raíz. En el caso
  actual, cada carpeta directa de `CaseUses/` es un proyecto.
- **Identidad:** id estable con que se referencia un workspace, proyecto o
  archivo. SQLite asigna UUID al proyecto, aunque la API/interfaz demo todavía
  exponen la ruta relativa como `Project.id`; la ruta no es aún un ID canónico
  en la interfaz.
- **Datos / fuente de verdad:** los archivos reales del filesystem. La API local
  lee archivos y guarda en SQLite un índice reconstruible de metadata,
  snapshots y preferencias. La base no almacena el contenido fuente.
- **Dashboard:** nivel que resume y compara el conjunto de proyectos del
  workspace. Sus diferentes modos muestran los mismos proyectos con distintas
  visualizaciones; cambiar el modo no abre un proyecto.
- **Vista:** una perspectiva o modo de presentación dentro de un mismo contexto.
  Hay vistas del dashboard y, por separado, vistas de detalle del proyecto.
- **Resumen del proyecto:** pantalla entre el dashboard y el Studio, con
  identidad, resumen y acceso al espacio del proyecto.
- **Studio:** contexto enfocado en un proyecto con vistas IDE y Multipista.
- **Ítem:** elemento mostrado dentro de una vista, por ejemplo una tarjeta de
  proyecto en el dashboard o un archivo/carpeta en el explorador IDE. Un ítem no
  es una vista ni constituye por sí mismo una identidad estable.
- **Componente:** pieza de interfaz reutilizable y enfocada, por ejemplo banner
  técnico, selector de vistas, tarjeta de proyecto, árbol de archivos o editor
  de solo lectura.

### Niveles de navegación previstos

1. **Onboarding:** pantalla inicial tipo IDE para elegir una carpeta raíz o
   conectar un repositorio. La selección real es mock; un botón permite
   continuar al workspace de demostración.
2. **Dashboard del workspace:** resume los proyectos encontrados. Conserva su
   selector de vistas, que cambia solo la presentación del dashboard.
3. **Resumen del proyecto:** destino al seleccionar un proyecto, previo al
   Studio.
4. **Studio del proyecto:** contexto independiente con vistas IDE y Multipista
   y una tercera opción bloqueada **En construcción**.

El selector de vistas del dashboard y el selector de vistas del proyecto son
controles distintos, con alcance y estado separados. Al entrar/salir del detalle
debe ser claro cómo volver al dashboard y conservar la orientación del usuario.

## Entorno de desarrollo

- Trabajamos en WSL2 remoto, Linux x86_64.
- El shell configurado es zsh 5.9.
- Node.js 20 y npm 10 están disponibles.
- Workspace actual: `/home/vandalit/work/vandalit/Kaktus`.
- No se ha conectado ni publicado este repositorio en GitHub.
- El directorio raíz se puede renombrar localmente: Git conserva el historial
  si se mueve también el directorio oculto `.git`. Después hay que volver a
  abrir la nueva ruta en VS Code/WSL; las terminales y tareas antiguas pueden
  necesitar reiniciarse.

## Estructura actual

```text
Kaktus/
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
└── package.json              # Scripts de arranque de Kaktus
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
la interfaz principal de Kaktus.

## Implementación actual de Kaktus

### Backend

Backend Node.js local, API HTTP nativa, `better-sqlite3` y filesystem como
fuente de verdad. SQLite persiste el workspace demo y snapshots reconstruibles;
no guarda contenido de archivos. La API escucha en `127.0.0.1:4170`.

Endpoints actuales:

- `GET /api/health`: verifica que SQLite responda; devuelve estado genérico sin
  revelar rutas locales.
- `GET /api/projects`: obtiene resumen y tecnologías desde el snapshot completo
  más reciente.
- `GET /api/projects/:id/tree`: obtiene el árbol del snapshot; acepta UUID
  persistente y alias de ruta de carpeta para compatibilidad.
- `GET /api/projects/:id/file?path=...`: lee el archivo real en modo solo
  lectura, validando traversal, symlinks, tipo y límite de tamaño.
- `POST /api/workspaces/:id/scan`: reescaneo local explícito; un error parcial
  conserva el último snapshot exitoso.
- `GET /api/workspaces/:id/source-browser?path=...`: lectura de directorios
  bajo la raíz registrada para el explorador de onboarding; no expone la ruta
  absoluta ni permite salir de la raíz.
- `GET/PATCH /api/workspaces/:id/preferences` y
  `GET/PATCH /api/projects/:id/preferences`: lectura/escritura parcial con
  catálogos cerrados; rutas de archivo se validan contra el último snapshot.

Los endpoints tienen cobertura de integración HTTP con base aislada. El
frontend consume listado, árbol y lectura, expone reescaneo manual y persiste
modo/orden de dashboard, vista de Studio y archivo seleccionado. La URL sigue
siendo la autoridad para la vista activa.

`frontend/src/api/client.ts` centraliza los contratos tipados. La UI muestra el
estado real de la conexión API/SQLite, y señala errores de persistencia sin
bloquear la exploración local. La recarga del dashboard dispara un reescaneo y
luego vuelve a leer el snapshot actualizado.

El onboarding abre un explorador local que lee carpetas y archivos reales y
muestra la jerarquía de la raíz demo. La navegación permite inspeccionar
subdirectorios sin cambiar la raíz fijada; **Aceptar y continuar** es la única
acción que entra al dashboard.

### Frontend

`frontend/src/App.tsx` implementa un dashboard inicial:

- Dashboard estilo bento con resumen del número de proyectos, archivos y
  carpetas.
- Tarjetas de proyecto con descripción, chips de stack, métricas y una cara
  posterior (“ficha rápida”) con más metadatos.
- Búsqueda, inversión del orden, recarga de datos, atajo `Ctrl+K`, estados de
  carga/error/vacío y aviso para la futura vista de detalle.
- Responsive, con consideración para `prefers-reduced-motion`.

El dashboard obtiene resúmenes reales desde `CaseUses/`. El onboarding ya lo
antecede como entrada a la demo; todavía no hay selector de vistas ni detalle
IDE. Las tarjetas “Explorar”/“Abrir mapa” siguen mostrando un aviso en lugar de
abrir una vista de proyecto. El contenido de dashboard permanece concentrado en
`App.tsx` y puede descomponerse gradualmente según avance el flujo.

### Avance frontend: onboarding

- La ruta raíz `/` presenta el onboarding con opciones de carpeta local y
  GitHub/remoto; el modal inicial aclara que solo se puede continuar con el repo
  demo local.
- La opción remota está visible, deshabilitada y marcada como no disponible.
- **Conectar repo demo** navega a
  `/workspaces/demo/dashboard/projects`; el dashboard existente se conserva y
  carga desde la API local los tres proyectos de `CaseUses/`.
- Los banners distinguen demo local, límites de la maqueta y solo lectura.
- El frontend adoptó tokens CSS semánticos y tema oscuro. Componentes iniciales:
  `OnboardingScreen` y `StatusBanner`; ver
  [convenciones de frontend](./docs/product/convenciones-frontend.md).
- Sin cambios de backend ni conexión a servicios remotos.

### Avance frontend: detalle de proyecto

- Las tarjetas de proyecto abren el detalle al seleccionar cualquiera de sus
  caras; el control de flip queda por encima del área clickeable y mantiene su
  comportamiento.
- La vista de detalle ocupa el canvas principal y conserva el sidebar. Oculta la
  topbar anterior para usar un breadcrumb contextual y retorno al dashboard.
- El resumen usa los datos reales disponibles (descripción, tipo, conteos y
  stack estimado), con la aproximación indicada.
- El CTA **Editar proyecto** está presente pero comunica que es una interacción
  de demostración y no escribe archivos.
- Monitores, conexiones y salud son datos mock con banners/etiquetas explícitas.
- La selección del proyecto queda en la ruta
  `/workspaces/demo/projects/:projectId/classic-ide`; regresar vuelve al
  dashboard.
- Verificación navegador: la cara frontal y posterior abren el mismo detalle,
  flip intacto, sidebar persistente, topbar oculta, CTA informativo y vista
  estrecha sin overflow horizontal.
- `npm --prefix frontend run build` y `git diff --check` pasan. No se modificó
backend.

### Avance frontend: modos del dashboard

- El dashboard mantiene el modo visual `projects` como default y añade un
  selector segmentado tipo dial arriba a la derecha para cambiar a `console`.
- Ambos modos comparten proyectos, búsqueda/orden vigente y datos de la misma
  API local; el modo consola no realiza una segunda lectura ni inventa proyectos.
- La vista `console` presenta índice condensado, divisores, tags de stack,
  conteos locales y mini monitores simulados de CPU/MEM/IO.
- Los iconos de búsqueda/filtros avanzados están deshabilitados y tienen
  tooltips que explican su indisponibilidad.
- Cambiar de modo actualiza la ruta del dashboard; volver desde un detalle
  conserva el modo elegido. El detalle de proyecto no muestra el selector del
  dashboard.
- Cada modo conserva su patrón de exploración: las tarjetas de `projects` abren
  la vista de detalle; las filas de `console` expanden un resumen inline, sin
  navegar a esa vista. Solo una fila queda abierta a la vez.
- El detalle expandido muestra resumen, métricas/stack reales y monitores/
  conexiones mock marcados dentro del layout consola.
- Las acciones de herramientas están deshabilitadas con `title` explicativo; los
  mini monitores declaran que no miden recursos reales.
- Verificación navegador: ambos modos muestran los mismos tres proyectos; se
  probó apertura de detalle desde tarjetas de `projects`, retorno a `console`,
  controles mock deshabilitados y layout móvil sin overflow horizontal. En
  `console`, abrir otra fila cierra la anterior; volver a pulsar la fila abierta
  cierra el panel. La URL se mantiene en Consola y el panel expandido no genera
  overflow horizontal a 390 px.
- `npm --prefix frontend run build` y `git diff --check` pasan.

### Avance frontend: Studio / IDE

- Se formaliza una jerarquía de cuatro niveles: onboarding, dashboard del
  workspace, resumen de proyecto y Studio del proyecto.
- Las tarjetas abren el resumen en `/workspaces/demo/projects/:projectId`.
  **Editar proyecto** abre `/workspaces/demo/projects/:projectId/studio/ide`;
  el retorno desde Studio vuelve al resumen, no directamente al dashboard.
- El Studio presenta un explorador del árbol real y contenido de texto local en
  solo lectura. El API limita la lectura a carpetas de `CaseUses/`, omite
  directorios ignorados y enlaces simbólicos, rechaza traversal y archivos
  mayores a 1 MB.
- La terminal es visual y no ejecuta comandos. El chat no está conectado: al
  enviar un mensaje muestra espera durante 10 segundos y responde que no está
  disponible.
- Los estilos del IDE se adaptan a móvil y mantienen explorador, editor,
  terminal y chat como paneles diferenciados.
- Documentación de navegación y lógica del producto actualizada para reflejar
  el nivel de Studio, sus rutas y el límite de solo lectura.
- Verificación local: el API lista el árbol real y lee archivos de Mini Store;
  traversal fuera de la raíz devuelve `400`. En navegador se validó el flujo
  resumen → Studio → resumen, selección de `README.md`, los tres paneles,
  responsive a 390 px sin overflow y respuesta del chat tras 10 segundos.
- `npm --prefix frontend run build`, `node --check backend/server.js` y
  `git diff --check` pasan.

### Ajustes del Studio: rail, vistas y multipista

- Al entrar a un proyecto en Studio, el sidebar pasa a rail compacto lateral con
  iconos; el dashboard y el resumen conservan su navegación original.
- Se añadió barra superior compartida con proyecto, retorno al resumen y
  selector segmentado de tres posiciones: `IDE`, `Multipista` y `En construcción`
  bloqueada con tooltip.
- `Multipista` es una vista propia dentro del Studio, con componentes separados
  para Preview, Directorio y Timeline. Presenta dos paneles superiores y una
  zona multipista de ancho completo con ruler, columnas, filas y clips coloreados.
  La interacción de medios sigue mock y los controles están deshabilitados.
- Se ocultan visualmente los scrollbars del editor, explorador y timeline sin
  quitar el desplazamiento nativo.
- Documentos de arquitectura de información, UX, navegación y lógica del
  producto actualizados para distinguir las dos vistas habilitadas del Studio.
- Verificación de interfaz: rail lateral de 62 px; el toggle alterna rutas IDE y
  Multipista, mientras que la tercera opción no cambia el destino. El editor
  admite scroll horizontal/vertical programático con barras ocultas; timeline
  muestra su ruler alineado, paneles y filas sin overflow horizontal del canvas.
- `npm --prefix frontend run build` y `git diff --check` pasan.

### Simplificación del detalle y la vista Multipista

- El resumen de proyecto incorpora un CTA ancho de retorno al dashboard y hace
  clickeable la zona de identidad del encabezado; `Editar proyecto` conserva su
  acción independiente.
- La vista Multipista conserva los marcos vacíos de Preview y Directorio con
  sus iconos/títulos. El panel inferior mantiene título, retícula, filas y
  bloques de color, sin timestamps, etiquetas de pista, filtros ni controles.
- Se actualizaron los contratos de arquitectura de información, UX,
  navegación y la bitácora. El backend no se modificó.

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
- Los servidores locales de Kaktus y de los demos quedaron detenidos.
- `git status` estaba limpio al iniciar esta bitácora. Los cambios previos
  están en commits locales, aún no publicados a un remoto.

## Estado de producto y hoja de ruta

La jerarquía de pantallas y los límites entre dashboard, resumen de proyecto y
Studio están definidos. SQLite, el backend local y la conexión frontend están
implementados para el workspace demo; no están habilitadas la selección real
de carpetas, la conexión Git remota ni la escritura de archivos.

La [hoja de ruta SQLite y backend](./docs/roadmap/sqlite-y-backend.md) es la
referencia activa. La integración demo está validada; la siguiente etapa es
alinear IDs, rutas, alcance de workspace y preferencias antes de generalizar el
onboarding o habilitar múltiples raíces.

## Documentos vigentes

- [Arquitectura de información](./docs/product/arquitectura-de-informacion.md):
  jerarquía y entidades.
- [Experiencia UX](./docs/product/experiencia-ux.md): contrato de interacción.
- [Navegación y pantallas](./docs/product/navegacion-y-pantallas.md): rutas y
  transiciones implementadas.
- [Lógica del producto](./docs/product/logica-del-producto.md): reglas de datos.
- [Convenciones de frontend](./docs/product/convenciones-frontend.md): estilos y
  componentes.
- [Modelo de datos](./docs/data/modelo-de-datos.md): esquema y decisiones de
  persistencia SQLite.
- [Auditoría de taxonomía y datos](./docs/product/auditoria-taxonomia-y-datos.md):
  inventario de valores dinámicos, persistidos, de configuración y mock, y
  hoja de ruta de alineación.
- [Roadmap SQLite y backend](./docs/roadmap/sqlite-y-backend.md): etapas y
  criterios de terminado.

## Decisiones técnicas registradas

- Mantener React 19, TypeScript, Vite, CSS existente y navegación History API
  mientras cubran el alcance.
- SQLite es local y almacena identidades, metadatos, snapshots y preferencias;
  el filesystem conserva autoridad sobre archivos/contenido.
- No almacenar contenido fuente, credenciales, eventos mock ni telemetría.
- Desarrollo actual: Node 20.20 en WSL; primer MVP local para Linux/WSL.
  `better-sqlite3` sin ORM fue añadido para SQLite. El paquete nativo deberá
  compilarse y validarse de nuevo en Windows nativo antes de distribuir el
  ejecutable Windows.
- La API ya lee resumen/árbol desde snapshots indexados y contenido de archivo
  desde el filesystem bajo demanda, con validación de lectura.

### Historial: inicio de SQLite y scaffolding del backend

- Se incorporó `better-sqlite3` como driver para Node 20 y se creó
  `backend/database.js`, separado del servidor HTTP, con migraciones versionadas,
  activación de foreign keys, timeout de escritura y permisos privados para
  directorio/archivo de DB en Linux.
- La migración `001_initial.sql` implementa workspaces, roots, projects,
  scans, technologies, filesystem entries y preferencias. El API abre la DB al
  iniciar y cierra su conexión en SIGINT/SIGTERM; todavía no persiste el índice
  ni lee endpoints desde SQLite.
- Se añadió `npm run test:backend`; 4 pruebas verifican directorio de datos
  Linux/Windows, migración idempotente, claves/constraints y rollback.
- Node `20.20.0` en este entorno WSL. Se confirmó que `node:sqlite` no está
  disponible aquí; `better-sqlite3` compila y pasa pruebas Linux/WSL. Esto no
  valida un runtime/instalador Windows.
- Objetivo de distribución: un solo producto/repositorio portable; Linux/WSL
  para desarrollo inicial y build Windows futuro para Gumroad. El binario
  comercial deberá empaquetar runtime y addon nativo y probarse en Windows
  nativo. Repositorios bajo WSL desde Windows requerirán validación explícita de
  acceso y watchers; no asumir que `\\wsl$` funciona como un filesystem nativo.
- Dependencias locales raíz quedan ignoradas vía `.gitignore`; lockfile npm
  registra el driver.
- En esa etapa, el siguiente paso era el servicio de seed/escaneo sobre
  `CaseUses/`; ese trabajo se completó después y queda documentado arriba.

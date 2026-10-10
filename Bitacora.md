# Bitácora de Kaktus

**Última actualización:** 2026-10-10
**Propósito:** conservar el contexto funcional y técnico para retomar el trabajo
si se pierde la conversación.

## Qué es Kaktus

Kaktus es el producto y el nombre del repositorio: un entorno local, visual y
tipo IDE para comprender y
navegar proyectos de desarrollo. El código fuente sigue siendo la fuente de
verdad; sus vistas son representaciones navegables de la estructura y el
significado del proyecto. En la etapa actual se trabaja en el frontend y sus
maquetas, no en edición real ni en análisis semántico profundo.

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
  proyecto. En la maqueta actual, el workspace disponible es este entorno local.
- **Origen / raíz:** carpeta seleccionada para explorar. Conectar o seleccionar
  una carpeta/repositorio desde el onboarding es mock por ahora; `CaseUses/` es
  la raíz local real que alimenta la demo.
- **Proyecto:** carpeta de proyecto detectada dentro de la raíz. En el caso
  actual, cada carpeta directa de `CaseUses/` es un proyecto.
- **Identidad:** id estable con que se referencia un workspace, proyecto o
  archivo. Para proyectos y archivos locales debe derivarse de su ruta relativa,
  no de un título inferido o del orden visual.
- **Datos / fuente de verdad:** los archivos reales del filesystem. La API local
  existente obtiene resúmenes; no hay una base de datos persistente del
  producto. Las respuestas de API y el estado de UI no deben describirse como
  una base de datos.
- **Dashboard:** nivel que resume y compara el conjunto de proyectos del
  workspace. Sus diferentes modos muestran los mismos proyectos con distintas
  visualizaciones; cambiar el modo no abre un proyecto.
- **Vista:** una perspectiva o modo de presentación dentro de un mismo contexto.
  Hay vistas del dashboard y, por separado, vistas de detalle del proyecto.
- **Vista de proyecto:** contexto enfocado en un único proyecto. Su vista inicial
  será **IDE clásico**; tendrá un selector propio para otras perspectivas.
- **Ítem:** elemento mostrado dentro de una vista, por ejemplo una tarjeta de
  proyecto en el dashboard o un archivo/carpeta en el explorador IDE. Un ítem no
  es una vista ni constituye por sí mismo una identidad estable.
- **Componente:** pieza de interfaz reutilizable y enfocada, por ejemplo banner
  técnico, selector de vistas, tarjeta de proyecto, árbol de archivos o editor
  de solo lectura.

### Niveles de navegación previstos

1. **Onboarding:** pantalla inicial tipo IDE para elegir una carpeta raíz o
   conectar un repositorio. En esta etapa es una maqueta; un botón **Continuar**
   debe permitir avanzar al workspace de demostración aunque el selector o el
   routing no sean funcionales.
2. **Dashboard del workspace:** resume los proyectos encontrados. Conserva su
   selector de vistas, que cambia solo la presentación del dashboard.
3. **Detalle de proyecto:** al seleccionar un proyecto, abre su contexto
   independiente con selector de vistas. La vista por defecto es **IDE clásico**.
4. **Otras vistas de proyecto:** incluir al menos una segunda opción **En
   construcción** para diseñar y comprobar la navegación entre perspectivas.

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

## Hoja de ruta: próxima sesión de trabajo

Trabajar un objetivo por vez. No saltar directamente a construir el IDE ni añadir
dependencias antes de cerrar el modelo de navegación y la composición visual.

### 1. Alinear el contrato de producto y navegación

- Confirmar la taxonomía anterior y dibujar el flujo
  onboarding → dashboard → proyecto → vista del proyecto → regreso.
- Definir qué estado identifica cada nivel y cómo se representa la vista activa.
- Mantener separados el selector de vistas del dashboard y el del proyecto.
- Acordar el comportamiento visible de **Continuar** y del regreso, incluso si
  no existe un router o una selección de carpeta real.

**Resultado esperado:** mapa de pantallas/estados y reglas de transición antes de
codificar las vistas.

### 2. Definir la arquitectura de componentes frontend

- Revisar y descomponer el `App.tsx` actual en shell/layout, navegación,
  componentes comunes y pantallas; evitar una única vista monolítica.
- Identificar componentes compartidos (banner técnico, navegación/breadcrumbs,
  selector de vistas, estados de carga/error/vacío) y componentes propios de
  dashboard/IDE.
- Definir props y datos mínimos que necesita cada vista, sin inventar un sistema
  genérico prematuramente.

**Resultado esperado:** inventario pequeño de componentes y límites claros entre
estado de navegación, datos del workspace y presentación.

### 3. Maquetar el onboarding

- Diseñar la primera pantalla como canvas principal al cargar.
- Mostrar opciones representativas para carpeta local y repositorio remoto, con
  estilo wireframe de bloques planos en grises grafito.
- Mantener detalles mínimos, jerarquía clara y un banner que indique que la
  selección/conexión es mock.
- Añadir **Continuar** hacia el workspace `CaseUses/`; no fingir que se ha
  conectado un origen que todavía no se seleccionó realmente.

**Resultado esperado:** onboarding entendible y transitable en modo demo, sin
dependencias de servicios remotos.

### 4. Ordenar el dashboard y sus modos

- Conservar la vista de proyectos existente y los resúmenes que ya llegan de la
  API local.
- Diseñar el selector de vistas del dashboard como navegación entre
  representaciones del conjunto de proyectos, no como navegación a detalle.
- Distinguir en la UI las métricas/metadata leídas de `CaseUses/` de los
  controles o visualizaciones aún simulados.
- Hacer que seleccionar/abrir una tarjeta lleve a la vista del proyecto.

**Resultado esperado:** dashboard consistente con el nuevo flujo y con una
indicación inequívoca de qué información es real y qué comportamiento es mock.

### 5. Maquetar el detalle IDE clásico

- Crear el contexto de proyecto con breadcrumb y una forma visible de volver al
  dashboard.
- Componerlo con paneles de árbol/directorio, listado o selección de archivos y
  área de detalle/editor de texto simple.
- Usar información real de las carpetas. El árbol no debe inventar archivos;
  cualquier endpoint necesario para leer el árbol o el contenido debe acordarse
  y mantenerse local/de solo lectura.
- Representar la edición de texto como affordance mock, indicando que los cambios
  no se guardan ni modifican los archivos.
- Mostrar banners horizontales que expliquen la fuente de datos, las decisiones
  de la maqueta y las limitaciones actuales.

**Resultado esperado:** vista IDE navegable en maqueta con estructura real y
edición explícitamente simulada.

### 6. Añadir una segunda vista de proyecto y revisar navegación

- Añadir **En construcción** como segunda vista de proyecto.
- Diseñar estados activos, inactivos y vacíos del selector; hacer evidente el
  cambio de perspectiva y cómo regresar a IDE clásico.
- Verificar que no se confunda con un modo del dashboard.

**Resultado esperado:** sistema de vistas de proyecto extensible sin implementar
todavía otras perspectivas.

### 7. Revisión de coherencia y validación

- Recorrer desde carga inicial hasta dashboard, detalle, cambio de vista y
  regreso; incluir el botón de continuidad mock.
- Comprobar jerarquía, nombres, banners de veracidad, responsive y estados de
  carga/error/vacío.
- Revisar componentes para evitar duplicación y confirmar que cada vista tiene
  un propósito distinto.
- Construir el frontend y corregir problemas introducidos por los cambios.

**Resultado esperado:** cierre explícito de la sesión con una lista de decisiones
resueltas y pendientes para el siguiente objetivo.

## Decisiones técnicas: ahora y después

- El frontend actual usa React 19, TypeScript, Vite y `lucide-react`; conservar
  esta base para las maquetas.
- No evaluar ni incorporar una librería de UI ahora: el lenguaje pedido
  (wireframes planos en grises grafito) se puede resolver con componentes React
  y CSS existentes.
- Ya existe una propuesta de rutas y estados en
  [navegación y pantallas](./docs/product/navegacion-y-pantallas.md). Validarla
  primero con Figma; después decidir si basta History API o si hace falta una
  librería de routing.
- La selección de carpeta y conexión a repositorio son mock. El dashboard sigue
  leyendo `CaseUses/` realmente.
- El árbol IDE debe basarse en datos reales. La lectura de archivos, si aún no
  está expuesta por la API local, se aborda como necesidad de integración
  explícita; nunca simular contenido real ni habilitar escritura accidental.
- El esquema relacional está propuesto en
  [modelo de datos](./docs/data/modelo-de-datos.md). No implementar persistencia
  hasta validar qué datos deben sobrevivir entre sesiones; hoy el filesystem
  sigue siendo la fuente de verdad.

## Documentos de definición del producto

Estos documentos son propuestas para revisión, no especificaciones aprobadas ni
funciones ya implementadas:

- [Arquitectura de información](./docs/product/arquitectura-de-informacion.md)
- [Experiencia UX](./docs/product/experiencia-ux.md)
- [Navegación y pantallas](./docs/product/navegacion-y-pantallas.md)
- [Lógica del producto](./docs/product/logica-del-producto.md)
- [Modelo de datos](./docs/data/modelo-de-datos.md)

Próximo paso de producto: contrastar los flujos y estados con los frames de
Figma, registrar correcciones y aprobar la estructura antes de maquetar las
vistas del frontend.

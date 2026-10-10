# Auditoría semántica de anatomía — CaseUses

## Alcance y criterio

Esta lectura se hizo manualmente sobre el código de los tres ejemplos. Describe
lo que está presente en los archivos revisados; no es resultado de un parser,
un análisis estático automatizado ni una conexión a los datos en ejecución.
Los conteos distinguen funciones con nombre y estructuras de repetición
visibles; los callbacks inline y expresiones de colección se anotan aparte para
no sugerir una precisión falsa.

La traducción visual propone una **skin semántica**: cada nodo, relación, ciclo,
llamada y dato recibe una forma legible e iconografía consistente. No se debe
confundir un hash visual o una etiqueta de dominio con un símbolo que exista
literalmente en el código.

## 01 — Mini Store

### Construcción comprobada

- **Capas:** `frontend/` está hecho con HTML, CSS y JavaScript; `backend/` es un
  servidor Node.js sin framework; `database.js` usa SQLite mediante
  `better-sqlite3`.
- **Unidades principales:** 3 tablas SQL, 2 endpoints (`GET /api/products`,
  `POST /api/orders`), 6 funciones con nombre en `frontend/app.js`, 4
  declaraciones `function` en `backend/server.js` y 2 operaciones transaccionales
  asignadas a constantes en `backend/database.js` (`seed`, `createOrder`).
  Hay además callbacks inline de eventos, streams, lectura de archivos y
  transacciones.
- **Objetos que viajan:** el servidor entrega productos como JSON; el navegador
  transforma filas en tarjetas y un carrito local `{ productId: quantity }`.
  Checkout envía `customerName` e `items[]`; la respuesta devuelve id y total
  del pedido. El carrito se guarda en `localStorage`, pero pedidos y stock viven
  en SQLite.
- **Ciclos/repeticiones visibles:** el seed recorre 4 productos; el frontend
  recorre productos y líneas del carrito, y aplica `map`/`filter`/`reduce` para
  resolver, contar y sumar. Al crear un pedido, el backend recorre los ítems
  para validar producto/stock, actualizar existencias e insertar cada detalle.
- **Reglas relevantes:** precios y cantidades se validan; el stock no puede
  bajar de cero; el pedido y sus líneas se escriben en una transacción. `orders`
  guarda `customer_name`, no hay una tabla `customers`. La relación entre
  `products` y `orders` se materializa mediante `order_items`.

### Esquema SQL y lectura de negocio

| Tabla | Campos | Clave / función semántica |
|---|---|---|
| `products` | `id`, `name`, `description`, `price_cents`, `stock`, `emoji` | PK `id`; catálogo e inventario |
| `orders` | `id`, `customer_name`, `total_cents`, `created_at` | PK `id`; cabecera del pedido |
| `order_items` | `order_id`, `product_id`, `product_name`, `quantity`, `unit_price_cents` | PK compuesta (`order_id`, `product_id`); FK a pedido y producto, conserva snapshot del nombre/precio |

Lectura del flujo:

```text
catálogo SQLite → GET /api/products → render del catálogo
carrito local → POST /api/orders → validar → transacción
  ├── orders (cabecera)
  ├── products (descuento de stock)
  └── order_items (detalle asociado a pedido y producto)
respuesta → vaciar carrito → volver a cargar catálogo/stock
```

### Reinterpretación visual sugerida

- **Árbol relacional:** `orders` y `products` convergen en `order_items`; mostrar
  explícitamente ambas FK y la PK compuesta. No dibujar `customers` porque no
  existe.
- **Flujo de compra:** bloques conectados `Catálogo → Carrito local → API →
  Transacción SQLite → confirmación`. Los bordes pueden diferenciar una llamada
  HTTP de una relación FK.
- **Reglas como microindicadores:** `stock >= quantity`, `quantity > 0`,
  `price_cents >= 0`, transacción atómica. Presentarlas como reglas leídas del
  código y asociarlas al nodo/operación correspondiente.
- **Repeticiones:** el ciclo de ítems del pedido se puede representar como una
  secuencia de operaciones por línea; el seed de 4 productos es inicialización,
  no tráfico de usuario.
- **Iconos:** `Database` para SQLite; `Package` para `products`; `ReceiptText`
  para `orders`; `ListTree` o `Rows3` para `order_items`; `KeyRound` para PK;
  `Link2` para FK; `ArrowRightLeft` para ida/vuelta API; `RefreshCw` para
  recarga de catálogo; `ShieldCheck` para validación; `Layers`/`Atom` para la
  transacción.
- **Hashtags:** `#sqlite` `#ecommerce` `#catalogo` `#pedido` `#inventario`
  `#transaccion` `#api-rest` `#carrito-local`.

**Microcanvas inicial acordado:** el cuarto canal verde dibuja los nodos
`products` y `orders` convergiendo en `order_items`; destaca PK/FK y expone
valores iniciales de precio/stock de los cuatro productos del seed. `ENTIDADES`
ofrece tarjetas de campos/llaves. Aunque los datos describen código comprobado,
los metadatos del widget son manuales y representativos: no se consulta la base
SQLite ni se comprueba el estado runtime durante la ejecución.

## 02 — Forma Studio

### Construcción comprobada

- **Capas:** sitio estático con `index.html`, `styles.css` y `app.js`; no hay
  backend, API, tablas ni persistencia de estado de negocio.
- **Vistas:** 4 secciones declaradas en HTML (`inicio`, `estudio`, `proyectos`,
  `contacto`), activadas como paneles. Hay 3 tarjetas de proyecto con contenido
  descriptivo fijo en atributos `data-*`.
- **Unidades de lógica:** 1 función con nombre (`showView`) y callbacks inline
  para navegación, historial y diálogo. `showView` itera paneles y links para
  actualizar visibilidad/estado activo; existen recorridos de links y tarjetas
  para registrar eventos.
- **Qué se mueve:** una intención de navegación cambia panel y hash de URL; el
  botón de proyecto copia nombre/descripción al diálogo nativo. No se envían
  datos a un servicio ni se guarda un modelo de proyecto.
- **Navegación:** `history.pushState` anota hash al cambiar de vista y el evento
  `popstate` sincroniza el panel con el historial; la carga inicial selecciona
  el hash existente o `inicio`.

### Reinterpretación visual sugerida

- Representar la anatomía como **mapa de vistas**: cuatro nodos de pantalla,
  flechas de navegación entre vistas y un nodo modal derivado de una tarjeta de
  proyecto.
- Distinguir `vista` (contenedor HTML) de `acción de navegación` (evento) y de
  `contenido de proyecto` (dato estático); no llamar tablas a los paneles.
- Las transiciones y revelados pertenecen a la capa de presentación; una
  animación no implica un ciclo de datos ni una llamada de red.
- **Iconos:** `PanelsTopLeft` para vista; `Navigation` para navegación;
  `History` para hash/historial; `MousePointerClick` para eventos;
  `PanelTop` o `Dialog` para modal; `Sparkles` para composición visual.
- **Hashtags:** `#sitio-estatico` `#vistas` `#navegacion` `#history-api`
  `#dialog-nativo` `#contenido-fijo` `#sin-backend`.

**Microcanvas de taxonomía:** el segundo canal (jerarquía) organiza el HTML de
Mini Store como raíz → navegación, contenido, bolsa/checkout y pie. Distingue
el catálogo recibido por API del carrito local y el checkout que envía el pedido.
Es un sitemap semántico de esta página, no una tabla de rutas de React. El árbol
puede crecer con desplazamiento dentro de la card; no modifica su ancho ni su
alto exterior.

## 03 — Pulse Board

### Construcción comprobada

- **Capas:** `index.html`, `styles.css`, `app.js`; la aplicación corre en el
  navegador, sin API ni almacenamiento SQL.
- **Modelo de dominio:** 7 tareas de muestra iniciales. Cada tarea contiene
  `id`, `title`, `description`, `status`, `category`, `priority`, `due`,
  `assignees[]` y `mine`. Los estados son `todo`, `doing`, `done`; las categorías
  son diseño, contenido, desarrollo e investigación. El registro inicial se
  clona y las tareas se leen/escriben en `localStorage`.
- **Unidades de lógica:** 10 declaraciones de función con nombre en `app.js`
  (`loadTasks`, `isValidTask`, `persistTasks`, `filteredTasks`, `safeText`,
  `taskMarkup`, `render`, `showToast`, `openTaskForm`, `setBoardView`) más
  callbacks de formularios y eventos.
- **Ciclos/repeticiones visibles:** `render` recorre los 3 estados y filtra las
  tareas visibles por cada columna; otros `filter`/`map`/`find` actualizan
  métricas, avatares, HTML y formularios. `forEach` conecta botones repetidos
  para estados, navegación lateral y proyectos.
- **Qué se mueve:** eventos de búsqueda/filtro afectan la colección visible; el
  formulario crea/actualiza/elimina tareas; la colección se serializa a
  `localStorage`; métricas se recalculan y el tablero se vuelve a renderizar.
  La selección de proyecto y algunas acciones laterales son mensajes simulados,
  no dominios conectados.

### Reinterpretación visual sugerida

- **Árbol de dominio:** `Task` al centro; ramas para estado, prioridad, categoría,
  fecha y responsables. Los arrays de responsables son relaciones múltiples
  dentro del objeto, no una tabla normalizada.
- **Ciclo de actualización:** `Formulario → validación → mutación de tasks →
  localStorage → render → métricas`. Presentar storage como persistencia local
  del navegador, no base de datos compartida.
- **Filtros como operadores:** búsqueda textual, “solo mías” y prioridad alta
  convergen antes de distribuir elementos a las 3 columnas.
- **Iconos:** `CheckSquare` para tarea; `Columns3` para estados; `Filter` y
  `Search` para selección; `HardDrive` o `PanelTop` para localStorage;
  `ChartNoAxesColumn` para métricas; `UsersRound` para responsables.
- **Hashtags:** `#kanban` `#tareas` `#localstorage` `#filtros`
  `#prioridad` `#asignaciones` `#sin-api`.

## Convenciones para los futuros microcanvases

1. Identificar el tipo de evidencia: **código observado**, **dato leído en
   ejecución**, **inferencia** o **mock manual**.
2. Los nodos representan entidades o unidades de código; las aristas nombran
   la relación (FK, llamada, importación, transición o flujo de datos).
3. No inferir una tabla relacional a partir de un objeto local ni un endpoint a
   partir de un botón.
4. Separar estructura estática de actividad runtime. “Existe en el código” no
   significa “se ejecutó”, y una flecha propuesta no prueba una llamada.
5. Mantener icono + nombre + rol semántico + microindicador; incluir hashtags
   como etiquetas de dominio, nunca como fuente única de significado.
6. El canvas debe caber en la card expandida de altura fija (320 px); si un
   grafo crece, permitir su navegación interna sin alterar el ancho exterior del
   bloque ni la mecánica del timeline. La taxonomía organiza contenido por ramas;
   el modelo relacional destaca cardinalidad, llaves y campos relevantes antes
   que intentar reproducir un ERD convencional en miniatura.

## Fuentes revisadas

- `CaseUses/01-mini-store/frontend/app.js`,
  `CaseUses/01-mini-store/frontend/index.html`,
  `CaseUses/01-mini-store/backend/server.js`,
  `CaseUses/01-mini-store/backend/database.js`
- `CaseUses/02-forma-studio/app.js`, `index.html`, `README.md`
- `CaseUses/03-pulse-board/app.js`, `index.html`, `README.md`

# Navegación y pantallas

**Estado:** recorrido demo implementado con History API nativo; el contrato
dinámico de `:workspaceId` y el ID canónico del proyecto aún no están
generalizados.
**Meta:** conservar destinos y límites de contexto al alinear la ruta demo con
entidades persistidas. Ver la
[auditoría de taxonomía y datos](./auditoria-taxonomia-y-datos.md).

## Modelo de navegación

La navegación tiene cuatro niveles de producto:

1. **Onboarding:** elegir un origen o continuar con demo.
2. **Workspace / dashboard:** revisar todos los proyectos de una raíz.
3. **Resumen de proyecto:** consultar la identidad, stack y señales de un
   proyecto seleccionado.
4. **Studio:** trabajar en el espacio IDE de ese proyecto.

El selector del dashboard pertenece al nivel 2. Las vistas del Studio pertenecen
al nivel 4. El resumen del proyecto es el punto de entrada al Studio, no una
vista de dashboard ni un editor.

## Rutas propuestas

Usar rutas legibles y jerárquicas como contrato. La sintaxis final puede cambiar
cuando se elija el router, pero los segmentos deben conservar el alcance:

| Destino | Ruta propuesta | Vista por defecto |
|---|---|---|
| Onboarding | `/` | selección de origen |
| Workspace, dashboard | `/workspaces/:workspaceId/dashboard/:dashboardViewId` | `projects` |
| Resumen de proyecto | `/workspaces/:workspaceId/projects/:projectId` | resumen |
| Studio del proyecto | `/workspaces/:workspaceId/projects/:projectId/studio/:studioViewId` | `ide` |

Ejemplos:

```text
/
/workspaces/demo/dashboard/projects
/workspaces/demo/dashboard/console
/workspaces/demo/projects/01-mini-store
/workspaces/demo/projects/01-mini-store/studio/ide
/workspaces/demo/projects/01-mini-store/studio/multipista
```

IDs de vista estables y distintos por contexto:

- Dashboard: `projects` (bento actual, predeterminado) y `console` (modo
  técnico brutalista, experimental).
- Studio: `ide` (predeterminada) y `multipista`. Una tercera perspectiva se
  muestra bloqueada como **En construcción** hasta definir su alcance.

Los rótulos `En construcción` pueden repetirse; IDs y componentes internos no.
El ID de proyecto será opaco y persistente; no depende del título ni del orden.
La clave natural inicial es origen + ruta relativa. Si cambia la ruta, se trata
como una nueva identidad hasta que exista detección de movimientos segura.

**Alcance implementado hoy:** el router reconoce literalmente
`/workspaces/demo/...`; el API siembra el workspace `workspace-demo`, y el
listado de proyectos expone la ruta relativa como `Project.id`, aunque SQLite
también guarda un UUID. Los ejemplos con `:workspaceId` y `:projectId` son el
contrato objetivo, no una capacidad dinámica ya terminada.

## Estado en URL y estado efímero

La URL es fuente de verdad para el nivel de navegación, el workspace, el
proyecto activo y la vista activa. Esto permite recargar, compartir y usar atrás/
adelante del navegador de forma predecible.

SQLite podrá guardar defaults para futuras entradas, pero no reemplazará una URL
explícita. Estado efímero en el MVP (sin segmento de ruta ni persistencia):

- texto de búsqueda;
- orden, filtros y paneles expandidos;
- proyecto seleccionado en una lista si no se ha abierto su detalle;
- archivo seleccionado en el editor durante la sesión; si se recuerda entre
  sesiones, se guarda como preferencia por proyecto y se valida al restaurar,
  sin incluirlo en la URL en esta etapa.

SQLite guarda defaults de dashboard/Studio y, opcionalmente, la última vista y
archivo usado por proyecto. Una preferencia solo se aplica al entrar por un
destino sin vista explícita; una URL explícita y el historial del navegador
prevalecen. La vista bloqueada no es un valor persistible.

Evitar mantener una copia de estado de ruta en React separada de la URL.

## Reglas de transición

| Acción | Desde | Hacia | Regla |
|---|---|---|---|
| Abrir Kaktus | cualquiera | onboarding | La primera entrada sin workspace activo abre `/` |
| Continuar con demo | onboarding | dashboard demo | Navega al workspace que representa `CaseUses/`; marcar el origen como demo local |
| Cambiar modo de dashboard | dashboard | dashboard | Cambia solo `dashboardViewId`; conserva `workspaceId` |
| Abrir tarjeta en `projects` | dashboard `projects` | resumen del proyecto | Conserva workspace y establece `projectId` |
| Expandir fila en `console` | dashboard `console` | dashboard `console` | Expande/cierra resumen dentro del listado; no cambia ruta ni abre detalle del proyecto |
| Editar proyecto | resumen del proyecto | Studio IDE | Conserva proyecto y abre `/studio/ide`; la vista actual es de solo lectura |
| Volver al resumen | Studio | resumen del proyecto | Conserva proyecto; no salta directamente al dashboard |
| Volver al dashboard | resumen del proyecto | dashboard | Regresa al modo previo si es válido; de otro modo usa `projects` |
| Cambiar vista de Studio | Studio | Studio | Cambia solo `studioViewId`; conserva workspace y proyecto |
| Atrás / adelante | cualquier ruta | ruta del historial | Sincroniza vista y contexto desde URL |
| Ruta o entidad desconocida | cualquiera | estado no encontrado | Mostrar error explícito con camino de retorno, nunca fallback silencioso a otro proyecto |

La acción demo no prueba la selección local ni la conexión remota; solo carga el
workspace que Kaktus ya puede leer.

## Inventario de pantallas

### P0 — Onboarding

- Canvas principal minimalista, bloques planos y grises grafito.
- Alternativas representativas: carpeta local y repositorio remoto.
- La tarjeta de carpeta local abre una pantalla/componente de explorador, no un
  modal. El componente lee la estructura del filesystem local y muestra la ruta
  de la raíz demo con su jerarquía superior.
- El explorador permite navegar carpetas dentro de la raíz fijada; no puede
  cambiar ni seleccionar otra raíz en esta etapa. Archivos aparecen como
  elementos no seleccionables.
- La acción **Aceptar y continuar** es la única que abandona el onboarding y
  carga `CaseUses/` en el dashboard. Volver al onboarding no cambia de ruta.
- La opción de GitHub/remoto queda visible y deshabilitada con su estado
  **No disponible**.
- Banners **DEMO LOCAL** y **ALCANCE ACTUAL** explican fuente y limitaciones.
- Éxito: navegar a `/workspaces/demo/dashboard/projects`; el dashboard lee
  `CaseUses/` mediante la API local existente.
- No incluir carga de URL, OAuth ni selección real de carpeta aún.

### P1 — Dashboard / Proyectos

- Shell de workspace, breadcrumbs, nombre/origen y banner sobre datos locales.
- Selector tipo dial/segmentado en la parte superior derecha, separado de
  filtros; cambia entre `projects` y `console`, y resalta el modo actual.
- Modo inicial `projects`, reutilizando la lista real existente.
- Tarjetas con identidad, descripción, métricas y señales inferidas etiquetadas.
- Acciones de entrada al detalle.
- Modo alternativo `console`, que presenta la misma colección de proyectos con
  layout técnico condensado. Las herramientas de búsqueda/filtro exclusivas de
  ese modo aparecen deshabilitadas con tooltip; monitores de rendimiento se
  marcan como simulados.
- Ambas caras de una tarjeta abren el mismo detalle; el botón de flip queda
  excluido de la acción para alternar caras.
- La tabla/listado de `console` tiene una interacción distinta: pulsar una fila
  la expande inline para mostrar descripción, métricas del filesystem y stack.
  Monitores/salud/conexiones son mock etiquetado. No navega a la vista de detalle
  de `projects`; solo se permite una fila expandida a la vez.

### P2 — Resumen de proyecto

La pantalla de resumen está maquetada dentro del canvas y mantiene el sidebar.
Expone descripción, métricas de archivos y stack local, además de
monitores/conexiones mock. Un CTA ancho al inicio y la zona de identidad del
encabezado regresan al dashboard; **Editar proyecto** es una acción separada
que abre el Studio y no debe activarse al usar el retorno.

### P3 — Studio / IDE

- Ruta propia dentro del proyecto:
  `/workspaces/:workspaceId/projects/:projectId/studio/ide`.
- Conserva un rail lateral de navegación compacto y una barra superior común
  al Studio, con contexto del proyecto y un selector de tres posiciones:
  `IDE`, `Multipista` y una perspectiva bloqueada.
- Explorador recursivo del filesystem real, limitado a la raíz del proyecto.
- Editor de texto de solo lectura: el archivo activo se solicita al seleccionar
  un archivo; no se escribe a disco.
- Terminal visible como maqueta, identificada como `MOCK`, sin ejecutar comandos.
- Chat acepta mensajes para probar el estado de espera y responde
  **“No disponible en esta demo”** después de 10 segundos. No conecta a un
  servicio de IA.
- Banners y estados distinguen lectura local real de terminal/chat simulados.
- No se leen enlaces simbólicos ni archivos mayores a 1 MB; errores de lectura
  se muestran en el panel afectado.

### P4 — Studio / Multipista

- Ruta: `/workspaces/:workspaceId/projects/:projectId/studio/multipista`.
- Mantiene rail y barra superior compartidos con IDE, conservando el proyecto.
- Preview y Directorio quedan colapsados a encabezados con icono y título para
  dar el espacio principal al timeline **Multipista**.
- El timeline muestra seis canales placeholder sobre una grilla de nueve
  columnas, una unidad abstracta de magnitud sin timestamps. Cada canal tiene un
  único bloque sólido con icono centrado y longitud inicial de tres columnas.
- El toggle expande cada canal independientemente, conserva la longitud del
  bloque y revela una card vacía como lienzo de trabajo; varios canales pueden
  permanecer abiertos. La card tiene 320 px de altura fija, independiente del
  ancho, y no lleva rejilla decorativa. El estado se persiste localmente por
  proyecto.
- La barra del timeline permite expandir todas las pistas o comprimirlas todas,
  con acciones deshabilitadas cuando ya se alcanzó ese estado.
- Las barras compactas tienen 48 px de alto, con canales de 76 px apilados.
  Arrastrar el cuerpo mueve horizontalmente con snap a columnas; arrastrar los
  bordes ajusta inicio o fin. Click/tap expande; el teclado ofrece movimiento y
  ajuste accesibles. Posición y longitud también se persisten por proyecto.
- El cuarto canal verde presenta el canvas manual de base de datos de
  `01-mini-store`: diagrama de las tres tablas y dos relaciones FK, alternable a
  lista de tablas/campos. Es una reinterpretación de código revisado, no lectura
  automática ni conexión runtime. La [auditoría de anatomía](./auditoria-anatomia-caseuses.md)
  registra la evidencia y propuesta semántica para los tres case studies.
- El tema sólido es el predeterminado; se ofrece una variante cristalina opcional.
  Canales y lienzos son mock: no representan widgets reales ni reproducen o
  editan medios.
- La tercera posición del selector sigue bloqueada, con tooltip explicativo.
- Los scrollbars del editor y timeline se ocultan visualmente, conservando
  desplazamiento por rueda, touchpad y gesto táctil.

### Estados compartidos

Diseñar carga, error, vacío, no encontrado y contenido parcial como estados de
pantalla/componentes, no como rutas nuevas salvo que haya razón de producto.

## Decisión de router

El prototipo usa History API nativo. Mantenerlo para el siguiente incremento;
reconsiderar una librería solo si aparecen rutas anidadas complejas o
sincronización costosa. SQLite no cambia el contrato de rutas. Ver la
[hoja de ruta SQLite y backend](../roadmap/sqlite-y-backend.md).

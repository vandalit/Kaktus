# Navegación y pantallas

**Estado:** propuesta funcional para prototipar y contrastar con Figma.  
**Meta:** definir destinos, estado navegable y límites entre contextos antes de
escoger o implementar un router.

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
/workspaces/demo/dashboard/overview-preview
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
El ID de proyecto debe derivarse del origen y la ruta relativa, no del título
extraído de su README.

## Estado en URL y estado efímero

La URL debe ser fuente de verdad para el nivel de navegación, el workspace, el
proyecto activo y la vista activa. Esto permite recargar, compartir y usar atrás/
adelante del navegador de forma predecible.

Estado inicialmente efímero (no requiere segmento de ruta):

- texto de búsqueda;
- orden, filtros y paneles expandidos;
- proyecto seleccionado en una lista si no se ha abierto su detalle;
- archivo seleccionado en el editor, salvo decisión posterior de incluirlo en
  query string para enlaces profundos.

Evitar mantener una copia de estado de ruta en React separada de la URL. Si se
adopta router, el estado deberá derivarse de sus parámetros.

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
- Modal inicial informa que solo está disponible el workspace demo local e
  incluye **Conectar repo demo** para continuar al dashboard.
- La tarjeta de carpeta local vuelve a abrir el modal; no abre un selector nativo.
- La opción de GitHub/remoto queda visible y deshabilitada con su estado
  **No disponible**.
- Banners **DEMO LOCAL** y **ALCANCE ACTUAL** explican fuente y limitaciones.
- Éxito: navegar a `/workspaces/demo/dashboard/projects`; el dashboard lee
  `CaseUses/` mediante la API local existente.
- No incluir carga de URL, OAuth ni diálogo real de selección de carpeta aún.

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
monitores/conexiones mock. **Editar proyecto** es la transición explícita al
Studio; no afirma que ya se puedan guardar cambios.

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
- Skeleton modular con preview y directorio en la zona superior, y timeline
  multipista a ancho completo abajo.
- El timeline presenta encabezados de tiempo/columnas, filas y bloques de color
  en layout bento. Está marcado como maqueta; no reproduce ni edita medios.
- La tercera posición del selector sigue bloqueada, con tooltip explicativo.
- Los scrollbars del editor y timeline se ocultan visualmente, conservando
  desplazamiento por rueda, touchpad y gesto táctil.

### Estados compartidos

Diseñar carga, error, vacío, no encontrado y contenido parcial como estados de
pantalla/componentes, no como rutas nuevas salvo que haya razón de producto.

## Decisión de router

**Propuesta:** en la fase de maqueta, modelar estas rutas mediante un catálogo
tipado de rutas/vistas y el History API nativo, sin agregar dependencia. Añadir
una librería de routing solo si el prototipo exige rutas anidadas complejas,
guards, layouts anidados o sincronización que el equipo no quiera mantener.

Esta recomendación es provisional. La ruta, los IDs y la expectativa de
historial sí son decisiones de producto; la librería es una decisión técnica
posterior.

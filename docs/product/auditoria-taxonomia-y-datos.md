# Auditoría de taxonomía, vistas y datos

**Fecha:** 2026-10-10  
**Estado:** auditoría de documentación y código; no cambia comportamiento ni
añade tablas.

## Dictamen

La taxonomía conceptual está bien orientada: separa workspace, raíz/origen,
proyecto, resumen, Studio y vistas; y distingue los datos del filesystem de las
preferencias y las simulaciones. También es correcto que las vistas de producto
sean catálogos versionados en código en vez de registros configurables en
SQLite.

La implementación todavía no cumple plenamente ese contrato. El MVP está
concentrado en una raíz demo; las rutas y algunos rótulos asumen esa raíz; el
UUID de proyecto guardado en SQLite no es el ID que usa la interfaz; y hay una
preferencia de dashboard que se persiste pero no se usa para resolver una ruta
de entrada. Por tanto, la conclusión es: **buena taxonomía de dominio,
navegación coherente para el recorrido demo, pero no todavía un modelo
operativo generalizado ni libre de supuestos hardcodeados**.

“Hardcodeado” no significa automáticamente incorrecto. Hay que separar reglas
estables del producto (catálogos, etiquetas, layout) de datos del usuario, datos
observados del repositorio y valores demo que se presentan como si fueran
estado real.

## Vocabulario que se debe conservar

```text
Workspace
└── Raíz / origen
    └── Proyecto
        ├── Entradas de filesystem (directorios y archivos)
        └── Observaciones de escaneo

Workspace → Dashboard → vista de Dashboard
Proyecto → Resumen del proyecto → Studio → vista de Studio
```

- **Workspace, raíz y proyecto** son entidades/contextos del dominio y deben
  tener identidad propia. La relación Workspace → raíz → proyecto ya existe en
  el esquema.
- **Dashboard** y **Studio** son contextos de navegación; sus vistas son
  representaciones intercambiables de los mismos datos, no entidades.
- **Resumen del proyecto** es una pantalla/destino entre dashboard y Studio,
  no otra vista del dashboard.
- **Archivo/carpeta** es una entrada leída o indexada del filesystem.
- **Preferencia** expresa un default futuro del usuario. No reemplaza la ruta
  activa ni los datos observados.
- **Mock/simulado** identifica una pieza de demostración sin fuente o efecto
  real. No debe persistirse como dato del dominio.

Recomendación terminológica: reservar “vista de proyecto” para las vistas del
Studio y llamar siempre **Resumen del proyecto** a la pantalla intermedia.
“Editar proyecto” también debe tratarse como un rótulo temporal: el Studio
actual solo lee archivos y no los edita.

## Inventario de datos y valores codificados

| Elemento | Implementación actual | ¿Está en tabla / fuente? | Clasificación y tratamiento |
|---|---|---|---|
| Nombre, descripción, conteos y tipo observado/inferido del proyecto | `backend/scanner.js`, guardados por `backend/workspace.js` en `projects` y `project_scans` | Sí; valores derivados del filesystem y reglas | Datos del escaneo. Mantener reconstruibles y etiquetar inferencias. |
| Aparición de un proyecto nuevo | Carpeta directa nueva dentro de `CaseUses/`; se detecta en `POST /api/workspaces/:id/scan` | Sí, después de escaneo completo | No es live: no hay watcher. Una subcarpeta dentro de un proyecto se añade a su árbol, no crea otro proyecto. Archivos sueltos en la raíz no se consideran proyectos. |
| Datos iniciales de proyecto nuevo | Si no hay README usa el nombre de carpeta y una descripción genérica; tipo heurístico según `package.json`; la vista IDE muestra el árbol indexado | Parte del fallback queda persistida dentro del snapshot | Placeholder funcional básico; no es todavía un template de producto con estado “sin analizar”, README ausente o escaneo parcial. Definir esos estados antes de diseñar datos enriquecidos. |
| Descripción por defecto si falta README y tipo derivado de `package.json` | `scanner.js` genera “Proyecto local listo para explorar”; clasifica con/sin `package.json` como aplicación web/experiencia estática | La descripción se guarda en el snapshot; la regla no | No son declaraciones leídas literalmente del proyecto: mostrarlas como resumen generado/clasificación aproximada o separar el campo observado del fallback. |
| Fallback si un proyecto aún no tiene snapshot completo | `project-read-model.js` usa descripción, conteos y tipo genéricos con `LEFT JOIN` | No; se construyen al responder la API | Riesgo de presentar un escaneo fallido como cero/READY. Devolver estado de escaneo explícito y no disfrazar el snapshot ausente como datos completos. |
| Tecnologías/stack | `backend/scanner.js`, `project_technologies` | Sí; inferencia con `source` | Los catálogos de extensiones/dependencias son reglas versionadas en código, no preferencias ni filas configurables del usuario. |
| Directorios y archivos del árbol | `filesystem_entries` | Sí, como snapshot; contenido no | Fuente: filesystem. El contenido se vuelve a leer bajo demanda y no se guarda en SQLite. |
| Ruta real de la raíz demo | `backend/server.js` deriva `CaseUses/` del checkout; `roots.local_path` la conserva | Parcialmente | La ruta existe en SQLite pero el arranque sigue seleccionándola por código. No es todavía una raíz seleccionada por el usuario. |
| Workspace/root demo | IDs `workspace-demo` y `root-caseuses`, etiquetas `CaseUses` en `backend/workspace.js` | Sí, se seed-ean en SQLite | Configuración del fixture/MVP. Debe convertirse en creación por selección de origen antes de admitir múltiples workspaces. |
| Onboarding demo/remoto | `OnboardingScreen.tsx` abre `LocalFolderExplorer.tsx`; `source-browser` lista directorios/archivos bajo la raíz demo | No; lee filesystem real, pero la raíz elegida no es editable ni persistida por usuario | La inspección es real; la ubicación raíz queda fijada a `CaseUses/`. Aceptar entra al dashboard; no hay selección arbitraria ni conexión Git. |
| ID de proyecto expuesto a la UI | `backend/project-read-model.js` devuelve `relative_path` como `Project.id`; la tabla `projects` también tiene UUID | El UUID existe, pero la UI no lo usa como ID canónico | Desajuste de identidad. La ruta relativa debe ser atributo/alias, no sustituir el ID estable prometido. |
| Workspace en URL vs API | URL usa `/workspaces/demo/...`; API/preferences usa `workspace-demo` | No hay una relación de resolución compartida en frontend | Alias demo fijo. Es válido como puente del MVP, no como contrato general. |
| Rutas admitidas | `frontend/src/App.tsx` solo reconoce el literal `demo` y `ide\|multipista`; una ruta desconocida cae en onboarding | Catálogos de vistas en código; workspace/proyecto no resueltos desde dominio | IDs de vistas versionados en código son correctos. La ruta debe resolver entidades y mostrar un estado no encontrado, no degradar a onboarding. |
| Vistas Dashboard y Studio | `DashboardViewSwitcher.tsx`, `StudioViewSwitcher.tsx`, tipos TS y CHECK/validación SQL | Catálogo en código; no hay tabla de vistas | Codificación intencional y apropiada. Mantener una definición coherente por contexto; la opción bloqueada no se persiste. |
| Preferencia de vista Dashboard | `workspace_preferences.preferred_dashboard_view`; PATCH la escribe | Sí, pero `App.tsx` no la carga para decidir la vista inicial | Persistencia actualmente inerte/redundante con rutas que siempre incluyen vista. Definir si será fallback solo en una ruta dashboard sin vista o eliminarla del contrato hasta necesitarla. |
| Preferencia de orden Dashboard | `workspace_preferences.dashboard_sort`; se lee/escribe y se aplica al listado | Sí | Preferencia real. El `source_order` actual significa orden alfabético por ruta que entrega el API, no orden original del filesystem; precisar nombre/semántica. |
| Preferencia Studio por workspace/proyecto | Tablas de preferencias; al abrir el Studio se consultan en orden proyecto → workspace → `ide` | Sí | Funciona como default al entrar desde el resumen; una vista explícita de URL conserva prioridad. |
| Archivo seleccionado | `project_preferences.selected_file_path` | Sí, validado contra el snapshot | Preferencia real por proyecto; al restaurar se valida y se usa un archivo disponible. |
| Inferencias especiales por nombre de demo | `scanner.js` añade Bootstrap CDN para `01-mini-store` y LocalStorage para `03-pulse-board` | No; codificadas en reglas | Hardcode acoplado a nombres de fixtures. Debe migrar a evidencia verificable del repositorio (por ejemplo HTML/dependencias) o desaparecer. |
| Extensiones, dependencias y directorios ignorados | `mimeByExtension`, lista de dependencias y `ignoredDirectories` en `scanner.js` | No | Reglas de lectura/indexación. Pueden quedarse versionadas en código; documentar límites y probarlas. No son datos de usuario. |
| Métricas de salud, monitores y conexiones | `ProjectDetailScreen.tsx` (por ejemplo `92/100`, `03/03`) | No, intencionalmente | Mock; nunca persistir. Mantener marca visible en cada agregado y evitar que un estado de muestra parezca verificación real. |
| CPU/MEM/IO, timestamp y estado `READY` en Consola | `ConsoleDashboardView.tsx` (valores fijos `18/42/07`, `SESIÓN DEMO`, `READY`) | No, intencionalmente | Métricas mock; `READY` no está modelado y puede interpretarse como estado real. Cambiar su presentación antes de usar la Consola como estado operativo. |
| Terminal, comando de ejemplo, conversación y demora de 10 s | `StudioIdeScreen.tsx` | No | Contenido/interacción simulados; no guardar en DB ni confundir con ejecución. |
| Pistas, colores y bloques de Multipista | `TimelinePanel.tsx` y CSS | No | Skeleton visual sin datos de medios. No crear filas de dominio hasta que exista una función real y un contrato de datos. |
| Acento visual de tarjetas | Paleta fija `accents` asignada por índice en `App.tsx` | No | Presentación estática; el color puede cambiar si cambia el orden. No es identidad ni dato del proyecto; persistir solo si Figma/producto requiere un color elegido por usuario. |
| Acentos, etiquetas, iconos, copy, layout y banners | Frontend/estilos | No | Presentación estática, no entidades. Mantener en componentes/tokens o catálogos UI; no trasladar a tablas por el solo hecho de ser literales. |
| Actividad, búsqueda avanzada, filtros/columnas | Controles del frontend actualmente no conectados o deshabilitados | No | Funcionalidades futuras/mock. No representarlas como vistas o datos persistidos hasta definir comportamiento y alcance. |

El inventario cubre valores que afectan identidad, navegación, datos, estado o
comportamiento. No cataloga cada literal de copy/icono/color del CSS: esos
valores son presentación estática, no datos de dominio.

## Coherencia de vistas y navegación

**Aciertos actuales**

- Dashboard Proyectos y Consola son dos perspectivas del mismo listado.
- Resumen del proyecto y Studio son destinos diferentes.
- IDE y Multipista conservan el proyecto y tienen catálogo separado del
  dashboard.
- La URL expresa la pantalla/vista abierta; las preferencias de Studio sirven
  para elegir un destino al entrar desde el resumen.
- Los estados de loading/error del listado y los datos mock se identifican en
  gran parte de la interfaz.

**Desajustes a resolver**

1. El contrato propone `:workspaceId` y `:projectId`, pero la implementación
   acepta solo `demo`; el workspace de API tiene otro ID.
2. La API crea UUID para cada proyecto, pero el listado entrega la ruta relativa
   como `id`. Las rutas, preferencias y componentes frontend usan ese alias.
3. El listado API no recibe workspace/root y selecciona todos los proyectos
   locales presentes. Funciona con una raíz, pero no separaría varios orígenes.
4. `preferred_dashboard_view` se persiste sin participar en la resolución
   inicial; todo dashboard actual lleva una vista explícita en URL.
5. Las pantallas escriben `CaseUses`, `Workspace demo`, `/workspace/CaseUses`
   y rutas demo directamente, en vez de recibir el contexto de workspace/raíz.
6. Una ruta desconocida termina mostrando onboarding aunque la documentación
   exige un estado explícito de no encontrado.
7. Algunas señales (`READY`, “Operativo”, conexión API y salud del proyecto)
   mezclan estado funcional del producto, observación local y mock. Cada una
   debe declarar con claridad qué entidad/operación mide o ser retirada.

## Qué no debe convertirse en tabla

- Catálogos de vistas y sus IDs.
- Rótulos, iconos, estados bloqueados y orden de controles.
- Reglas de escaneo versionadas y heurísticas que se puedan explicar/probar.
- Banners, skeletons, datos de ejemplo y métricas mock.
- Estado efímero como búsqueda, cara de tarjeta, fila expandida o mensaje de
  demostración, salvo que exista después un requisito explícito de restauración.

Persistir solo entidades/observaciones reales o preferencias que cambien una
decisión futura de la persona. Si se añade una preferencia, especificar su
precedencia respecto a ruta, workspace y override de proyecto.

## Hoja de ruta de alineación

1. **Congelar la taxonomía:** conservar Workspace → raíz → proyecto →
   filesystem/escaneos, y Dashboard/Resumen/Studio como niveles de navegación.
   Acordar nombres canónicos e IDs de catálogos separados por contexto.
2. **Cerrar contratos de identidad/ruta:** decidir ID canónico de workspace,
   raíz y proyecto en URL/API; mantener slugs/paths solo como alias de
   compatibilidad. Garantizar que todo endpoint opera dentro del workspace/root
   de la ruta.
3. **Alinear preferencias con rutas:** aplicar `preferred_dashboard_view` solo
   cuando la ruta omita vista; ante ruta explícita gana URL. Alternativamente,
   retirar esa preferencia si todas las entradas seguirán siendo explícitas.
   Aclarar y probar la semántica del orden.
4. **Separar valores demo de lecturas:** obtener nombre/ubicación desde
   workspace/root resueltos; quitar reglas inferidas por nombres específicos y
   reemplazarlas por señales verificables o etiquetarlas como mock.
5. **Auditar veracidad visual:** revisar `READY`, monitores, porcentajes, fechas,
   conexiones y estado operativo; toda cifra debe enlazar a un dato/medición o
   marcarse como mock.
6. **Completar estados de navegación:** ruta desconocida, entidad ausente,
   workspace sin proyectos, error de raíz, escaneo parcial y vista bloqueada.
   Evitar que una ruta inválida parezca onboarding o proyecto vacío.
7. **Validar en pasos:** pruebas de contrato API/URL/preferencias primero;
   luego recorrido manual de demo y navegación atrás/adelante; finalmente
   múltiples raíces/orígenes. No abrir selector real ni watcher antes de cerrar
   las decisiones anteriores.
8. **Proyectos nuevos:** mantener el reescaneo explícito como mecanismo actual;
   definir estados/template para carpeta sin README, vacía o con lectura
   parcial, y decidir si cualquier carpeta directa es proyecto o requiere una
   señal/acción de inclusión.

Esta auditoría es la línea base para las próximas etapas; no implementa las
correcciones funcionales. La hoja de ruta general de producto/backend debe
referenciarla y reflejar el estado real, no marcar como pendiente una
integración que ya está conectada.

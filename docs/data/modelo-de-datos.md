# Modelo de datos y persistencia local

**Estado:** el workspace `CaseUses/`, escaneo inicial/manual, lectura de
listado/árbol desde snapshots SQLite y endpoints de preferencias están
implementados y conectados al dashboard/Studio; el recorrido visual de
reescaneo y persistencia quedó verificado. La alineación de IDs, rutas y
preferencias de dashboard antes de generalizar el producto está registrada en
la [auditoría de taxonomía y datos](../product/auditoria-taxonomia-y-datos.md).

## Decisiones de arquitectura

1. SQLite será la persistencia local de workspaces, orígenes, identidades,
   observaciones del filesystem y preferencias de interfaz.
2. El filesystem continúa siendo la fuente de verdad para archivos, carpetas y
   contenido. La base es un índice reconstruible, no un respaldo del código.
3. Se persisten metadatos y resultados de análisis; nunca el contenido fuente,
   secretos de Git, tokens ni credenciales.
4. Las rutas activas y el contexto navegable viven en la URL. Los catálogos de
   vistas son constantes versionadas en el frontend/backend, no filas editables
   en tablas.
5. El diseño soporta más de un workspace y origen, aunque la primera puesta en
   marcha solo registre el workspace local de demostración `CaseUses/`.
6. Git/remoto, edición de archivos, terminal y chat quedan fuera del backend
   inicial. No se crearán registros que representen conexiones simuladas como
   conexiones reales.

## Límites entre fuente, índice y presentación

| Dato | Fuente de verdad | Persistencia propuesta |
|---|---|---|
| Contenido de un archivo | Archivo real | No persistir; leer bajo demanda |
| Ruta, tipo y tamaño de entrada | Filesystem | Snapshot de escaneo, reconstruible |
| Conteos de archivos/carpetas | Escaneo del filesystem | Snapshot de escaneo |
| Nombre/descr. observada del proyecto | Filesystem y reglas existentes | Metadata del snapshot |
| Stack y tipo detectados | Reglas de inferencia | Snapshot con fuente y versión de detector |
| Identidad de workspace/origen/proyecto | Kaktus + ubicación local | SQLite |
| Preferencia de vista inicial | Usuario local | SQLite |
| Ruta/vista actualmente abierta | URL | No duplicar como estado persistente |
| Búsqueda, flip de tarjeta, fila expandida | Interfaz | Estado efímero; no persistir en MVP |
| Valores de salud, conexiones, terminal/chat mock | Ninguna fuente real | No persistir |

## Modelo relacional

```text
workspaces 1 ─── N roots 1 ─── N projects 1 ─── N project_scans
       │                                      ├── N project_technologies
       │                                      └── N filesystem_entries
       └── 1 workspace_preferences
projects 1 ─── 0..1 project_preferences
```

`project_scans` registra observaciones temporales. Un escaneo fallido no
reemplaza ni invalida el último snapshot completo. No habrá tabla para cada
vista: dashboard y Studio presentan las mismas entidades con distintos
componentes.

## Tablas

Tipos SQL expresados para SQLite. Fechas en UTC ISO-8601; las identidades son
`TEXT` (UUID para proyectos y snapshots; IDs reservados para el workspace y la
raíz demo). Activar `PRAGMA foreign_keys = ON` en cada conexión.

### `workspaces`

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | TEXT | PK |
| `name` | TEXT | NOT NULL |
| `created_at` | TEXT | NOT NULL |
| `updated_at` | TEXT | NOT NULL |

Workspace lógico; no contiene proyectos duplicados por vista.

### `roots`

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | TEXT | PK |
| `workspace_id` | TEXT | FK → `workspaces.id`, NOT NULL |
| `kind` | TEXT | `local` o `git`; CHECK |
| `display_name` | TEXT | NOT NULL |
| `local_path` | TEXT | Nullable, ruta absoluta canonicalizada solo para `local` |
| `remote_url` | TEXT | Nullable, sin credenciales; reservado para soporte Git |
| `created_at` | TEXT | NOT NULL |
| `last_opened_at` | TEXT | Nullable |

CHECK exige `local_path` para `kind=local` y `remote_url` para `kind=git`.
El primer release crea solo el origen local de demo. No acepta una ruta arbitraria
desde el cliente; la selección real de carpetas requiere una decisión y un
contrato de permisos propios.

### `projects`

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | TEXT | PK UUID persistente |
| `root_id` | TEXT | FK → `roots.id`, NOT NULL |
| `relative_path` | TEXT | NOT NULL, separador `/`, única por origen |
| `name` | TEXT | NOT NULL |
| `first_seen_at` | TEXT | NOT NULL |
| `last_seen_at` | TEXT | NOT NULL |
| `is_present` | INTEGER | NOT NULL, booleano CHECK 0/1 |

`id` no se deriva del nombre/título ni del orden. La restricción inicial es
`UNIQUE(root_id, relative_path)`: mover un proyecto se trata como desaparición
y alta de otra identidad hasta que exista detección segura de movimientos.
Solo un escaneo completo permite marcar proyectos ausentes. La API actual usa
el nombre de carpeta en algunas rutas; el adaptador inicial conservará ese
identificador como alias resoluble para no romper enlaces durante la migración
a UUID.

### `project_scans`

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | TEXT | PK UUID |
| `project_id` | TEXT | FK → `projects.id`, NOT NULL |
| `started_at` | TEXT | NOT NULL |
| `completed_at` | TEXT | Nullable |
| `status` | TEXT | `running`, `complete` o `error`; CHECK |
| `files_count` | INTEGER | Nullable hasta finalizar |
| `folders_count` | INTEGER | Nullable hasta finalizar |
| `description` | TEXT | Nullable, resumen observado |
| `detected_type` | TEXT | Nullable, clasificación inferida |
| `detector_version` | TEXT | Nullable, versión de reglas |
| `error_message` | TEXT | Nullable, sanitizado y sin rutas absolutas |

Índice sugerido: `(project_id, completed_at DESC)`. Las vistas usan el snapshot
completo más reciente; si el escaneo más reciente falla, el anterior completo
continúa disponible, con el error del intento mostrado separadamente. Los
errores persistidos son mensajes generales por categoría; no se guardan stacks
ni rutas locales que puedan venir de errores del sistema operativo.

### `project_technologies`

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER | PK |
| `scan_id` | TEXT | FK → `project_scans.id`, NOT NULL |
| `name` | TEXT | NOT NULL |
| `source` | TEXT | NOT NULL; archivo/regla que originó la detección |
| `confidence` | REAL | Nullable, CHECK entre 0 y 1 |

`UNIQUE(scan_id, name, source)`. Son inferencias, no dependencias instaladas
garantizadas.

### `filesystem_entries`

| Columna | Tipo | Reglas |
|---|---|---|
| `id` | INTEGER | PK |
| `scan_id` | TEXT | FK → `project_scans.id`, NOT NULL |
| `parent_path` | TEXT | Nullable para raíz lógica; ruta relativa |
| `relative_path` | TEXT | NOT NULL |
| `name` | TEXT | NOT NULL |
| `kind` | TEXT | `directory` o `file`; CHECK |
| `extension` | TEXT | Nullable |
| `size_bytes` | INTEGER | Nullable |
| `modified_at` | TEXT | Nullable |

`UNIQUE(scan_id, relative_path)` e índice `(scan_id, parent_path)`. Excluir
symlinks, rutas ignoradas y entradas fuera de la raíz. No indexar contenido,
hashes ni secretos en el primer release. La lectura del archivo sigue siendo una
operación bajo demanda y vuelve a validar existencia, tipo, tamaño y ruta.

### `workspace_preferences`

| Columna | Tipo | Reglas |
|---|---|---|
| `workspace_id` | TEXT | PK y FK → `workspaces.id` |
| `preferred_dashboard_view` | TEXT | `projects` o `console`; CHECK |
| `dashboard_sort` | TEXT | Nullable, `source_order` o `reverse_source_order`; CHECK |
| `preferred_studio_view` | TEXT | `ide` o `multipista`; CHECK |
| `updated_at` | TEXT | NOT NULL |

Guarda defaults para próximas entradas, no sustituye el selector activo en la
URL. El orden inicial del producto es el fallback del código.

### `project_preferences`

| Columna | Tipo | Reglas |
|---|---|---|
| `project_id` | TEXT | PK y FK → `projects.id` |
| `preferred_studio_view` | TEXT | Nullable, `ide` o `multipista`; CHECK |
| `selected_file_path` | TEXT | Nullable, relativa y validada contra el árbol |
| `updated_at` | TEXT | NOT NULL |

Preferencias para reabrir un proyecto. Al cargar, validar que vista y archivo
sigan existiendo; si no, usar el default vigente y no fallar la pantalla. No
guardar paneles, mensajes mock ni contenido del editor.

### `schema_migrations`

| Columna | Tipo | Reglas |
|---|---|---|
| `version` | INTEGER | PK |
| `applied_at` | TEXT | NOT NULL |

La creación/evolución del esquema usa migraciones SQL versionadas y transaccionales.
No modificar a mano una base ya creada ni borrar datos para aplicar un cambio.

## Ubicación, acceso y ciclo de vida

- Guardar el archivo DB fuera del repositorio, en el directorio de datos de
  usuario de la plataforma; permitir override con `KAKTUS_DATA_DIR`.
- Crear directorio con permisos privados cuando la plataforma lo permita. No
  incluir base de datos en Git, builds frontend ni logs.
- Una sola instancia local del backend abre la DB. Activar claves foráneas y
  timeout de espera de escritura; las actualizaciones de snapshot se hacen en
  transacción.
- La primera inicialización registra workspace/origen demo y genera un primer
  escaneo completo. El usuario puede pedir reescaneo; no se hace crawling
  recursivo en cada petición de lista. El API local ofrece
  `POST /api/workspaces/:id/scan` para actualizar el índice explícitamente.
- El onboarding consulta `GET /api/workspaces/:id/source-browser?path=...` para
  explorar directorios/archivos reales dentro de la raíz registrada. El
  endpoint no devuelve la ruta absoluta del host, omite symlinks y valida que
  la navegación permanezca dentro de la raíz. No permite elegir otra raíz.
- Workspace: `GET/PATCH /api/workspaces/:id/preferences`.
- Proyecto: `GET/PATCH /api/projects/:id/preferences`.
- Solo se aceptan valores de los catálogos
  definidos abajo; rutas de archivo deben corresponder a un archivo del último
  snapshot completo.
- Ante error de escaneo, conservar el snapshot correcto más reciente y devolver
  el estado de error claramente. No marcar proyectos ausentes con un escaneo
  incompleto.
- Las operaciones SQLite solo guardan configuración y metadatos. Leer/escribir
  archivos de proyecto no forma parte de este backend inicial; las rutas de
  lectura actuales siguen siendo de solo lectura.

## Catálogos y preferencias: contrato por vista

| Contexto | ID en código/ruta | Preferencia persistida | Estado efímero |
|---|---|---|---|
| Dashboard | `projects`, `console` | Modo por defecto y orden disponible | Búsqueda, filtros aún no definidos, fila expandida |
| Resumen de proyecto | Ruta del proyecto | Ninguna vista adicional | Scroll/retorno |
| Studio | `ide`, `multipista` | Default del workspace y override por proyecto | Ruta activa, paneles abiertos |
| Editor IDE | Ruta relativa del archivo | Último archivo seleccionado opcional por proyecto | Contenido abierto en memoria |
| Onboarding | Demo/local/remoto | No persistir conexión mock | Navegación de carpetas dentro de la raíz fijada |

La tercera opción bloqueada no se guarda como preferencia válida. Validar cada
ID contra el catálogo al escribir y al leer.

## Alcance del primer release de persistencia

Incluye esquema y migraciones, registro del workspace demo, escaneo inicial y
manual, snapshot de proyecto/árbol/tecnologías, endpoints de consulta y
actualización de preferencias reales. Mantiene filesystem como origen de
contenido.

No incluye selector de carpeta real, conexión GitHub, cuentas/perfiles,
sincronización remota, edición de archivos, historial de chat, telemetría ni
métricas simuladas. No requiere tablas configurables de vistas.

## Decisiones técnicas y plataforma

1. **Runtime SQLite — decidido:** desarrollo actual en Node 20.20 bajo WSL;
   el driver `better-sqlite3` sin ORM está instalado y probado en Linux/WSL.
   `node:sqlite` no está disponible en ese runtime. La distribución Windows
   requiere compilar y probar el addon nativo en Windows nativo; WSL no cuenta
   como esa validación.
2. **Directorios de datos — MVP:** Linux usa `XDG_DATA_HOME` o
   `~/.local/share/kaktus`; Windows usará `LOCALAPPDATA/Kaktus`. `KAKTUS_DATA_DIR`
   permite pruebas y configuración explícita en ambos. La selección del
   directorio de repositorios no se restringe al directorio de DB.
3. **Retención de escaneos:** mantener snapshots previos en MVP para preservar
   el último correcto; definir más adelante política de limpieza/cantidad.
4. **Preferencias de proyecto:** la preferencia de archivo activo se persiste y
   se restaura en el IDE; continúa siendo nullable y se valida contra el último
   snapshot completo.

Los demás límites para el siguiente incremento están fijados en la
[hoja de ruta SQLite y backend](../roadmap/sqlite-y-backend.md).

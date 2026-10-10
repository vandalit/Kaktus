# Propuesta de modelo de datos

**Estado:** modelo lógico propuesto; no hay base de datos de Kaktus implementada.
  
El filesystem local continúa siendo la fuente de verdad. Este modelo describe
qué metadata tendría sentido persistir para recordar workspaces y acelerar
lecturas, sin guardar una copia del código fuente.

## Recomendación de persistencia

Evaluar SQLite cuando el producto requiera recordar workspaces, historial de
escaneos o preferencias entre sesiones. No añadir la base durante el maquetado.
La primera versión de navegación puede operar con respuestas de la API y estado
de URL.

Reglas:

- No persistir contenido de archivos como parte del índice.
- No persistir tokens/credenciales de proveedores en estas tablas.
- La base es un índice/caché local descartable y reconstruible; filesystem es
  autoridad sobre archivos y rutas.
- Los resultados inferidos registran método/confianza o se etiquetan claramente.
- Todas las rutas son relativas al origen dentro del índice; el path absoluto se
  limita al registro del origen local.

## Diagrama lógico

```text
workspaces 1 ─── N roots 1 ─── N projects 1 ─── N scans
                                             ├── N project_technologies
                                             └── N filesystem_entries (por scan)
workspaces 1 ─── 1 workspace_preferences
```

`dashboard_views` y `project_views` son catálogos de producto mantenidos en
código, no filas configurables en la base. El estado de ruta también vive en la
URL, no en una tabla.

## Tablas propuestas

### `workspaces`

Representa un contexto de trabajo visible.

| Columna | Tipo lógico | Reglas |
|---|---|---|
| `id` | TEXT/UUID | PK |
| `name` | TEXT | NOT NULL |
| `created_at` | TEXT/ISO-8601 | NOT NULL |
| `updated_at` | TEXT/ISO-8601 | NOT NULL |

### `roots`

Origen asociado al workspace. `kind` distingue carpeta local de repositorio.

| Columna | Tipo lógico | Reglas |
|---|---|---|
| `id` | TEXT/UUID | PK |
| `workspace_id` | TEXT/UUID | FK → `workspaces.id`, NOT NULL |
| `kind` | TEXT | `local` o `git` |
| `display_name` | TEXT | NOT NULL |
| `local_path` | TEXT | Nullable; solo origen local |
| `remote_url` | TEXT | Nullable; URL sin credenciales embebidas |
| `created_at` | TEXT/ISO-8601 | NOT NULL |
| `last_opened_at` | TEXT/ISO-8601 | Nullable |

Restricción: `kind=local` requiere `local_path`; `kind=git` requiere `remote_url`.
Para el prototipo, `CaseUses/` es una configuración demo y no requiere que la
selección mock se escriba en esta tabla.

### `projects`

Identidad navegable por origen. Su `relative_path` se normaliza con `/` y es
única dentro del origen.

| Columna | Tipo lógico | Reglas |
|---|---|---|
| `id` | TEXT/UUID o clave estable | PK |
| `root_id` | TEXT/UUID | FK → `roots.id`, NOT NULL |
| `relative_path` | TEXT | NOT NULL |
| `name` | TEXT | NOT NULL |
| `description` | TEXT | Nullable; resumen observado |
| `detected_type` | TEXT | Nullable; clasificador inferido |
| `first_seen_at` | TEXT/ISO-8601 | NOT NULL |
| `last_seen_at` | TEXT/ISO-8601 | NOT NULL |
| `is_present` | INTEGER/BOOLEAN | NOT NULL, default true |

Restricción única: (`root_id`, `relative_path`). `id` no debe depender de
posición, título del README ni orden de listado.

### `project_scans`

Registro de intentos de analizar un proyecto para estados y métricas auditables.

| Columna | Tipo lógico | Reglas |
|---|---|---|
| `id` | TEXT/UUID | PK |
| `project_id` | TEXT/UUID | FK → `projects.id`, NOT NULL |
| `started_at` | TEXT/ISO-8601 | NOT NULL |
| `completed_at` | TEXT/ISO-8601 | Nullable |
| `status` | TEXT | `running`, `complete` o `error` |
| `files_count` | INTEGER | Nullable hasta completar |
| `folders_count` | INTEGER | Nullable hasta completar |
| `error_message` | TEXT | Nullable; no almacenar secretos |

### `project_technologies`

Heurísticas detectadas en un escaneo, separadas para poder etiquetarlas como
inferencias.

| Columna | Tipo lógico | Reglas |
|---|---|---|
| `id` | INTEGER | PK |
| `scan_id` | TEXT/UUID | FK → `project_scans.id`, NOT NULL |
| `name` | TEXT | NOT NULL |
| `source` | TEXT | Señal: extensión, manifiesto o regla |
| `confidence` | REAL | Nullable, rango 0–1 |

Restricción única sugerida: (`scan_id`, `name`, `source`).

### `filesystem_entries`

Índice de árbol de un escaneo. No contiene bytes ni contenido de archivo.

| Columna | Tipo lógico | Reglas |
|---|---|---|
| `id` | INTEGER | PK |
| `scan_id` | TEXT/UUID | FK → `project_scans.id`, NOT NULL |
| `parent_id` | INTEGER | FK → `filesystem_entries.id`, Nullable para raíz |
| `relative_path` | TEXT | NOT NULL |
| `name` | TEXT | NOT NULL |
| `kind` | TEXT | `directory` o `file` |
| `extension` | TEXT | Nullable |
| `size_bytes` | INTEGER | Nullable |
| `modified_at` | TEXT/ISO-8601 | Nullable |

Restricción única: (`scan_id`, `relative_path`). No indexar enlaces simbólicos
ni seguir rutas que salgan del origen. La lectura de archivo se realiza bajo
demanda mediante API local y con validación de ruta, no desde contenido
persistido en esta tabla.

### `workspace_preferences` (opcional)

Preferencias locales duraderas, no estado de navegación esencial.

| Columna | Tipo lógico | Reglas |
|---|---|---|
| `workspace_id` | TEXT/UUID | PK y FK → `workspaces.id` |
| `preferred_dashboard_view` | TEXT | Nullable; ID de catálogo conocido |
| `preferred_project_view` | TEXT | Nullable; ID de catálogo conocido |
| `updated_at` | TEXT/ISO-8601 | NOT NULL |

Para el MVP, las preferencias podrían no existir: la URL conserva la vista
activa y los defaults permanecen en el código.

## Cardinalidades y claves

- Un workspace tiene uno o más orígenes.
- Un origen contiene cero o más proyectos detectados.
- Un proyecto tiene muchos escaneos en el tiempo.
- Un escaneo tiene cero o más tecnologías y entradas de filesystem.
- Cada entidad tiene identidad estable; las tablas de escaneo describen una
  observación temporal, no otra identidad de proyecto.
- Al desaparecer una carpeta, marcar `is_present=false` tras un escaneo completo
  satisfactorio; no borrar el proyecto ante un escaneo fallido.

## Elementos que no son tablas

- Contenido fuente: permanece en el filesystem.
- Estado de navegación (workspace, proyecto, vista): URL.
- Búsqueda, filtros y paneles abiertos: estado de UI; persistencia futura opcional.
- Catálogo de vistas: constantes/versionado de aplicación.
- Datos mock del onboarding: no persistir como una selección real.
- Credenciales de Git: fuera del modelo; resolver de forma segura solo cuando se
  diseñe conexión real.

## Decisiones para revisar antes de implementar persistencia

1. ¿Kaktus debe recordar varios workspaces entre sesiones o basta con un
   workspace activo?
2. ¿Hace falta historial de escaneos o solo reemplazar el último índice?
3. ¿Se necesita indexar todos los archivos o leer el árbol bajo demanda?
4. ¿Debe persistirse la vista preferida o solo representarse en la URL? Si se
   persiste, ¿la preferencia del Studio es global al workspace o por proyecto?
5. ¿Qué datos se consideran privados y cómo se elimina un origen de forma
   completa?
6. ¿Cómo se conserva la identidad de un proyecto al renombrar/mover su carpeta,
   eliminarla y volver a crearla en la misma ruta, o reemplazar el origen?

Hasta responderlas, conservar el esquema como propuesta y no crear migraciones
ni archivos de base de datos.

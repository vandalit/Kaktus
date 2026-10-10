# Lógica del producto

**Estado:** reglas funcionales y persistencia local implementadas para el
recorrido demo; la generalización de rutas, identidades y múltiples raíces
queda pendiente. Ver la
[auditoría de taxonomía y datos](./auditoria-taxonomia-y-datos.md).

## Reglas centrales

1. El filesystem local es la fuente de verdad de proyectos, carpetas y archivos.
2. Un workspace puede agrupar uno o más orígenes; cada origen contiene cero o
   más proyectos. El workspace demo empieza con una raíz.
3. Proyecto significa carpeta detectada, no tarjeta ni modo de presentación.
4. Las vistas representan una misma entidad en contextos diferentes y no
   duplican el proyecto.
5. Los datos del dashboard se obtienen mediante lectura local. Los conteos y
   resumen son hechos observados; clasificación/stack son inferencias.
6. La selección de origen y el repositorio remoto son mock hasta conectarlos de
   forma real.
7. La edición mostrada en el IDE es simulada y no modifica archivos.
8. Un fallo al leer datos se muestra como fallo; nunca se sustituye
   silenciosamente por contenido demo.

## Flujo de datos

```text
Filesystem (CaseUses/)
    ↓ escaneo local, solo lectura
Backend local ↔ SQLite (identidades, snapshots, preferencias)
    ↓ summaries/tree desde el snapshot
Dashboard
    ↓ identidad estable de proyecto
Resumen del proyecto
    ↓ abrir Studio
Backend local (árbol indexado; archivo leído desde filesystem bajo demanda)
Studio / IDE (solo lectura)
```

El onboarding es una puerta de entrada visual, no una capa de datos: en esta
fase **Continuar con workspace demo** selecciona explícitamente el workspace
preconfigurado. Las opciones de abrir carpeta y conectar repositorio informan
que aún no realizan esas acciones.

## Identidades y relaciones

- Workspace: identidad local persistente en SQLite.
- Origen: un directorio local o una URL de repositorio; credenciales no se
  guardan en texto plano ni forman parte del prototipo.
- Proyecto: UUID persistente asociado al origen y ruta relativa normalizada;
  mover de ruta cuenta inicialmente como una identidad nueva.
- Entrada de filesystem: ruta relativa dentro de un proyecto.
- Vista: ID de catálogo estable, determinado por su contexto y no por su nombre
  visible.
- Selección de archivo: referencia a una entrada dentro del proyecto activo.

No usar nombres de carpeta como única identidad si pueden colisionar en raíces
distintas. No usar el índice de una tarjeta como identidad.

## Comportamiento por área

### Entrada

1. Abrir `/` si no hay un workspace demo/activo en la URL.
2. Abrir la opción de carpeta y leer la estructura local real en el explorador
   de onboarding. La raíz está fijada a `CaseUses/`; explorar subdirectorios no
   cambia el origen elegido.
3. Confirmar **Aceptar y continuar** para navegar al dashboard `projects`.
4. Si carga falla, mantener el contexto del workspace y mostrar error/reintento.

### Dashboard

1. Solicitar resúmenes del workspace al backend local; el backend sirve el
   último snapshot completo de SQLite.
2. Renderizar loading hasta respuesta; luego contenido, vacío o error.
3. Calcular métricas agregadas solo con proyectos de la respuesta actual.
4. Aplicar vista y orden por defecto desde preferencias persistidas; la URL
   expresa el modo activo. Búsqueda, filtros temporales y fila expandida son
   estado de presentación no persistente.
5. Abrir un proyecto al solicitar explícitamente su detalle.
6. Cambiar la vista del dashboard sin cambiar el conjunto de proyectos.
7. Actualizar el índice solo por una acción explícita; un fallo conserva y
   etiqueta el último snapshot correcto.

### Proyecto

1. Resolver el proyecto por ID dentro del workspace actual.
2. Si no existe o no pertenece al workspace, renderizar no encontrado con retorno.
3. Abrir primero el resumen del proyecto en `/workspaces/:workspaceId/projects/:projectId`.
4. Entrar al Studio explícitamente desde **Editar proyecto**. La primera vista
   del Studio es `/studio/ide`.
5. Aplicar preferencia por defecto de Studio del workspace, con override
   opcional por proyecto; una vista explícita en URL prevalece y puede actualizar
   el default futuro.
6. El selector superior cambia entre `ide` y `multipista`; una tercera vista
   permanece bloqueada y no puede guardarse como preferencia.
7. Leer el árbol del snapshot y solicitar contenido solo para el archivo
   seleccionado, siempre dentro de la raíz permitida.
8. No recorrer enlaces simbólicos ni permitir traversal fuera de la raíz.
9. Mostrar error si la lectura real falla; no presentar placeholder como fuente.
10. Regresar del Studio al resumen del mismo proyecto sin saltar el nivel.

### Edición

En esta fase el editor presenta el contenido real en modo solo lectura. Ninguna
acción de UI debe escribir a disco, crear archivos o guardar estado como si la
edición hubiera ocurrido. La terminal es mock y no ejecuta comandos. El chat
acepta un mensaje para probar la espera de 10 segundos y devuelve un aviso de
indisponibilidad; no se conecta a un asistente.

## Componentes y límites

- **App shell:** contexto general y áreas persistentes.
- **Router / route catalog:** resuelve URL y transiciones.
- **Workspace data layer:** carga y valida respuestas locales.
- **Dashboard views:** presentan colección, reciben datos/acciones.
- **Resumen de proyecto:** identifica el contexto antes de entrar al Studio.
- **Studio views:** presentan el workspace del proyecto sin asumir
  persistencia/ejecución de cambios.
- **Studio navigation:** barra compartida del Studio con contexto y selector de
  vistas; el rail lateral del workspace se compacta.
- **Multitrack panels:** Preview y Directorio se reducen a encabezados; el panel
  Multipista concentra seis canales mock en una grilla abstracta de nueve columnas,
  sin timestamps. Cada canal tiene un bloque sólido de longitud inicial de tres
  columnas; cada bloque se expande independientemente, conserva su ancho y revela
  una card de altura fija de 320 px. El cuarto canal contiene un microcanvas
  manual del modelo de datos de `01-mini-store` (tres tablas, relaciones y
  visualización alternativa de campos); no parsea el proyecto ni lee SQLite
  durante la ejecución. Los canales restantes conservan un placeholder. El tema
  sólido es inicial y el cristal opcional; la longitud se ajusta horizontalmente
  y la posición se mueve por columnas mediante handlers separados; ambas se
  persisten localmente por proyecto. No hay edición de medios.
- **Banner de estado/fuente:** hace explícito el nivel de realidad.
- **Componentes de dominio:** tarjeta de proyecto, nodo, item de archivo,
  explorador, editor, terminal y chat.

El estado de navegación no debe residir en el componente de tarjeta o vista. Las
vistas reciben identidad/datos y emiten intención (abrir proyecto, cambiar modo,
volver) al nivel de navegación.

## Decisiones de producto y pendientes

### Contrato acordado

- Entrada inicial por onboarding y salida a `CaseUses/` mediante CTA demo.
- Dashboard y Studio tienen ámbitos de vistas independientes; el resumen del
  proyecto es una pantalla intermedia, no un modo del dashboard.
- El botón **Editar proyecto** abre la primera vista del Studio: IDE.
- Studio agrega `multipista` como segunda vista; una tercera vista queda
  bloqueada hasta acordar su propósito.
- Árbol y contenido del archivo seleccionado se leen de forma local y limitada;
  el editor permanece en solo lectura.
- SQLite persiste workspaces/orígenes/proyectos, snapshots observados y
  preferencias de vista; el filesystem sigue siendo autoridad de contenido.
- Las preferencias proporcionan defaults de dashboard/Studio y no sustituyen
  el estado actual representado por URL.
- Terminal mock sin ejecución y chat de prueba con respuesta no disponible tras
  10 segundos; ninguna acción altera archivos.

### Pendientes antes de generalizar el MVP

- Alinear el UUID persistido del proyecto con el ID canónico de API/ruta; tratar
  el nombre/ruta como alias o atributo, no como identidad.
- Resolver `workspaceId` y `rootId` desde el contexto de navegación y limitar
  listado/escaneo a ese origen.
- Decidir si la preferencia de dashboard es un fallback de una ruta sin vista o
  si se elimina mientras todas las rutas incluyan un `dashboardViewId`.
- Retirar inferencias acopladas a nombres de carpetas y definir cómo exponer el
  estado del último escaneo.
- Antes de una distribución Windows, validar allí el driver nativo,
  almacenamiento local y empaquetado; las pruebas WSL no bastan.
- Definir política de retención de snapshots antiguos antes de que el uso real
  aumente el volumen de la base.

El orden y criterios de trabajo están en la
[hoja de ruta SQLite y backend](../roadmap/sqlite-y-backend.md).

## Criterios de coherencia

- Una vista no cambia la identidad del elemento representado.
- No se repite un mismo concepto bajo nombres incompatibles entre pantallas.
- Navegación atrás/adelante reproduce exactamente el contexto expresado por URL.
- Toda tarjeta accionable indica su destino.
- Toda métrica se puede rastrear a un dato o cálculo explicado.
- Mock e inferencia permanecen distinguibles incluso en error y responsive.

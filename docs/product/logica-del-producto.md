# Lógica del producto

**Estado:** propuesta funcional para validar antes del maquetado estructural.

## Reglas centrales

1. El filesystem local es la fuente de verdad de proyectos, carpetas y archivos.
2. Un workspace contiene un origen; un origen puede contener varios proyectos.
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
    ↓ lectura local, solo lectura
API local
    ↓ resúmenes de proyectos
Dashboard
    ↓ identidad estable de proyecto
API local (futuro: árbol y lectura acotada de archivo)
    ↓ estructura/contenido real
IDE clásico
```

El onboarding es una puerta de entrada visual, no una capa de datos: en esta
fase **Continuar con workspace demo** selecciona explícitamente el workspace
preconfigurado. Las opciones de abrir carpeta y conectar repositorio informan
que aún no realizan esas acciones.

## Identidades y relaciones

- Workspace: identidad local persistente cuando se decida guardar workspaces.
- Origen: un directorio local o una URL de repositorio; credenciales no se
  guardan en texto plano ni forman parte del prototipo.
- Proyecto: clave estable derivada del origen + ruta relativa normalizada.
- Entrada de filesystem: ruta relativa dentro de un proyecto.
- Vista: ID de catálogo estable, determinado por su contexto y no por su nombre
  visible.
- Selección de archivo: referencia a una entrada dentro del proyecto activo.

No usar nombres de carpeta como única identidad si pueden colisionar en raíces
distintas. No usar el índice de una tarjeta como identidad.

## Comportamiento por área

### Entrada

1. Abrir `/` si no hay un workspace demo/activo en la URL.
2. Elegir **Continuar con workspace demo**.
3. Navegar al dashboard `projects` y cargar datos reales de `CaseUses/`.
4. Si carga falla, mantener el contexto del workspace y mostrar error/reintento.

### Dashboard

1. Solicitar resumen de proyectos.
2. Renderizar loading hasta respuesta; luego contenido, vacío o error.
3. Calcular métricas agregadas solo con proyectos de la respuesta actual.
4. Mantener búsqueda/orden como estado de presentación.
5. Abrir un proyecto al solicitar explícitamente su detalle.
6. Cambiar la vista del dashboard sin cambiar el conjunto de proyectos.

### Proyecto

1. Resolver el proyecto por ID dentro del workspace actual.
2. Si no existe o no pertenece al workspace, renderizar no encontrado con retorno.
3. Abrir `classic-ide` por defecto.
4. Leer primero árbol/metadata; el contenido solo se solicita para un archivo
   seleccionado y dentro de la raíz permitida.
5. No recorrer enlaces simbólicos ni permitir traversal fuera de la raíz.
6. Mostrar error si la lectura real falla; no presentar placeholder como fuente.
7. Permitir cambiar entre `classic-ide` y `topology-preview` sin perder el
   proyecto.

### Edición

En esta fase el editor representa una intención de producto, no una capacidad.
Los controles deben estar deshabilitados o identificar **Simulado**. Ninguna
acción de UI debe escribir a disco, crear archivos o guardar estado como si la
edición hubiera ocurrido.

## Componentes y límites

- **App shell:** contexto general y áreas persistentes.
- **Router / route catalog:** resuelve URL y transiciones.
- **Workspace data layer:** carga y valida respuestas locales.
- **Dashboard views:** presentan colección, reciben datos/acciones.
- **Project views:** presentan un proyecto y su selección.
- **Banner de estado/fuente:** hace explícito el nivel de realidad.
- **Componentes de dominio:** tarjeta de proyecto, nodo, item de archivo,
  editor/preview.

El estado de navegación no debe residir en el componente de tarjeta o vista. Las
vistas reciben identidad/datos y emiten intención (abrir proyecto, cambiar modo,
volver) al nivel de navegación.

## Decisiones propuestas y pendientes

### Propuestas para aprobar

- Entrada inicial por onboarding y salida a `CaseUses/` mediante CTA demo.
- Dos ámbitos separados de vistas: dashboard y proyecto.
- IDE clásico como vista inicial de proyecto.
- Una vista secundaria de proyecto y un modo secundario del dashboard como
  placeholders rotulados.
- Datos reales en el dashboard y, cuando se integre, árbol/archivo del IDE.
- UI de lectura primero; edición real fuera del alcance.

### Pendientes para validar con Figma

- Nombre visible de cada vista secundaria.
- Si el IDE distribuye árbol, listado y editor en dos o tres paneles.
- Qué banners son globales y cuáles contextuales.
- Qué controles se muestran en la maqueta pero aparecen deshabilitados.
- Si la selección de archivo debe formar parte de la URL.

## Criterios de coherencia

- Una vista no cambia la identidad del elemento representado.
- No se repite un mismo concepto bajo nombres incompatibles entre pantallas.
- Navegación atrás/adelante reproduce exactamente el contexto expresado por URL.
- Toda tarjeta accionable indica su destino.
- Toda métrica se puede rastrear a un dato o cálculo explicado.
- Mock e inferencia permanecen distinguibles incluso en error y responsive.

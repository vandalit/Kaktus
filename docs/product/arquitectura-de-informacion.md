# Arquitectura de información

**Estado:** propuesta para validar con Figma  
**Alcance:** estructura conceptual del producto; no representa funciones ya
implementadas.

## Propósito del producto

Kaktus organiza información real de proyectos locales y ofrece distintas
perspectivas para entenderlos. La interfaz no reemplaza los archivos: los
presenta, resume y relaciona. Toda afirmación derivada por heurísticas debe
identificarse como inferencia.

## Entidades y vocabulario

| Término | Definición | Ejemplo |
|---|---|---|
| Workspace | Contexto de trabajo que agrupa una raíz y sus proyectos | Workspace de demostración |
| Origen / raíz | Ubicación local o remota que contiene proyectos | `CaseUses/` |
| Proyecto | Unidad navegable identificada dentro de un origen | `01-mini-store/` |
| Archivo o carpeta | Elemento del filesystem perteneciente a un proyecto | `frontend/src/App.tsx` |
| Identidad | Referencia estable a una entidad, independiente de su título o posición | ID derivado de raíz + ruta relativa |
| Dashboard | Contexto de resumen y comparación de los proyectos del workspace | Panel de proyectos |
| Vista | Representación de un contexto, no una entidad diferente | Tarjetas, IDE clásico |
| Ítem | Representación seleccionable de una entidad en una vista | Tarjeta de proyecto, nodo del árbol |
| Componente | Elemento de UI reutilizable y limitado a una responsabilidad | Banner de datos, selector de vistas |
| Análisis | Observaciones calculadas a partir de los archivos | Stack inferido, conteos |

No existe actualmente una base de datos persistente de Kaktus. El filesystem es
la fuente de verdad; la API local lee resúmenes bajo `CaseUses/`. El modelo de
datos futuro se especifica en [modelo-de-datos.md](../data/modelo-de-datos.md).

## Jerarquía principal

```text
Kaktus
└── Workspace
    └── Origen / raíz
        └── Proyectos
            ├── Dashboard del workspace
            │   ├── Vista: Proyectos
            │   └── Vista: En construcción
            └── Proyecto enfocado
                ├── Vista: IDE clásico
                └── Vista: En construcción
```

Las dos opciones llamadas **En construcción** pertenecen a contextos distintos.
En Figma y en la implementación deberán tener nombres internos diferenciados,
por ejemplo `dashboard.overview-preview` y `project.topology-preview`, aunque
su rótulo visible pueda ser igual.

## Jerarquía de información por contexto

### Onboarding

1. Bienvenida y explicación breve del propósito.
2. Opción para abrir una carpeta local.
3. Opción para conectar un repositorio.
4. Indicador de estado mock y límites actuales.
5. Acción **Continuar con workspace demo** para entrar a `CaseUses/`.

No se debe representar una carpeta o repositorio como conectado hasta que exista
una selección real. La acción de demo es una ruta explícita alternativa.

### Dashboard del workspace

1. Identidad del workspace y origen actual.
2. Métricas agregadas con fuente y fecha/estado de lectura cuando existan.
3. Selector de vistas del dashboard.
4. Controles de búsqueda, orden y filtros como estado de la vista.
5. Colección de proyectos, cada uno con resumen, contadores y señales técnicas.
6. Estados de carga, error, vacío y resultado sin coincidencias.

### Vista de proyecto

1. Breadcrumbs: workspace → proyecto.
2. Identidad y resumen del proyecto.
3. Selector de vistas de proyecto.
4. Vista IDE clásico: árbol/directorio, listado de elementos del directorio y
   detalle del archivo seleccionado.
5. Indicadores de fuente, estado de análisis e interacción simulada.

## Hechos, inferencias y simulaciones

Cada dato o acción debe caer en una de estas categorías:

- **Real:** leído del filesystem por la API local, como rutas, nombres y
  conteos.
- **Inferido:** calculado a partir de señales, como stack o tipo de proyecto.
  Debe nombrarse como detección aproximada y no como hecho garantizado.
- **Mock:** control o dato de demostración no conectado a una operación real,
  como selección de carpeta o conexión remota.
- **Simulado:** interacción que parece editable o ejecutable pero no persiste ni
  altera archivos.

Los banners horizontales deben decir la categoría, el alcance y la fuente, no
solo usar un color o icono como señal.

## Límites de la propuesta

- Las vistas son perspectivas del mismo workspace/proyecto, no copias de datos.
- Un proyecto puede aparecer en múltiples vistas manteniendo su misma identidad.
- La posición de una tarjeta, nombre visible o título inferido nunca es la
  identidad primaria.
- Los contenidos de archivos no se duplican en una base de datos por defecto.
- La arquitectura visual puede evolucionar tras revisar los frames de Figma sin
  cambiar estas distinciones de dominio.

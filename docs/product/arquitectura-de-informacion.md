# Arquitectura de información

**Estado:** jerarquía conceptual implementada en el recorrido demo; la
generalización de identidades, raíces y rutas está pendiente.
**Alcance:** define conceptos y responsabilidades. SQLite y la API local ya
persisten el workspace demo, snapshots y preferencias; consultar la
[auditoría de taxonomía y datos](./auditoria-taxonomia-y-datos.md) para las
diferencias entre el contrato y el código actual.

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
| Identidad | Referencia estable a una entidad, independiente de su título o posición | UUID relacionado con origen + ruta relativa |
| Dashboard | Contexto de resumen y comparación de los proyectos del workspace | Panel de proyectos |
| Vista | Representación de un contexto, no una entidad diferente | Tarjetas, Studio IDE |
| Studio | Espacio de trabajo de un proyecto, separado del dashboard y de su resumen | Studio del proyecto |
| Ítem | Representación seleccionable de una entidad en una vista | Tarjeta de proyecto, nodo del árbol |
| Componente | Elemento de UI reutilizable y limitado a una responsabilidad | Banner de datos, selector de vistas |
| Análisis | Observaciones calculadas a partir de los archivos | Stack inferido, conteos |

SQLite guarda un índice reconstruible de metadata y preferencias del workspace
demo. La API lee contenido de archivos desde el filesystem bajo demanda, que
continúa siendo la fuente de verdad; ver
[modelo-de-datos.md](../data/modelo-de-datos.md) y la
[hoja de ruta backend](../roadmap/sqlite-y-backend.md).

## Jerarquía principal

```text
Kaktus
└── Workspace
    └── Origen / raíz (uno o más)
        └── Proyectos
            ├── Dashboard del workspace
            │   ├── Vista: Proyectos
            │   └── Vista: Consola
            └── Proyecto enfocado
                ├── Resumen de proyecto
                └── Studio
                    ├── Vista: IDE
                    ├── Vista: Multipista
                    └── Vista futura: bloqueada
```

Las perspectivas del dashboard y del Studio pertenecen a contextos distintos.
El dashboard ofrece Proyectos y Consola; el Studio ofrece IDE y Multipista, con
una tercera perspectiva bloqueada. Las opciones futuras pueden compartir el
rótulo **En construcción**, pero sus IDs deben ser propios de cada contexto. El
resumen del proyecto y el Studio son destinos distintos: desde el resumen se
entra al Studio y desde el IDE se regresa al mismo resumen.

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

1. Resumen: breadcrumbs workspace → proyecto, identidad, metadatos y señales
   claramente marcadas como reales, inferidas o mock.
2. Acción **Editar proyecto** que abre el Studio del mismo proyecto.

### Studio del proyecto

1. Breadcrumbs: workspace → proyecto → Studio.
2. Barra superior compartida con selector IDE, Multipista y perspectiva futura
   bloqueada; rail lateral compacto.
3. Explorador con el árbol real del filesystem del proyecto.
4. Editor de texto del archivo activo, solo lectura en esta fase.
5. Terminal y chat diferenciados como simulaciones no conectadas.
6. Indicadores de fuente local, límites de lectura y retorno al resumen.

### Vista multipista del Studio

1. Preview y Directorio quedan colapsados a encabezados con icono y título.
2. El timeline **Multipista** ocupa el área principal y muestra seis canales de
   muestra en una grilla de nueve columnas, unidad abstracta sin timestamps.
3. Cada canal tiene un solo bloque sólido con longitud inicial de tres columnas;
   el acordeón expande uno a la vez únicamente en vertical y conserva esa longitud,
   revelando una card vacía de altura fija e independiente del ancho, sin rejilla
   decorativa interior. El tema sólido es inicial y el cristal es opcional.
4. El ancho y la posición horizontal en la grilla son preferencias locales por
   proyecto, ajustables por separado con handlers de arrastre y flechas del teclado.
5. Canales y lienzos son mock; no representan widgets reales ni ofrecen
   reproducción o edición de medios.

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
- SQLite almacena identidad, snapshots de análisis y preferencias permitidas;
  no es una base de contenido ni cambia la jerarquía de vistas.
- La arquitectura visual puede evolucionar tras revisar los frames de Figma sin
  cambiar estas distinciones de dominio.

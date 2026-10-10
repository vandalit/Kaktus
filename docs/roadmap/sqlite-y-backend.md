# Hoja de ruta: SQLite y backend local

**Estado:** preparación aprobada; aún no se implementan SQLite ni cambios del
backend.  
**Objetivo:** pasar de lecturas filesystem directas a un índice local
reconstruible con preferencias persistentes, sin alterar el flujo visual ni
guardar contenido fuente.

## Principios de implementación

- Completar una etapa y sus pruebas antes de abrir la siguiente.
- Conservar el filesystem como autoridad sobre contenido y presencia actual.
- DB local, fuera del repositorio, de un solo usuario y sin servicios remotos.
- No crear tablas para vistas, mockups, estados de URL ni valores simulados.
- Los errores se expresan: un fallo de escaneo nunca se parece a un resultado
  correcto vacío.
- Mantener compatibilidad de los endpoints que usa el frontend hasta migrar sus
  consumidores.
- Cambios de archivos y DB separados: esta etapa no habilita escritura de código
  desde el IDE.

## Etapas

### 0. Cerrar contrato técnico corto

- Confirmar el runtime de soporte y driver: en el entorno actual Node 20.20,
  por lo que se recomienda `better-sqlite3` sin ORM; no usar `node:sqlite` sin
  subir el mínimo de Node.
- Definir directorio de datos por plataforma y override `KAKTUS_DATA_DIR`.
- Confirmar que la primera versión arranca con un workspace/origen demo y que
  la base puede representar otros workspaces/orígenes sin habilitar su
  selección real.

**Salida:** ADR/decisión breve en el modelo, dependencias y alcance cerrados.
**No empezar código** si la dependencia no puede instalarse/ejecutarse en las
plataformas objetivo.

### 1. Crear infraestructura SQLite y migraciones

- Añadir acceso de DB aislado del servidor HTTP, habilitar foreign keys y
  timeout para escrituras.
- Implementar `schema_migrations` y la migración inicial descrita en
  [modelo-de-datos.md](../data/modelo-de-datos.md).
- Crear/open DB bajo directorio de usuario, respetar override, no ponerla en el
  repo y fallar explícitamente si no puede inicializarse.
- Asegurar que repetir arranque/migraciones sea idempotente; no reiniciar ni
  borrar una DB existente.

**Pruebas:** migración desde DB vacía, repetición, constraints y claves foráneas,
ruta temporal aislada, fallo de apertura/migración.

### 2. Añadir repositorios y escaneo transaccional

- Separar acceso SQL de reglas filesystem: repositorio para workspaces,
  proyectos y preferencias; servicio de escaneo reutiliza y extrae las reglas
  actuales de `server.js`.
- Inicializar workspace y raíz demo al primer arranque.
- Crear snapshot con conteos, clasificación, tecnologías y metadatos de árbol;
  excluir directorios ignorados, symlinks y contenido de archivos.
- Confirmar un snapshot completo en transacción; guardar fallos como intentos
  fallidos conservando el último snapshot correcto.
- Marcar proyectos ausentes únicamente después de terminar un escaneo completo.
- Hacer el escaneo inicial al bootstrap si no existe snapshot completo;
  posteriores escaneos serán explícitos, nunca un recorrido completo por cada
  GET del dashboard.

**Pruebas:** snapshot reproducible, fallo a mitad de recorrido, preservación de
último snapshot exitoso, raíz ausente/inaccesible, ruta ignorada y symlink.

### 3. Exponer API local de lectura y preferencias

- Mantener `GET /api/health`, `GET /api/projects`,
  `GET /api/projects/:id/tree` y `GET /api/projects/:id/file?path=...` durante
  la transición.
- Hacer que listado y árbol lean metadata/index de SQLite; lectura de archivo
  sigue consultando el filesystem real y revalida path, symlink, tipo y límite
  de tamaño.
- Añadir endpoint explícito de reescaneo para el workspace demo, por ejemplo
  `POST /api/workspaces/:id/scan`; validar el ID y responder estado/resultado,
  no contenido ficticio.
- Añadir `GET/PATCH /api/workspaces/:id/preferences` y
  `GET/PATCH /api/projects/:id/preferences`; aceptar solo IDs de vista/orden
  permitidos, validando propiedad y rutas relativas del archivo.
- Respuestas de error con status y mensajes consistentes; no exponer paths
  absolutos ni stack traces al cliente. El log local debe evitar secretos.
- Vincular `GET /api/health` al estado del proceso/DB sin revelar ubicación
  sensible.

**Pruebas:** contrato HTTP, input inválido, entidades desconocidas, preferencias
válidas/invalidas, DB inaccesible, lectura de archivo que cambió luego del
escaneo y traversal/symlink.

### 4. Conectar el frontend sin cambiar la jerarquía

- Sustituir progresivamente carga del listado/tree por el contrato persistido;
  conservar Proyectos/Consola como dos vistas del mismo conjunto.
- Resolver la diferencia entre los IDs/rutas actuales basados en nombre de
  carpeta (`01-mini-store`) y el UUID persistido: durante la transición, aceptar
  los identificadores actuales como alias resolubles por origen/ruta; generar
  enlaces nuevos con el ID estable y no romper bookmarks silenciosamente.
- Cargar preferencias como defaults iniciales; los cambios explícitos del
  usuario actualizan la URL y la preferencia. URL vigente gana ante conflicto.
- Al reabrir un proyecto, usar preferencia validada de vista/archivo; si ya no
  es válida, usar IDE y limpiar/ignorar selección obsoleta sin ocultar error de
  filesystem.
- Presentar estado de escaneo y acción de actualizar; distinguir último índice
  correcto de un fallo de actualización.
- Mantener mock de onboarding/Git, salud, chat, terminal y Multipista; no guardar
  sus datos.

**Pruebas:** navegación existente, URL directa/atrás-adelante, preferencias,
reapertura de proyecto, archivo desaparecido, carga/error/vacío y responsive.

### 5. Revisión, documentación y salida

- Validar desde DB nueva y DB ya migrada hasta dashboard, resumen y Studio.
- Revisar que la DB no incluya contenido fuente, paths absolutos en API,
  credenciales o resultados mock.
- Verificar logs/errores, migraciones, build frontend y pruebas del backend.
- Actualizar este plan con lo completado, límites reales y siguientes decisiones.

## Criterios de terminado del MVP backend

- Un arranque nuevo crea/migra SQLite y muestra workspace demo sin pasos
  manuales de DB.
- Un escaneo exitoso persiste entidades/snapshot; uno fallido no borra el último
  correcto ni marca proyectos ausentes.
- Dashboard y Studio obtienen el mismo proyecto/identidad del índice.
- Las preferencias permitidas sobreviven reinicios, pero no reemplazan la URL.
- Archivo abierto se lee del disco de forma segura y nunca se escribe.
- Las rutas de API siguen escuchando solo en `127.0.0.1`.
- Migraciones y pruebas pueden ejecutarse con directorios temporales sin tocar
  `CaseUses/` ni la DB real del usuario.

## Fuera de alcance

Selección real de carpetas, GitHub/clonado, autenticación, múltiples usuarios,
sincronización nube, escritura/edición, terminal ejecutable, asistente, FTS,
telemetría, métricas reales de salud y personalización de catálogos de vistas.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Índice queda viejo respecto al disco | Reescaneo explícito y lectura de archivo siempre contra disco |
| Escaneo parcial parece proyecto vacío | Solo snapshots completos reemplazan el vigente |
| Migración daña metadata existente | SQL versionado, transacción, pruebas sobre DB previa; nunca reset |
| SQLite nativo no instala en plataforma | Resolver runtime/driver en etapa 0 y probar instalación por OS |
| Preferencias divergen de rutas existentes | Catálogo validado; URL prevalece durante la navegación actual |
| Se expone una ruta local sensible | No devolver ruta absoluta ni incluirla en errores públicos |

## Siguiente sesión de trabajo

Comenzar únicamente por la etapa 0 y la migración inicial. No modificar todavía
el layout, el modelo visual ni abrir soporte de orígenes remotos. La aprobación
de la migración debe preceder a endpoints nuevos y a la conexión del frontend.

# Hoja de ruta: SQLite y backend local

**Estado:** API local y recorrido frontend demo conectados y validados en
Linux/WSL. Antes de soportar workspaces/raíces arbitrarias, hay que cerrar la
alineación de identidad, rutas y preferencias descrita en la
[auditoría de taxonomía y datos](../product/auditoria-taxonomia-y-datos.md).
**Objetivo:** mantener el filesystem como autoridad y evolucionar el MVP en
etapas sin adelantar selección arbitraria ni escritura de archivos.

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

### 0. Contrato técnico inicial (MVP Linux/WSL)

- Desarrollo actual: Node 20.20 bajo WSL; primer MVP local para Linux/WSL.
- Driver elegido para esta fase: `better-sqlite3` sin ORM. `node:sqlite` no se
  usa porque no está disponible en el runtime actual.
- DB fuera del repositorio: `XDG_DATA_HOME/kaktus` o
  `~/.local/share/kaktus`; `KAKTUS_DATA_DIR` permite aislamiento de
  tests/configuración.
- La primera ejecución registra únicamente `CaseUses/`; el modelo admite
  varios orígenes, pero el backend todavía no permite seleccionar una ruta
  arbitraria.

**Completada:** runtime, driver y alcance MVP fijados. Las pruebas en WSL no
equivalen a validar un instalador Windows.

### 1. Crear infraestructura SQLite y migraciones — completada

- Acceso SQLite separado en `backend/database.js`; foreign keys y timeout de
  escritura activados.
- Migración `001_initial.sql` y tabla `schema_migrations` versionadas.
- DB fuera del repositorio en XDG data dir; override `KAKTUS_DATA_DIR`.
- El backend abre la base e informa error de inicialización; al cerrar HTTP se
  cierra la conexión SQLite.
- Cobertura de resolución de data dir Linux/Windows, migración repetida,
  constraints y rollback de una migración fallida.

**Verificación:** `npm run test:backend` (7 pruebas) y `node --check` pasan en
Linux/WSL.

### 2. Añadir workspace demo y escaneo transaccional — completada

- Separar el recorrido filesystem (`backend/scanner.js`) de la inicialización y
  persistencia transaccional (`backend/workspace.js`); conservar las reglas de
  análisis que ya usaba `server.js`.
- Inicializar workspace y raíz demo al primer arranque.
- Crear snapshot con conteos, clasificación, tecnologías y metadatos de árbol;
  excluir directorios ignorados, symlinks y contenido de archivos.
- Confirmar un snapshot completo en transacción; guardar fallos como intentos
  fallidos conservando el último snapshot correcto.
- Marcar proyectos ausentes únicamente después de terminar un escaneo completo.
- Hacer el escaneo inicial al bootstrap si no existe snapshot completo;
  posteriores escaneos serán explícitos, nunca un recorrido completo por cada
  GET del dashboard.
- Mantener `CaseUses/` como única raíz MVP; abstraer la raíz para habilitar
  directorios de repositorios elegidos después, sin abrir selector arbitrario
  en esta etapa.
- El primer arranque crea el workspace y la raíz demo, y guarda un snapshot si
  todavía no existe uno completo. En esta etapa, los GET existentes aún leían
  el filesystem directamente; la migración a lecturas SQLite queda registrada
  en la etapa 3.

**Pruebas:** snapshot reproducible, fallo a mitad de recorrido, preservación de
último snapshot exitoso, raíz ausente/inaccesible, ruta ignorada y symlink.

**Verificación:** 7 pruebas backend pasan; startup crea SQLite, inicializa el
workspace demo y conserva los endpoints de lectura actuales.

### 3. Exponer API local de lectura y preferencias — completada

- Mantener `GET /api/health`, `GET /api/projects`,
  `GET /api/projects/:id/tree` y `GET /api/projects/:id/file?path=...` durante
  la transición.
- **Completado:** listado y árbol consultan el último snapshot exitoso de
  SQLite; aceptan el ID persistente y el alias de ruta actual, y mantienen la
  forma de respuesta que usa el frontend. La lectura del contenido de archivo
  sigue consultando el filesystem real y revalida ruta, symlink, tipo y tamaño.
- **Completado:** `POST /api/workspaces/:id/scan` ejecuta reescaneo explícito
  del origen local del workspace, devuelve conteo y estado completo/parcial,
  y responde error explícito si la raíz no está disponible. No expone rutas
  absolutas.
- **Completado:** `GET/PATCH /api/workspaces/:id/preferences` y
  `GET/PATCH /api/projects/:id/preferences`; catálogos cerrados, PATCH parcial,
  validación de `selected_file_path` contra el último snapshot y defaults
  `null` para preferencias aún no guardadas.
- Respuestas de error con status y mensajes consistentes; no exponer paths
  absolutos ni stack traces al cliente. El log local debe evitar secretos.
- **Completado:** `GET /api/health` verifica una consulta SQLite y devuelve
  `503` genérico si la base no está disponible.

**Verificación:** pruebas HTTP de catálogo permitido/denegado, persistencia,
proyecto/workspace desconocido, tipo de contenido, ruta relativa, health y
endpoints de lectura/reescaneo. Lectura de rutas presentes solo en el índice
confirma que se vuelve a validar contra el filesystem y no entrega contenido
inexistente. La simulación de DB inaccesible para health queda como cobertura
adicional, no como bloqueo del contrato.

### 4. Conectar el frontend sin cambiar la jerarquía — completada para el demo

- **Completado:** cliente API tipado y centralizado para health, proyectos,
  árbol, archivo, reescaneo y preferencias.
- **Completado:** dashboard persiste modo/orden, restaura el orden, y ofrece
  reescaneo manual con estados de éxito/parcial/error; el listado se vuelve a
  cargar desde SQLite al terminar.
- **Completado:** Studio restaura la vista preferida (proyecto sobre workspace),
  persiste cambios de vista y selección de archivo. Los valores URL siguen
  prevaleciendo cuando la ruta especifica explícitamente la vista.
- **Completado:** UI distingue conexión API/SQLite y comunica fallos de
  preferencias sin bloquear la exploración/edición de solo lectura.
- **Completado:** el onboarding abre un explorador conectado a lectura real de
  directorios dentro de la raíz fijada. La navegación no cambia el origen y
  aceptar es la única acción que continúa al dashboard.
- **Verificado manualmente:** API/SQLite disponibles, reescaneo y recarga de
  proyectos, cambio de vistas, persistencia del orden, preferencia Studio y
  archivo seleccionado tras recargar.
- **Verificación automatizada:** build frontend, 7 pruebas backend y
  `git diff --check` pasan.

La conexión está completa para el workspace demo, no para un contrato de
workspaces arbitrarios. No se ha migrado la interfaz al UUID de proyecto:
SQLite lo guarda, pero el listado entrega la ruta relativa como `id`. La
preferencia `preferred_dashboard_view` se guarda, pero no participa en la
resolución inicial mientras las URLs siempre declaren la vista. Estos son
pendientes de alineación de producto/contrato, no de conectar endpoints.

### 4a. Alinear taxonomía, identidad y rutas — siguiente etapa

1. Confirmar IDs canónicos de Workspace, Root y Project en rutas y contratos
   API; mantener `demo` y rutas relativas solo como alias de compatibilidad.
2. Resolver listado y escaneo dentro del workspace/root indicado, no como
   colección global de raíces locales.
3. Definir semántica de defaults: URL explícita prevalece; usar
   `preferred_dashboard_view` solo en una entrada sin vista o eliminarla.
4. Corregir/retirar heurísticas ligadas al nombre de fixtures y distinguir
   señales locales reales, inferidas y mock, especialmente `READY` y salud.
5. Añadir pruebas de URL desconocida, workspace/proyecto no encontrado, raíz
   sin acceso, alias antiguo y conflicto URL/preferencia.

No comenzar selección arbitraria de carpetas ni watcher hasta completar y
verificar esta etapa.

### 5. Actualización live de repositorios locales — futura

- Después de estabilizar escaneo/API y la raíz configurable, añadir watcher
  filesystem cuando la plataforma lo soporte y reconciliación periódica o manual
  como recuperación de eventos perdidos.
- Debounce/batch de eventos; ignorar carpetas de build/dependencias y aplicar
  límites para repositorios grandes. No recalcular en cada request.
- Exponer estado/última fecha de escaneo y actualizar snapshot de forma atómica;
  evento incompleto nunca marca archivos ausentes.
- En WSL probar filesystem Linux y montajes Windows bajo `/mnt/<drive>`; anotar
  diferencias de rendimiento/eventos por filesystem. No asumir que un proceso
  Windows puede leer de forma fiable `\\wsl$`.

**Criterio:** cambios locales aparecen con latencia acotada, sin pérdida de
consistencia si watcher no entrega eventos. Medir latencia objetivo después del
primer prototipo, no asumir un número antes de perfilar.

### 6. Revisión, documentación y salida

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

## Camino futuro a distribución Windows

La meta comercial Windows es compatible con un MVP abierto Linux/WSL: es el
mismo producto y backend, no dos paradigmas ni dos implementaciones. Mantener un
solo repositorio y código portable; variar empaquetado, integración de
plataforma y licencia/distribución.

Después de cerrar el MVP local:

1. Probar `better-sqlite3` y el backend en Windows nativo/CI Windows, no inferir
   compatibilidad desde WSL.
2. Resolver y probar directorio de datos Windows con `LOCALAPPDATA/Kaktus`;
   respetar `KAKTUS_DATA_DIR`.
3. Elegir empaquetador para incluir frontend, backend, Node y addon nativo, y
   servir el frontend desde la aplicación de escritorio.
4. Añadir permiso explícito para que el usuario elija una o más raíces locales;
   permitir WSL paths cuando el proceso Windows tenga acceso, sin asumir que
   `\\wsl$` está siempre disponible.
5. Ejecutar build firmado/instalador, pruebas limpias de instalación,
   actualización, desinstalación, backup DB y detección de directorios
   inaccesibles.
6. Documentar licencias, política de actualizaciones y canal de soporte de la
   distribución pagada. El código open source y el build comercial pueden
   compartir repositorio si la licencia elegida lo permite; revisar licencia y
   modelo de negocio antes de cobrar por binarios/soporte.

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Índice queda viejo respecto al disco | Reescaneo explícito y lectura de archivo siempre contra disco |
| Escaneo parcial parece proyecto vacío | Solo snapshots completos reemplazan el vigente |
| Migración daña metadata existente | SQL versionado, transacción, pruebas sobre DB previa; nunca reset |
| SQLite nativo no instala en plataforma | Resolver runtime/driver en etapa 0 y probar instalación por OS |
| Preferencias divergen de rutas existentes | Catálogo validado; URL prevalece durante la navegación actual |
| Se expone una ruta local sensible | No devolver ruta absoluta ni incluirla en errores públicos |

## Siguiente paso inmediato

Completar la etapa 4a tomando la auditoría como checklist y actualizar este
plan al cerrar cada punto. Después decidir el contrato de selección de raíces;
solo entonces abordar actualización live y empaquetado Windows.

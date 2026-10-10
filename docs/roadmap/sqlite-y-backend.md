# Hoja de ruta: SQLite y backend local

**Estado:** infraestructura SQLite y migración inicial implementadas en
Linux/WSL; listado, árbol y preferencias aún no están conectados a la persistencia.
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

**Verificación:** `npm run test:backend` (4 pruebas) y `node --check` pasan en
Linux/WSL.

### 2. Añadir repositorios y escaneo transaccional — siguiente paso

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
- Mantener `CaseUses/` como única raíz MVP; abstraer la raíz para habilitar
  directorios de repositorios elegidos después, sin abrir selector arbitrario
  en esta etapa.

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

### 5. Actualización live de repositorios locales

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

Implementar únicamente la etapa 2: seed demo y servicio de escaneo transaccional
en tests sobre una carpeta temporal; no cambiar todavía endpoints existentes ni
el frontend. Luego verificar snapshots correctos, errores y preservación del
último escaneo válido antes de exponer esos datos por HTTP.

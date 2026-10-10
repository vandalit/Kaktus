# 03 · Pulse Board

Tablero de gestión de proyectos para un equipo de producto, ejecutado en el
navegador. Incluye vista Kanban, búsqueda, filtros, edición de tareas y
persistencia local.

## Run locally

Open `index.html` in a browser, or serve this folder with any static file
server. For example, from this directory run `python3 -m http.server 4173` and
open <http://localhost:4173>.

## Anatomy

- `index.html`: application shell, navigation, board and task dialog.
- `styles.css`: dashboard layout, cards and responsive behavior.
- `app.js`: task model, filters, rendering, validation and local storage.

Use **Restablecer demo** in the user menu to restore the original sample tasks.

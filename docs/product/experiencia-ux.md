# Propuesta de experiencia UX

**Estado:** propuesta para validar con Figma  
**Objetivo:** definir el contrato de experiencia antes de maquetar la estructura
del frontend.

## Principios

1. **Orientación constante:** siempre indicar workspace, proyecto y vista activa.
2. **Continuidad sin engaño:** permitir avanzar con datos demo, pero no afirmar
   que se seleccionó o conectó un origen inexistente.
3. **Veracidad visible:** distinguir datos reales, inferidos, mock y simulados
   mediante banners horizontales legibles.
4. **Reversibilidad:** regresar al dashboard y cambiar de vista sin perder el
   contexto del workspace.
5. **Progresión:** presentar onboarding, resumen y detalle en ese orden; no
   exigir comprender el IDE antes de tener un proyecto abierto.
6. **Complejidad gradual:** mostrar inicialmente la estructura necesaria para
   explorar; reservar análisis avanzado para vistas posteriores.
7. **Consistencia de controles:** un selector de vistas solo cambia la
   perspectiva de su contexto y nunca cambia de nivel de navegación.
8. **Accesibilidad y adaptación:** controles con nombre accesible, foco visible,
   navegación por teclado y soporte para pantallas estrechas y movimiento
   reducido.

## Flujo principal propuesto

```text
Inicio / onboarding
  └── Continuar con workspace demo
      └── Dashboard: Proyectos
          ├── Cambiar vista del dashboard
          └── Abrir proyecto
              ├── IDE clásico
              ├── Vista de proyecto en construcción
              └── Volver al dashboard
```

La apertura directa de la aplicación muestra onboarding. La entrada al
dashboard desde onboarding debe ser una acción deliberada **Continuar con
workspace demo** hasta que haya un selector de origen funcional.

## Contrato de interacción

### Onboarding

- Las tarjetas de carpeta local y repositorio remoto comunican el destino
  previsto, pero muestran estado **Prototipo / no conectado**.
- El botón primario para esta fase es **Continuar con workspace demo**.
- Tras activarlo se carga la raíz real `CaseUses/`; el banner informa que se
  trata de datos locales de demostración.
- En móvil, apilar opciones; mantener la acción primaria disponible sin
  desplazamiento excesivo.

### Dashboard

- Seleccionar un modo del dashboard actualiza la vista, no abre un proyecto.
- Seleccionar una tarjeta o su acción primaria abre el detalle de ese proyecto.
- La búsqueda y el orden afectan solo a la colección visible.
- Si no hay proyectos, explicar cómo añadirlos a la raíz disponible; si hay
  error de lectura, ofrecer reintento y no sustituirlo por datos ficticios.

### IDE clásico

- Seleccionar carpeta actualiza el listado del directorio.
- Seleccionar archivo muestra su ruta y contenido real solo cuando la API
  permita leerlo.
- Si aún no se lee contenido, mostrar un estado vacío explícito; no rellenar el
  editor con texto inventado que parezca fuente real.
- El control de edición puede mostrarse como parte de la maqueta, deshabilitado
  o marcado **Simulado: no guarda cambios**.
- El breadcrumb y una acción visible permiten volver al dashboard.

### Vistas de proyecto

- El selector distingue **IDE clásico** (activo) de **En construcción**.
- Cambiar perspectiva mantiene el proyecto enfocado.
- La pantalla en construcción debe conservar nombre de proyecto y navegación de
  retorno, y explicar qué perspectiva se está prototipando.

## Banners de contexto

Componente compartido, horizontal, con al menos:

- categoría textual: **DATOS LOCALES**, **INFERENCIA**, **MOCK** o
  **SIMULACIÓN**;
- mensaje concreto que indique qué funciona y qué no;
- fuente o límite relevante, como `CaseUses/`, lectura de solo lectura o falta
  de persistencia;
- acción secundaria opcional para más información, sin bloquear el flujo.

Ejemplos de copy inicial:

- **DATOS LOCALES ·** Proyectos y estructura leídos desde `CaseUses/`.
- **MOCK ·** La conexión de repositorios todavía no está habilitada. Continúa
  con el workspace demo.
- **SIMULACIÓN ·** El editor es visual; los cambios no se guardan ni modifican
  archivos.
- **INFERENCIA ·** El stack se estima a partir de archivos y dependencias.

No usar el mismo banner para datos reales y para contenido ficticio. En estados
de error, priorizar el mensaje operativo del error sobre cualquier banner
informativo.

## Estados a diseñar en Figma

- Onboarding: inicial, foco/teclado, CTA demo.
- Dashboard: carga, contenido, error de API, sin proyectos, búsqueda sin
  resultados.
- Detalle: cargando estructura, estructura disponible, sin selección de archivo,
  contenido no legible, error al leer.
- Vistas: activa/inactiva, vista secundaria en construcción.
- Responsive: ancho desktop, tablet y móvil; paneles IDE adaptados sin perder
  acceso al árbol, archivo activo y navegación.

## Criterios de aceptación UX

- La persona distingue dashboard de detalle y los dos selectores de vista.
- Puede identificar qué es real, inferido, mock o simulado sin consultar ayuda.
- Puede recorrer la ruta demo completa aunque selección de carpeta y routing real
  no estén implementados.
- Nunca ve contenido ficticio presentado como un archivo leído.
- Siempre puede regresar del proyecto al dashboard y entender qué proyecto está
  abierto.

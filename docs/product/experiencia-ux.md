# Experiencia UX

**Estado:** contrato UX de las vistas maquetadas; la persistencia se incorporará
sin alterar la jerarquía.

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
              └── Resumen del proyecto
                  ├── Editar proyecto → Studio / IDE
                  │   ├── Explorador y editor de solo lectura
                  │   ├── Terminal mock
                  │   └── Chat mock con respuesta diferida
                  ├── Studio / Multipista
                  │   ├── Preview y directorio
                  │   └── Timeline mock
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
- El modo/orden preferido puede recordarse para la próxima entrada; al cambiar
  vista desde una URL activa, la URL tiene prioridad y la preferencia se actualiza
  para visitas futuras.
- Seleccionar una tarjeta o su acción primaria abre el detalle de ese proyecto.
- La búsqueda y el orden afectan solo a la colección visible.
- Si no hay proyectos, explicar cómo añadirlos a la raíz disponible; si hay
  error de lectura, ofrecer reintento y no sustituirlo por datos ficticios.
- Con SQLite, indicar cuándo se muestra el último snapshot correcto y cuándo el
  escaneo más reciente falló; ofrecer actualización explícita sin vaciar la vista.

### Resumen de proyecto

- El detalle comunica identidad, datos locales e inferencias/mock.
- Un CTA ancho y la identidad del encabezado regresan al dashboard; el botón
  **Editar proyecto** queda aislado como acción independiente.
- **Editar proyecto** abre el Studio del mismo proyecto, no cambia a otra vista
  del dashboard.
- El retorno del Studio vuelve primero al resumen.

### Studio / IDE

- El explorador muestra el árbol local real; seleccionar un archivo carga su
  contenido real en el editor de solo lectura.
- La terminal no ejecuta comandos y el chat no se conecta a un asistente;
  ambos deben identificarse como mock.
- Al enviar un mensaje, el chat muestra estado de espera y devuelve
  **“No disponible en esta demo”** tras 10 segundos.
- El breadcrumb y una acción visible permiten volver al resumen del proyecto.
- Reabrir el Studio puede recuperar la vista/archivo preferido por proyecto;
  validar que el archivo siga presente. Si no, abrir el IDE en estado inicial y
  comunicar el estado real del filesystem sin bloquear el proyecto.
- Dentro del Studio, compactar el sidebar en un rail lateral y mostrar una barra
  superior compartida. El selector de tres posiciones cambia IDE/Multipista y
  conserva una tercera opción bloqueada.

### Studio / Multipista

- Mostrar dos paneles superiores vacíos con icono y título; debajo, un panel
  **Multipista** con retícula, filas y bloques de color como estructura mínima.
- Omitir timestamps, metadatos de pistas, filtros, controles y texto ornamental.
- Todo el contenido es un skeleton mock sin reproducción ni edición de medios.
- Ocultar las barras de scroll del viewport del editor/timeline sin deshabilitar
  el scroll de touchpad o gestos táctiles.

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

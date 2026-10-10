# Convenciones de frontend

**Estado:** convención inicial para construir las pantallas de Kaktus.

## Estructura

- `src/screens/`: vistas de nivel de navegación, nombradas por pantalla.
- `src/components/`: componentes compartidos y de responsabilidad acotada.
- `src/App.tsx`: resolución de vista y composición de nivel superior; no añadir
  lógica de presentación de onboarding aquí.
- `src/styles.css`: estilos por componente y breakpoints responsive.

Crear componentes cuando exista una responsabilidad reutilizable o una pantalla
con ciclo/estado propio. Evitar extraer cada fragmento de JSX en componentes
triviales.

## Tokens de diseño

Definir variables CSS semánticas en `:root` usando el prefijo `--color-` para
color, `--space-` para espaciado, `--radius-` para radios y `--font-` para
familias tipográficas. No nombrar tokens por su valor visual (por ejemplo,
`--purple-500`) ni duplicar hexadecimales en nuevos componentes.

Los colores se nombran por función: `--color-background`, `--color-surface`,
`--color-text-primary`, `--color-accent`, `--color-warning`, etc. Los colores
de acento usados en datos de proyecto pueden ser excepciones temáticas, pero
deben mantener contraste sobre el fondo oscuro.

## Componentes y CSS

- Componentes React en PascalCase (`OnboardingScreen`,
  `StatusBanner`).
- Clases CSS de bloque con elementos y modificadores BEM:
  `.status-banner`, `.status-banner__label`,
  `.status-banner--warning`.
- Los modificadores de componente describen intención o estado, no detalles de
  implementación.
- Usar props tipadas y variantes cerradas cuando el conjunto de opciones sea
  conocido, por ejemplo `tone: "info" | "warning"`.
- Mantener accesibilidad semántica: botones para acciones, enlaces para destinos,
  `dialog` nativo para modal y textos visibles que expliquen estados disabled.

## Tema

El tema inicial es oscuro: canvas grafito, superficies elevadas diferenciadas,
bordes sobrios y contraste alto para texto. El color de advertencia comunica
limitaciones; el acento identifica acciones disponibles. No depender solo del
color para expresar si una función es mock o está deshabilitada: incluir
etiqueta y copy.

## Responsive y movimiento

- Desktop prioriza composición amplia; móvil apila opciones y banners sin perder
  labels ni acciones.
- Respetar `prefers-reduced-motion`.
- Foco visible en todos los controles interactivos.

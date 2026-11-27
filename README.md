# Sintonía — prototipo funcional

Abre `index.html` con un servidor local (por ejemplo `npx serve .` o la extensión Live Server de VS Code).
Si lo abres con doble clic también funciona, pero algunos navegadores bloquean las fuentes con `file://`.

## Estructura
- `index.html` — todas las pantallas (cada una es un `<section class="screen">`).
- `styles.css` — estilos de los controles interactivos.
- `app.js` — navegación, filtros, formularios, chat, slider, columna fija del perfil.
- `assets/` — las pantallas exactas del diseño (exportadas del PDF a 2x).
- `fonts/` — Poppins y Merriweather Sans.

## Rutas
`#/inicio` · `#/filtros` · `#/resultados` · `#/perfil-nathy` · `#/paso-1` … `#/paso-4` · `#/trabajos` · `#/trabajo` · `#/mensajes`

## Cómo está hecho
El diseño se mantiene intacto: cada pantalla es la imagen original del artboard (1920 px) y encima van los
botones, campos y chips reales en las mismas coordenadas. Un control sólo se dibuja cuando su estado cambia
respecto al diseño, así que al cargar todo se ve idéntico al PDF. El artboard se escala al ancho de la ventana.

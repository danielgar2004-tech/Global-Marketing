# Global Marketing — Sitio Web · Guía rápida

## Estructura
- `index.html` — sitio principal (one-page + secciones)
- `auditoria.html` — herramienta de auditoría gratuita (enlazada desde el sitio)
- `assets/css/styles.css` — estilos (animaciones marcadas por número)
- `assets/js/main.js` — lógica (animaciones marcadas por número)
- `assets/img|video|poster` — medios optimizados

## Publicar en Vercel
1. vercel.com → Add New → Project → arrastrar esta carpeta completa
   (o `npx vercel` desde esta carpeta).
2. El sitio queda en `https://<nombre>.vercel.app`. Sin configuración extra.

## Activar tracking (cuando existan IDs)
En `index.html`, dentro de <head>, hay dos marcadores comentados:
- `[META PIXEL — pendiente de ID]` → pegar snippet oficial del Pixel
- `[GA4 — pendiente de propiedad]` → pegar snippet gtag.js

## Conectar el formulario a Google Sheets (Carolina)
1. En Google Sheets (cuenta globalmarketing.garcia@gmail.com) → Extensiones
   → Apps Script → pegar un doPost que haga appendRow con
   nombre / whatsapp / mensaje / fecha → Implementar como Web App
   (acceso: cualquiera) → copiar la URL /exec.
2. En `assets/js/main.js`, línea `var APPS_SCRIPT_URL = '';` → pegar la URL.
Mientras esté vacía, el formulario abre WhatsApp con los datos precargados:
los leads llegan igual, por chat.

## Las 4 animaciones (para integrarlas por partes)
Cada bloque está marcado con banner `ANIMACIÓN N` en:
- CSS → `assets/css/styles.css`
- JS  → `assets/js/main.js`
1. Pulse del botón flotante de WhatsApp (solo CSS: `.wa-float::before` + `@keyframes waPulse`)
2. Reveal con scroll (CSS `.reveal/.revealed` + IntersectionObserver en JS)
3. Fade-in + zoom-out del video de Elena (CSS `.video-shell` + observer con autoplay coordinado)
4. Carrusel de testimonios (CSS `.tcard .current/.leaving` + lógica `goTo()` en JS)
Todas respetan `prefers-reduced-motion: reduce` (bloque final del CSS).

## Editar precios o textos
Todo el contenido está en `index.html`, en secciones marcadas con
banners `════ NOMBRE ════`. El FAQ, planes y testimonios se editan ahí.

/* ═══════════════════════════════════════════════════════════════
   GLOBAL MARKETING · main.js
   Vanilla JS · sin dependencias · compatible iOS Safari
   Las 4 animaciones solicitadas están marcadas con banners
   numerados para integrarlas por partes si se desea.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* Detección global de reduced-motion (se consulta en cada módulo) */
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── CONFIG ──────────────────────────────────────────────────
     APPS_SCRIPT_URL: cuando Carolina tenga el endpoint de Google
     Apps Script (Sheets), pegar aquí la URL /exec. Mientras esté
     vacío, el formulario usa el fallback de WhatsApp (el lead
     llega igual, por chat). */
  var APPS_SCRIPT_URL = '';
  var WA_NUMBER = '51918057349';

  function waLink(msg) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  /* ════════════════════════════════════════════════════════════
     NAV · fondo sólido al hacer scroll + menú móvil
     ════════════════════════════════════════════════════════════ */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');

  function onScrollNav() {
    if (window.scrollY > 30) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  function toggleMenu(force) {
    var open = typeof force === 'boolean' ? force : !mobileMenu.classList.contains('open');
    mobileMenu.classList.toggle('open', open);
    burger.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () { toggleMenu(); });
  mobileMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { toggleMenu(false); });
  });

  /* ════════════════════════════════════════════════════════════
     ANIMACIÓN 2 · REVEAL PROGRESIVO CON SCROLL
     ─ IntersectionObserver, threshold 0.15
     ─ opacity 0→1 + translateY(20px)→0 (definido en CSS)
     ─ Se dispara UNA sola vez por elemento (unobserve)
     ─ data-delay="120" en el HTML escalona tarjetas hermanas
       (se inyecta como variable CSS --rd)
     ════════════════════════════════════════════════════════════ */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !REDUCED) {
    var revealObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = el.getAttribute('data-delay');
          if (delay) el.style.setProperty('--rd', delay + 'ms');
          el.classList.add('revealed');
          revealObs.unobserve(el); /* una sola vez: no repite al re-scrollear */
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    /* Sin soporte o reduced-motion → visible de inmediato */
    revealEls.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ════════════════════════════════════════════════════════════
     CONTADORES DEL HERO (respetan reduced-motion)
     ════════════════════════════════════════════════════════════ */
  function animateCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = (el.getAttribute('data-count').split('.')[1] || '').length;
    var suffix = el.getAttribute('data-suffix') || '';
    if (REDUCED) { el.textContent = target.toFixed(decimals) + suffix; return; }
    var start = null, DUR = 1400;
    function frame(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / DUR, 1);
      var eased = 1 - Math.pow(1 - p, 3); /* easeOutCubic */
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { animateCounter(e.target); cObs.unobserve(e.target); }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { cObs.observe(c); });
  } else {
    counters.forEach(animateCounter);
  }

  /* ════════════════════════════════════════════════════════════
     ANIMACIÓN 3 · FADE-IN + ZOOM-OUT DEL VIDEO DE ELENA
     ─ Mismo patrón IntersectionObserver (threshold .35)
     ─ CSS: .video-shell arranca en scale(1.05)/opacity 0 y
       .video-in lo lleva a scale(1)/opacity 1 en ~700ms ease-out
     ─ Coordinación con autoplay: el play() se lanza ~180ms
       después de iniciar la transición para que el video ya
       esté en movimiento cuando el zoom aterriza (sin salto).
     ─ Al salir del viewport el video se pausa (ahorro batería).
     ─ Autoplay siempre muted + playsinline (requisito iOS).
     ════════════════════════════════════════════════════════════ */
  var videoShell = document.getElementById('videoShell');
  var elenaVideo = document.getElementById('elenaVideo');
  if (videoShell && elenaVideo && 'IntersectionObserver' in window) {
    var vObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          videoShell.classList.add('video-in');
          /* autoplay coordinado con la transición visual */
          setTimeout(function () {
            var p = elenaVideo.play();
            if (p && p.catch) p.catch(function () { /* autoplay bloqueado: el usuario usa controles */ });
          }, REDUCED ? 0 : 180);
        } else {
          if (!elenaVideo.paused) elenaVideo.pause();
        }
      });
    }, { threshold: 0.35 });
    vObs.observe(videoShell);
  }

  /* ════════════════════════════════════════════════════════════
     PANEL TESTIMONIOS · video ⇄ carrusel escrito
     "Ver más testimonios" desvanece el video (y lo pausa) y
     muestra el carrusel; "Volver al video" invierte el flujo.
     ════════════════════════════════════════════════════════════ */
  var testiVideoPanel = document.getElementById('testiVideoPanel');
  var testiCarousel = document.getElementById('testiCarousel');
  var btnMore = document.getElementById('btnMoreTesti');
  var btnBack = document.getElementById('btnBackVideo');

  btnMore.addEventListener('click', function () {
    elenaVideo.pause();
    testiVideoPanel.style.display = 'none';
    testiCarousel.classList.add('active');
    syncCarHeight(false);
  });
  btnBack.addEventListener('click', function () {
    testiCarousel.classList.remove('active');
    testiVideoPanel.style.display = '';
    videoShell.classList.add('video-in');
    var p = elenaVideo.play();
    if (p && p.catch) p.catch(function () {});
  });

  /* ════════════════════════════════════════════════════════════
     ANIMACIÓN 4 · CARRUSEL DE TESTIMONIOS ESCRITOS
     ─ 100% manual: flechas + dots, sin auto-avance
     ─ Tarjetas apiladas en la MISMA celda de grid (grid-area)
       → nunca hay salto de layout ni superposición abrupta
     ─ Saliente: .leaving  → opacity 1→0 + translateX(-30px)
       Entrante: .current  → opacity 0→1 + translateX(30px→0)
       (380ms ease-in-out, definido en CSS)
     ─ El alto del viewport se mide y anima (transition height)
       para adaptarse al contenido de cada tarjeta con fluidez.
     ─ Lock anti-doble-clic durante la transición.
     ════════════════════════════════════════════════════════════ */
  var carViewport = document.getElementById('carViewport');
  var cards = Array.prototype.slice.call(carViewport.querySelectorAll('.tcard'));
  var dotsWrap = document.getElementById('carDots');
  var current = 0;
  var animating = false;

  /* Dots generados según el número de tarjetas */
  cards.forEach(function (_, i) {
    var d = document.createElement('button');
    d.className = 'tcar-dot' + (i === 0 ? ' active' : '');
    d.setAttribute('aria-label', 'Testimonio ' + (i + 1));
    d.addEventListener('click', function () { goTo(i); });
    dotsWrap.appendChild(d);
  });
  var dots = Array.prototype.slice.call(dotsWrap.children);

  function syncCarHeight(animate) {
    var h = cards[current].offsetHeight;
    if (animate === false) {
      var prev = carViewport.style.transition;
      carViewport.style.transition = 'none';
      carViewport.style.height = h + 'px';
      void carViewport.offsetHeight; /* reflow para reactivar transición */
      carViewport.style.transition = prev;
    } else {
      carViewport.style.height = h + 'px';
    }
  }

  function goTo(next) {
    if (animating || next === current || !cards[next]) return;
    animating = true;
    var out = cards[current];
    var incoming = cards[next];

    if (REDUCED) {
      /* Reduced motion: cambio instantáneo, sin slide */
      out.classList.remove('current');
      incoming.classList.add('current');
      current = next;
      updateDots();
      syncCarHeight(false);
      animating = false;
      return;
    }

    out.classList.add('leaving');       /* opacity→0, X→-30px */
    out.classList.remove('current');
    incoming.classList.add('current');  /* desde X:30px → 0 */
    syncCarHeight(true);                /* altura acompaña el cambio */

    setTimeout(function () {
      out.classList.remove('leaving');  /* reset al estado base (X:30px, oculta) */
      current = next;
      updateDots();
      animating = false;
    }, 400); /* ligeramente > 380ms de la transición CSS */
  }

  function updateDots() {
    dots.forEach(function (d, i) { d.classList.toggle('active', i === current); });
  }

  document.getElementById('carPrev').addEventListener('click', function () {
    goTo((current - 1 + cards.length) % cards.length);
  });
  document.getElementById('carNext').addEventListener('click', function () {
    goTo((current + 1) % cards.length);
  });
  window.addEventListener('resize', function () {
    if (testiCarousel.classList.contains('active')) syncCarHeight(false);
  });

  /* ════════════════════════════════════════════════════════════
     TABS (servicios y portafolio) — patrón único reutilizable
     ════════════════════════════════════════════════════════════ */
  function initTabs(tablistId) {
    var list = document.getElementById(tablistId);
    if (!list) return;
    var tabs = list.querySelectorAll('.tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-tab');
        tabs.forEach(function (t) { t.classList.toggle('active', t === tab); });
        document.querySelectorAll('[data-panel-group="' + tablistId + '"]')
          .forEach(function (p) {
            p.classList.toggle('active', p.id === target);
          });
        /* pausa cualquier reel al cambiar de pestaña */
        pauseAllReels();
      });
    });
  }
  initTabs('serviceTabs');
  initTabs('pfTabs');

  /* ════════════════════════════════════════════════════════════
     REELS · click-to-play (preload none → carga bajo demanda)
     Un solo reel activo a la vez para no saturar memoria móvil.
     ════════════════════════════════════════════════════════════ */
  var reels = document.querySelectorAll('.reel');
  function pauseAllReels(except) {
    reels.forEach(function (r) {
      var v = r.querySelector('video');
      if (v !== except && !v.paused) { v.pause(); r.classList.remove('playing'); }
    });
  }
  reels.forEach(function (reel) {
    var video = reel.querySelector('video');
    var overlay = reel.querySelector('.reel-play');
    overlay.addEventListener('click', function () {
      pauseAllReels(video);
      reel.classList.add('playing');
      video.controls = true;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    });
    video.addEventListener('pause', function () {
      if (video.currentTime > 0 && !video.ended) return; /* pausa del usuario: mantener controles */
    });
    video.addEventListener('ended', function () {
      reel.classList.remove('playing');
      video.controls = false;
    });
  });

  /* ════════════════════════════════════════════════════════════
     GALERÍA DE GUSTAVO · filtros + lightbox
     ════════════════════════════════════════════════════════════ */
  var chips = document.querySelectorAll('.chip[data-filter]');
  var galItems = document.querySelectorAll('.gal-item');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      chips.forEach(function (c) { c.classList.toggle('active', c === chip); });
      var f = chip.getAttribute('data-filter');
      galItems.forEach(function (item) {
        var show = f === 'all' || item.getAttribute('data-cat') === f;
        item.classList.toggle('hidden', !show);
      });
    });
  });

  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  function openLightbox(src, alt) {
    lightboxImg.src = src;
    lightboxImg.alt = alt || '';
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    setTimeout(function () { lightboxImg.src = ''; }, 300);
  }
  document.querySelectorAll('.gal-item img, .pf-item img').forEach(function (img) {
    img.parentElement.addEventListener('click', function () {
      openLightbox(img.currentSrc || img.src, img.alt);
    });
  });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.closest('.lightbox-close')) closeLightbox();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });

  /* ════════════════════════════════════════════════════════════
     FAQ · acordeón accesible (max-height animada)
     ════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.faq').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      if (isOpen) {
        a.style.maxHeight = '0px';
        item.classList.remove('open');
      } else {
        a.style.maxHeight = a.scrollHeight + 'px';
        item.classList.add('open');
      }
    });
  });

  /* ════════════════════════════════════════════════════════════
     TOOLTIP del botón flotante (aparece a los 3.5s, se oculta a los 9s)
     ════════════════════════════════════════════════════════════ */
  var waTip = document.getElementById('waTip');
  if (waTip && !REDUCED) {
    setTimeout(function () { waTip.classList.add('show'); }, 3500);
    setTimeout(function () { waTip.classList.remove('show'); }, 9500);
  }

  /* ════════════════════════════════════════════════════════════
     FORMULARIO DE LEADS
     1) Si APPS_SCRIPT_URL está configurada → POST (Google Sheets
        de Carolina) y mensaje de éxito.
     2) Fallback (hoy): abre WhatsApp con los datos precargados;
        el lead llega igual al chat de Carolina.
     Consentimiento (Ley N.º 29733) requerido para enviar.
     ════════════════════════════════════════════════════════════ */
  var form = document.getElementById('leadForm');
  var statusEl = document.getElementById('formStatus');
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var nombre = form.nombre.value.trim();
    var whatsapp = form.whatsapp.value.trim();
    var mensaje = form.mensaje.value.trim();
    var consent = form.consent.checked;

    statusEl.className = 'form-status';
    if (!nombre || !whatsapp) {
      statusEl.textContent = 'Por favor completa tu nombre y tu WhatsApp.';
      statusEl.classList.add('err'); return;
    }
    if (!consent) {
      statusEl.textContent = 'Debes aceptar el tratamiento de datos para enviar.';
      statusEl.classList.add('err'); return;
    }

    if (APPS_SCRIPT_URL) {
      var payload = { nombre: nombre, whatsapp: whatsapp, mensaje: mensaje, fecha: new Date().toISOString() };
      fetch(APPS_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload)
      }).then(function () {
        statusEl.textContent = '✓ ¡Recibido! Te escribiremos muy pronto.';
        statusEl.classList.add('ok');
        form.reset();
      }).catch(function () {
        openWaFallback(nombre, whatsapp, mensaje);
      });
    } else {
      openWaFallback(nombre, whatsapp, mensaje);
    }
  });

  function openWaFallback(nombre, whatsapp, mensaje) {
    var txt = 'Hola, soy ' + nombre + ' (WhatsApp: ' + whatsapp + ').' +
      (mensaje ? ' ' + mensaje : ' Quiero más información sobre sus servicios.');
    statusEl.textContent = '✓ Abriendo WhatsApp para completar tu solicitud…';
    statusEl.classList.add('ok');
    window.open(waLink(txt), '_blank');
  }

  /* ════════════════════════════════════════════════════════════
     AÑO DINÁMICO DEL FOOTER
     ════════════════════════════════════════════════════════════ */
  document.getElementById('year').textContent = new Date().getFullYear();

})();

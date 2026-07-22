/* ═══════════════════════════════════════════════════════════════
   GLOBAL MARKETING · main.js · v2
   Vanilla JS · sin dependencias · compatible iOS Safari
   Novedades v2: lightbox con navegación ← → entre fotos y videos,
   pinch-zoom en móvil (solo sobre la foto, no la página),
   botón "ampliar" en reels y barra de progreso de scroll.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── CONFIG ──────────────────────────────────────────────────
     APPS_SCRIPT_URL: URL /exec del Apps Script (Sheets de Carolina).
     Vacía → fallback WhatsApp (el lead llega igual, por chat). */
  var APPS_SCRIPT_URL = '';
  var WA_NUMBER = '51918057349';
  function waLink(msg) {
    return 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(msg);
  }

  /* ════════════════════════════════════════════════════════════
     BARRA DE PROGRESO DE SCROLL (rAF, sin layout thrashing)
     ════════════════════════════════════════════════════════════ */
  var progressBar = document.getElementById('scrollProgress');
  var ticking = false;
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progressBar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; }
  }, { passive: true });
  updateProgress();

  /* ════════════════════════════════════════════════════════════
     NAV
     ════════════════════════════════════════════════════════════ */
  var nav = document.getElementById('nav');
  var burger = document.getElementById('burger');
  var mobileMenu = document.getElementById('mobileMenu');
  function onScrollNav() {
    nav.classList.toggle('scrolled', window.scrollY > 30);
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
     IntersectionObserver (threshold .15) → .revealed una sola vez.
     data-delay="120" escalona hermanos vía variable CSS --rd.
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
          revealObs.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach(function (el) { revealObs.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('revealed'); });
  }

  /* ════════════════════════════════════════════════════════════
     CONTADORES DEL HERO
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
      var eased = 1 - Math.pow(1 - p, 3);
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
     Observer (threshold .35) → .video-in; autoplay coordinado
     (~180ms tras iniciar la transición). Pausa fuera de viewport.
     ════════════════════════════════════════════════════════════ */
  var videoShell = document.getElementById('videoShell');
  var elenaVideo = document.getElementById('elenaVideo');
  if (videoShell && elenaVideo && 'IntersectionObserver' in window) {
    var vObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          videoShell.classList.add('video-in');
          setTimeout(function () {
            var p = elenaVideo.play();
            if (p && p.catch) p.catch(function () {});
          }, REDUCED ? 0 : 180);
        } else if (!elenaVideo.paused) {
          elenaVideo.pause();
        }
      });
    }, { threshold: 0.35 });
    vObs.observe(videoShell);
  }

  /* ════════════════════════════════════════════════════════════
     PANEL TESTIMONIOS · video ⇄ carrusel
     ════════════════════════════════════════════════════════════ */
  var testiVideoPanel = document.getElementById('testiVideoPanel');
  var testiCarousel = document.getElementById('testiCarousel');
  document.getElementById('btnMoreTesti').addEventListener('click', function () {
    elenaVideo.pause();
    testiVideoPanel.style.display = 'none';
    testiCarousel.classList.add('active');
    syncCarHeight(false);
  });
  document.getElementById('btnBackVideo').addEventListener('click', function () {
    testiCarousel.classList.remove('active');
    testiVideoPanel.style.display = '';
    videoShell.classList.add('video-in');
    var p = elenaVideo.play();
    if (p && p.catch) p.catch(function () {});
  });

  /* ════════════════════════════════════════════════════════════
     ANIMACIÓN 4 · CARRUSEL DE TESTIMONIOS ESCRITOS
     Manual · tarjetas apiladas en la misma grid-area · saliente
     .leaving (X→-30px) · entrante .current (X:30→0) · 380ms ·
     altura animada · lock anti doble clic.
     ════════════════════════════════════════════════════════════ */
  var carViewport = document.getElementById('carViewport');
  var cards = Array.prototype.slice.call(carViewport.querySelectorAll('.tcard'));
  var dotsWrap = document.getElementById('carDots');
  var current = 0, animating = false;

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
      void carViewport.offsetHeight;
      carViewport.style.transition = prev;
    } else {
      carViewport.style.height = h + 'px';
    }
  }
  function goTo(next) {
    if (animating || next === current || !cards[next]) return;
    animating = true;
    var out = cards[current], incoming = cards[next];
    if (REDUCED) {
      out.classList.remove('current');
      incoming.classList.add('current');
      current = next; updateDots(); syncCarHeight(false);
      animating = false; return;
    }
    out.classList.add('leaving');
    out.classList.remove('current');
    incoming.classList.add('current');
    syncCarHeight(true);
    setTimeout(function () {
      out.classList.remove('leaving');
      current = next; updateDots(); animating = false;
    }, 400);
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
     TABS
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
          .forEach(function (p) { p.classList.toggle('active', p.id === target); });
        pauseAllReels();
      });
    });
  }
  initTabs('serviceTabs');
  initTabs('pfTabs');

  /* ════════════════════════════════════════════════════════════
     REELS · click-to-play + botón "ampliar" (lightbox)
     ════════════════════════════════════════════════════════════ */
  var reels = Array.prototype.slice.call(document.querySelectorAll('.reel'));
  function pauseAllReels(except) {
    reels.forEach(function (r) {
      var v = r.querySelector('video');
      if (v !== except && !v.paused) { v.pause(); r.classList.remove('playing'); }
    });
  }
  reels.forEach(function (reel) {
    var video = reel.querySelector('video');
    var overlay = reel.querySelector('.reel-play');
    var expand = reel.querySelector('.reel-expand');
    overlay.addEventListener('click', function () {
      pauseAllReels(video);
      reel.classList.add('playing');
      video.controls = true;
      var p = video.play();
      if (p && p.catch) p.catch(function () {});
    });
    video.addEventListener('ended', function () {
      reel.classList.remove('playing');
      video.controls = false;
    });
    if (expand) {
      expand.addEventListener('click', function (e) {
        e.stopPropagation();
        pauseAllReels();
        openLightboxFrom(reel);
      });
    }
  });

  /* ════════════════════════════════════════════════════════════
     REELS · filtro por cliente + contador (portafolio de Carolina)
     ════════════════════════════════════════════════════════════ */
  var reelChips = document.querySelectorAll('.chip[data-reelfilter]');
  var reelGridItems = Array.prototype.slice.call(document.querySelectorAll('.reel[data-client]'));
  var reelCount = document.getElementById('reelCount');
  function updateReelCount(visibleCount, label) {
    if (!reelCount) return;
    reelCount.textContent = visibleCount + (visibleCount === 1 ? ' reel' : ' reels') +
      (label ? ' · ' + label : '');
  }
  function applyReelFilter(f, label) {
    var n = 0;
    reelGridItems.forEach(function (r) {
      var show = f === 'all' || r.getAttribute('data-client') === f;
      r.classList.toggle('hidden', !show);
      if (show) n++;
      /* pausar cualquier reel que se oculte */
      var v = r.querySelector('video');
      if (!show && v && !v.paused) { v.pause(); r.classList.remove('playing'); }
    });
    updateReelCount(n, label);
  }
  reelChips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      reelChips.forEach(function (c) { c.classList.toggle('active', c === chip); });
      applyReelFilter(chip.getAttribute('data-reelfilter'),
                      chip.getAttribute('data-reelfilter') === 'all' ? '' : chip.textContent.trim());
    });
  });
  if (reelGridItems.length) updateReelCount(reelGridItems.length, '');

  /* ════════════════════════════════════════════════════════════
     GALERÍA · filtros por categoría
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

  /* ════════════════════════════════════════════════════════════
     LIGHTBOX v2 · lista de medios + teclado + pinch-zoom
     ─ La lista se construye al abrir, según el panel activo:
       · Contenido & Reels → 4 imágenes + 8 videos (orden DOM)
       · Fotografía → solo las fotos visibles del filtro actual
     ─ ← → navegan (teclado y botones) entre fotos Y videos
     ─ Zoom SOLO sobre la foto (no la página):
       · móvil: pellizco para acercar (1×–4×) + arrastre para
         desplazarse + doble toque para alternar 1×/2.5×
       · escritorio: doble clic alterna zoom
       touch-action:none en el stage bloquea el zoom del navegador.
     ════════════════════════════════════════════════════════════ */
  var lightbox = document.getElementById('lightbox');
  var lbStage = document.getElementById('lightboxStage');
  var lbImg = document.getElementById('lightboxImg');
  var lbVid = document.getElementById('lightboxVid');
  var lbCounter = document.getElementById('lbCounter');
  var mediaList = [], mediaIdx = 0;

  function collect(el) {
    /* Devuelve descriptor {type, src, poster, alt} para un nodo */
    if (el.classList.contains('reel')) {
      var v = el.querySelector('video');
      return { type: 'video', src: v.getAttribute('src'),
               poster: v.getAttribute('poster') || '',
               alt: (el.querySelector('.reel-label') || {}).textContent || '' };
    }
    var img = el.querySelector('img');
    return { type: 'img', src: img.currentSrc || img.src, alt: img.alt || '' };
  }

  function buildList(fromEl) {
    var nodes;
    var fotosPanel = document.getElementById('pfFotos');
    if (fotosPanel && fotosPanel.contains(fromEl)) {
      nodes = Array.prototype.slice.call(
        fotosPanel.querySelectorAll('.gal-item:not(.hidden)'));
    } else if (fromEl.classList.contains('reel')) {
      /* solo los reels visibles del filtro de cliente activo */
      nodes = Array.prototype.slice.call(
        document.querySelectorAll('#reelGrid .reel:not(.hidden)'));
    } else {
      /* imágenes de diseño de contenido */
      nodes = Array.prototype.slice.call(
        document.querySelectorAll('#pfContenido .pf-item'));
    }
    mediaList = nodes.map(collect);
    mediaIdx = Math.max(0, nodes.indexOf(fromEl));
  }

  function renderMedia() {
    var m = mediaList[mediaIdx];
    resetZoom();
    /* detener y liberar el video anterior */
    lbVid.pause(); lbVid.removeAttribute('src'); lbVid.load();
    if (m.type === 'img') {
      lbVid.style.display = 'none';
      lbImg.style.display = '';
      lbImg.src = m.src; lbImg.alt = m.alt;
    } else {
      lbImg.style.display = 'none';
      lbVid.style.display = '';
      if (m.poster) lbVid.poster = m.poster;
      lbVid.src = m.src;
      var p = lbVid.play();
      if (p && p.catch) p.catch(function () {});
    }
    lbCounter.textContent = (mediaIdx + 1) + ' / ' + mediaList.length;
  }

  function openLightboxFrom(el) {
    buildList(el);
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    renderMedia();
  }
  function closeLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
    lbVid.pause(); lbVid.removeAttribute('src'); lbVid.load();
    setTimeout(function () { lbImg.src = ''; }, 300);
  }
  function lbNext() { mediaIdx = (mediaIdx + 1) % mediaList.length; renderMedia(); }
  function lbPrev() { mediaIdx = (mediaIdx - 1 + mediaList.length) % mediaList.length; renderMedia(); }

  /* Apertura desde imágenes del portafolio y de la galería */
  document.querySelectorAll('.pf-item, .gal-item').forEach(function (el) {
    el.addEventListener('click', function () { openLightboxFrom(el); });
  });

  document.getElementById('lbNext').addEventListener('click', function (e) {
    e.stopPropagation(); lbNext();
  });
  document.getElementById('lbPrev').addEventListener('click', function (e) {
    e.stopPropagation(); lbPrev();
  });
  lightbox.addEventListener('click', function (e) {
    if (e.target === lightbox || e.target.closest('.lightbox-close')) closeLightbox();
  });
  /* Teclado: ← → navegan, Esc cierra */
  document.addEventListener('keydown', function (e) {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    else if (e.key === 'ArrowRight') { e.preventDefault(); lbNext(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); lbPrev(); }
  });

  /* ── Pinch-zoom + pan + doble toque (solo sobre la imagen) ── */
  var zScale = 1, zTx = 0, zTy = 0;
  var pointers = new Map();
  var pinchStartDist = 0, pinchStartScale = 1;
  var panLastX = 0, panLastY = 0, lastTapTime = 0;

  function applyZoom() {
    lbImg.style.transform =
      'translate(' + zTx + 'px,' + zTy + 'px) scale(' + zScale + ')';
    lbImg.classList.toggle('zoomed', zScale > 1.02);
  }
  function resetZoom() {
    zScale = 1; zTx = 0; zTy = 0; pointers.clear();
    lbImg.style.transform = ''; lbImg.classList.remove('zoomed');
  }
  function clampPan() {
    /* límites laxos para no perder la imagen fuera del stage */
    var maxX = (zScale - 1) * lbImg.offsetWidth / 2;
    var maxY = (zScale - 1) * lbImg.offsetHeight / 2;
    zTx = Math.max(-maxX, Math.min(maxX, zTx));
    zTy = Math.max(-maxY, Math.min(maxY, zTy));
  }
  function dist2(a, b) {
    var dx = a.x - b.x, dy = a.y - b.y;
    return Math.hypot(dx, dy);
  }
  function toggleZoom() {
    if (zScale > 1.02) { resetZoom(); }
    else { zScale = 2.5; zTx = 0; zTy = 0; }
    lbImg.style.transition = 'transform .25s ease-out';
    applyZoom();
    setTimeout(function () { lbImg.style.transition = ''; }, 260);
  }

  lbStage.addEventListener('pointerdown', function (e) {
    if (e.target !== lbImg) return;
    lbStage.setPointerCapture && lbStage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      var pts = Array.from(pointers.values());
      pinchStartDist = dist2(pts[0], pts[1]);
      pinchStartScale = zScale;
    } else if (pointers.size === 1) {
      panLastX = e.clientX; panLastY = e.clientY;
      /* doble toque (touch) */
      if (e.pointerType === 'touch') {
        var now = Date.now();
        if (now - lastTapTime < 300) { toggleZoom(); lastTapTime = 0; }
        else lastTapTime = now;
      }
    }
  });
  lbStage.addEventListener('pointermove', function (e) {
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 2) {
      var pts = Array.from(pointers.values());
      var d = dist2(pts[0], pts[1]);
      if (pinchStartDist > 0) {
        zScale = Math.max(1, Math.min(4, pinchStartScale * d / pinchStartDist));
        clampPan(); applyZoom();
      }
      e.preventDefault();
    } else if (pointers.size === 1 && zScale > 1.02) {
      zTx += e.clientX - panLastX;
      zTy += e.clientY - panLastY;
      panLastX = e.clientX; panLastY = e.clientY;
      clampPan(); applyZoom();
      e.preventDefault();
    }
  });
  function endPointer(e) {
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStartDist = 0;
    if (zScale <= 1.02) resetZoom();
  }
  lbStage.addEventListener('pointerup', endPointer);
  lbStage.addEventListener('pointercancel', endPointer);
  /* escritorio: doble clic alterna zoom */
  lbImg.addEventListener('dblclick', function (e) {
    e.preventDefault(); toggleZoom();
  });

  /* ════════════════════════════════════════════════════════════
     FAQ · acordeón
     ════════════════════════════════════════════════════════════ */
  document.querySelectorAll('.faq').forEach(function (item) {
    var q = item.querySelector('.faq-q');
    var a = item.querySelector('.faq-a');
    q.addEventListener('click', function () {
      var isOpen = item.classList.contains('open');
      if (isOpen) { a.style.maxHeight = '0px'; item.classList.remove('open'); }
      else { a.style.maxHeight = a.scrollHeight + 'px'; item.classList.add('open'); }
    });
  });

  /* ════════════════════════════════════════════════════════════
     TOOLTIP DEL BOTÓN FLOTANTE
     ════════════════════════════════════════════════════════════ */
  var waTip = document.getElementById('waTip');
  if (waTip && !REDUCED) {
    setTimeout(function () { waTip.classList.add('show'); }, 3500);
    setTimeout(function () { waTip.classList.remove('show'); }, 9500);
  }

  /* ════════════════════════════════════════════════════════════
     FORMULARIO DE LEADS (Apps Script o fallback WhatsApp)
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
      fetch(APPS_SCRIPT_URL, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ nombre: nombre, whatsapp: whatsapp,
          mensaje: mensaje, fecha: new Date().toISOString() })
      }).then(function () {
        statusEl.textContent = '✓ ¡Recibido! Te escribiremos muy pronto.';
        statusEl.classList.add('ok'); form.reset();
      }).catch(function () { openWaFallback(nombre, whatsapp, mensaje); });
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
     RED NEURONAL DECORATIVA (canvas)
     ─ Partículas que derivan lentamente; se unen con líneas cuya
       opacidad depende de la distancia (efecto sinapsis).
     ─ Un rAF global anima todos los lienzos visibles.
     ─ IntersectionObserver pausa los lienzos fuera de viewport.
     ─ prefers-reduced-motion → dibuja un fotograma estático.
     ─ devicePixelRatio para nitidez; se re-dimensiona en resize.
     ════════════════════════════════════════════════════════════ */
  (function neuralNetworks() {
    var canvases = Array.prototype.slice.call(document.querySelectorAll('[data-neuro]'));
    if (!canvases.length) return;

    var TEAL = '0,194,203';
    var nets = [];

    function build(canvas) {
      var ctx = canvas.getContext('2d');
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = 0, h = 0, nodes = [];

      function resize() {
        var r = canvas.getBoundingClientRect();
        w = r.width; h = r.height;
        canvas.width = w * dpr; canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        /* densidad proporcional al área, con tope para rendimiento */
        var count = Math.max(10, Math.min(26, Math.round(w * h / 12000)));
        nodes = [];
        for (var i = 0; i < count; i++) {
          nodes.push({
            x: Math.random() * w, y: Math.random() * h,
            vx: (Math.random() - 0.5) * 0.22,
            vy: (Math.random() - 0.5) * 0.22,
            r: 1.3 + Math.random() * 1.6
          });
        }
      }

      function frame() {
        ctx.clearRect(0, 0, w, h);
        for (var i = 0; i < nodes.length; i++) {
          var n = nodes[i];
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > w) n.vx *= -1;
          if (n.y < 0 || n.y > h) n.vy *= -1;
          /* enlaces (sinapsis) */
          for (var j = i + 1; j < nodes.length; j++) {
            var m = nodes[j];
            var dx = n.x - m.x, dy = n.y - m.y;
            var d = Math.hypot(dx, dy);
            if (d < 120) {
              ctx.strokeStyle = 'rgba(' + TEAL + ',' + (0.16 * (1 - d / 120)) + ')';
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(n.x, n.y); ctx.lineTo(m.x, m.y); ctx.stroke();
            }
          }
        }
        /* nodos por encima de las líneas */
        for (var k = 0; k < nodes.length; k++) {
          var p = nodes[k];
          ctx.fillStyle = 'rgba(' + TEAL + ',0.55)';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      resize();
      return { canvas: canvas, resize: resize, frame: frame, visible: false };
    }

    nets = canvases.map(build);

    /* Pausa/activa según visibilidad de la sección */
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          var net = nets.find(function (n) { return n.canvas === e.target; });
          if (net) net.visible = e.isIntersecting;
        });
      }, { threshold: 0.02 });
      nets.forEach(function (n) { io.observe(n.canvas); });
    } else {
      nets.forEach(function (n) { n.visible = true; });
    }

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        nets.forEach(function (n) { n.resize(); });
      }, 200);
    });

    if (REDUCED) {
      /* Un solo fotograma estático, sin bucle */
      nets.forEach(function (n) { n.frame(); });
    } else {
      (function loop() {
        for (var i = 0; i < nets.length; i++) {
          if (nets[i].visible) nets[i].frame();
        }
        requestAnimationFrame(loop);
      })();
    }
  })();

  /* ── AÑO DEL FOOTER ── */
  document.getElementById('year').textContent = new Date().getFullYear();

})();

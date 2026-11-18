/* ==========================================================================
   CYBER 24 HORAS — Lógica del prototipo (sin backend, datos de demostración)
   ========================================================================== */
(function () {
  'use strict';

  const D = window.CyberData;
  if (!D) return;

  const $ = (selector, root) => (root || document).querySelector(selector);
  const $$ = (selector, root) => Array.from((root || document).querySelectorAll(selector));
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = D.formatearPrecio;
  const icon = (name, cls) => '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';

  const STORAGE = {
    session: 'cyber24_session',
    users: 'cyber24_users',
    reservas: 'cyber24_reservas',
    pending: 'cyber24_pending'
  };

  const DEMO_USER = {
    nombre: 'Alex Gamer',
    email: 'cliente@cyber24h.com',
    password: 'demo1234',
    puntos: 1240,
    desde: '2024-03-15'
  };

  const store = {
    get(key, fallback) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* modo privado */ }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) { /* modo privado */ }
    }
  };

  const getSession = () => store.get(STORAGE.session, null);
  const setSession = (user) => store.set(STORAGE.session, user);
  const iniciales = (nombre) => nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const primerNombre = (nombre) => nombre.split(/\s+/)[0] || nombre;
  const horaLabel = (h) => pad(((h % 24) + 24) % 24) + ':00';
  const fechaCorta = (iso) => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' });
  };
  const fechaLarga = (iso) => {
    const d = new Date(iso + 'T12:00:00');
    const txt = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
    return txt.charAt(0).toUpperCase() + txt.slice(1);
  };
  const hoyISO = () => D.hoyISO();
  const fechaOffset = (offset) => D.hoyISO(offset);

  /* ----------------------------- UI helpers ------------------------------ */
  function toast(message, type) {
    type = type || 'info';
    let container = $('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: 'check', error: 'x', info: 'info' };
    const el = document.createElement('div');
    el.className = 'toast toast--' + type;
    el.innerHTML = icon(icons[type] || 'info', 'toast-icon') + '<div>' + message + '</div>';
    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 350);
    }, 4200);
  }

  function getModal() {
    let backdrop = $('#appModal');
    if (backdrop) return backdrop;
    backdrop = document.createElement('div');
    backdrop.id = 'appModal';
    backdrop.className = 'modal-backdrop';
    backdrop.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-label="Diálogo"></div>';
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop || event.target.closest('[data-modal-close]')) closeModal();
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeModal();
    });
    return backdrop;
  }

  function openModal(html, extraClass) {
    const backdrop = getModal();
    const modal = $('.modal', backdrop);
    modal.className = 'modal' + (extraClass ? ' ' + extraClass : '');
    modal.innerHTML = html;
    backdrop.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    return modal;
  }

  function closeModal() {
    const backdrop = $('#appModal');
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  function modalHeader(title, subtitle) {
    return '<div class="modal-head"><div><h2>' + title + '</h2>' + (subtitle ? '<p>' + subtitle + '</p>' : '') + '</div>' +
      '<button type="button" class="modal-close" data-modal-close aria-label="Cerrar">' + icon('x') + '</button></div>';
  }

  function emptyState(iconName, title, text) {
    return '<div class="booking-empty"><div class="be-icon">' + icon(iconName) + '</div><h3>' + title + '</h3><p>' + text + '</p></div>';
  }

  /* ----------------------------- Header ---------------------------------- */
  function initHeader() {
    const header = $('#siteHeader');
    if (!header) return;
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    const toggle = $('.menu-toggle', header);
    if (toggle) {
      toggle.addEventListener('click', () => {
        const open = header.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      $$('.main-nav a', header).forEach((link) => link.addEventListener('click', () => {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }

    const path = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    $$('.main-nav a', header).forEach((link) => {
      const href = link.getAttribute('href') || '';
      // Los enlaces con ancla pertenecen a la landing y no marcan la página actual.
      if (!href || href.includes('#')) return;
      if (href.toLowerCase() === path) link.classList.add('is-active');
    });

    const session = getSession();
    if (session) {
      $$('[data-auth-link]').forEach((link) => {
        link.setAttribute('href', 'cuenta.html');
        const label = $('[data-auth-label]', link);
        if (label) label.textContent = 'Mi cuenta';
      });
    }
  }

  /* ----------------------------- Reveal ---------------------------------- */
  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => observer.observe(el));
  }

  /* ----------------------------- Landing --------------------------------- */
  const priceMeta = {
    pc: { chip: 'Gaming', chipClass: 'chip--cyan', icons: ['monitor', 'zap', 'clock'] },
    oficina: { chip: 'Oficina', chipClass: 'chip--violet', icons: ['briefcase', 'printer', 'clock'] },
    consola: { chip: 'Consola', chipClass: 'chip--violet', icons: ['gamepad', 'users', 'gamepad'] }
  };

  function renderPrecios(tipo) {
    const wrap = $('#priceGrid');
    if (!wrap) return;
    const items = D.precios[tipo] || D.precios.pc;
    const meta = priceMeta[tipo] || priceMeta.pc;
    wrap.innerHTML = items.map((p, i) => {
      const iconName = meta.icons[i] || meta.icons[0];
      return '<article class="price-card card' + (p.destacado ? ' is-featured' : '') + '">' +
        (p.destacado ? '<span class="popular">Más elegido</span>' : '') +
        '<div class="price-head"><div class="price-icon">' + icon(iconName) + '</div>' +
        '<span class="chip ' + meta.chipClass + '">' + meta.chip + '</span></div>' +
        '<h3>' + p.nombre + '</h3>' +
        '<div class="price-amount"><strong>' + fmt(p.precio) + '</strong><span>' + p.unidad + '</span></div>' +
        '<p class="price-detail">' + p.detalle + '</p>' +
        '<ul class="price-features">' + p.features.map((f) => '<li>' + icon('check') + '<span>' + f + '</span></li>').join('') + '</ul>' +
        '<a class="btn ' + (p.destacado ? 'btn-primary' : 'btn-ghost') + ' btn-block" href="disponibilidad.html">' + (p.cta || 'Reservar ahora') + ' ' + icon('arrow-right') + '</a>' +
        '</article>';
    }).join('');
  }

  function renderPromos() {
    const wrap = $('#promoGrid');
    if (!wrap) return;
    wrap.innerHTML = D.promos.map((p) => '<article class="promo-card card">' +
      '<div class="promo-art" data-theme="' + p.tema + '">' +
        '<span class="promo-badge">' + p.badge + '</span>' +
        '<span class="promo-icon">' + icon(p.icono) + '</span>' +
        '<div class="promo-bottom"><span>' + p.vigencia + '</span><span class="promo-code">' + p.codigo + '</span></div>' +
      '</div>' +
      '<div class="promo-body"><h3>' + p.titulo + '</h3><div class="promo-sub">' + p.subtitulo + '</div><p>' + p.detalle + '</p>' +
      '<div class="promo-foot"><span class="small muted">Válido en web y app</span><a class="link-arrow" href="disponibilidad.html">Usar promo ' + icon('arrow-right') + '</a></div></div>' +
      '</article>').join('');
  }

  function renderTorneos() {
    const wrap = $('#tournamentGrid');
    if (!wrap) return;
    wrap.innerHTML = D.torneos.map((t) => {
      const pct = Math.round((t.inscriptos / t.cupos) * 100);
      return '<article class="tournament-card card">' +
        '<div class="tournament-top"><span class="game-chip">' + icon(t.icono) + t.juego + '</span>' +
        '<div class="date-block"><strong>' + t.fecha + '</strong><span>' + t.hora + ' hs</span></div></div>' +
        '<h3>' + t.titulo + '</h3>' +
        '<div class="tournament-meta"><span>' + icon('users') + t.formato + '</span><span>' + icon('map-pin') + 'Presencial · Cyber 24 Horas</span></div>' +
        '<div class="tournament-prize">' + icon('trophy') + '<span>' + t.premio + '</span></div>' +
        '<div class="slots"><div class="slots-head"><span>Cupos</span><span>' + t.inscriptos + ' / ' + t.cupos + '</span></div>' +
        '<div class="progress"><span style="width:' + pct + '%"></span></div></div>' +
        '<button class="btn btn-ghost btn-block" data-inscribir="' + t.id + '">Inscribirme ' + icon('arrow-right') + '</button>' +
        '</article>';
    }).join('');
  }

  function renderKiosco() {
    const wrap = $('#kioscoGrid');
    if (!wrap) return;
    wrap.innerHTML = D.kiosco.map((k) => '<article class="product-card card">' +
      '<div class="product-thumb" data-theme="' + k.tema + '">' + icon(k.icono) + '</div>' +
      '<h3>' + k.nombre + '</h3><div class="price">' + fmt(k.precio) + '</div>' +
      '<span class="small muted">' + k.categoria + '</span></article>').join('');
  }

  function actualizarContadores() {
    const counts = { disponible: 0, reservado: 0, ocupado: 0, mantenimiento: 0 };
    D.equipos.forEach((e) => { counts[e.estado] = (counts[e.estado] || 0) + 1; });
    $$('[data-count]').forEach((el) => { el.textContent = counts[el.dataset.count] || 0; });
  }

  function initCarousel() {
    const root = $('#heroCarousel');
    if (!root) return;
    const slides = $$('.carousel-slide', root);
    const dotsWrap = $('.carousel-dots', root);
    if (!slides.length || !dotsWrap) return;
    let index = 0;
    let timer = null;

    slides.forEach((slide, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot' + (i === 0 ? ' is-active' : '');
      dot.setAttribute('aria-label', 'Ir al slide ' + (i + 1));
      dot.addEventListener('click', () => { go(i); restart(); });
      dotsWrap.appendChild(dot);
    });
    const dots = $$('.carousel-dot', dotsWrap);

    function go(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === index));
      dots.forEach((d, i) => d.classList.toggle('is-active', i === index));
    }
    function start() {
      clearInterval(timer);
      timer = setInterval(() => go(index + 1), 6500);
    }
    function restart() { start(); }

    const prev = $('[data-carousel="prev"]', root);
    const next = $('[data-carousel="next"]', root);
    if (prev) prev.addEventListener('click', () => { go(index - 1); restart(); });
    if (next) next.addEventListener('click', () => { go(index + 1); restart(); });

    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', start);
    start();
  }

  function initLanding() {
    renderPrecios('pc');
    renderPromos();
    renderTorneos();
    renderKiosco();
    actualizarContadores();
    initCarousel();

    $$('[data-price-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('[data-price-tab]').forEach((b) => b.classList.toggle('is-active', b === btn));
        renderPrecios(btn.dataset.priceTab);
      });
    });

    const contact = $('#contactForm');
    if (contact) {
      contact.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!contact.reportValidity()) return;
        const nombre = $('#contactName').value.trim();
        toast('¡Gracias, ' + (nombre || 'gamer') + '! Tu mensaje fue enviado. Te respondemos a la brevedad.', 'success');
        contact.reset();
      });
    }

    document.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-inscribir]');
      if (!btn) return;
      if (!getSession()) {
        toast('Iniciá sesión para inscribirte al torneo.', 'info');
        setTimeout(() => { location.href = 'login.html?next=' + encodeURIComponent('index.html#torneos'); }, 1100);
        return;
      }
      toast('¡Inscripción registrada! Te enviamos los detalles por correo.', 'success');
    });
  }

  /* ----------------------------- Availability ---------------------------- */
  function initAvailability() {
    const map = $('#equipMap');
    const bookingBody = $('#bookingBody');
    if (!map || !bookingBody) return;

    const params = new URLSearchParams(location.search);
    // Si es muy tarde, la reserva arranca directamente en el día siguiente.
    const fechaInicial = new Date().getHours() >= 22 ? D.hoyISO(1) : hoyISO();
    const state = {
      tipo: 'todos',
      equipos: D.equipos.map((e) => Object.assign({}, e)),
      seleccion: null,
      fecha: fechaInicial,
      duracion: 1,
      hora: null,
      reservas: store.get(STORAGE.reservas, []),
      error: ''
    };

    // Reservas propias ya confirmadas se reflejan en el mapa si son para hoy.
    state.reservas.forEach((r) => {
      if (r.estado !== 'confirmada' || r.fecha !== hoyISO()) return;
      const eq = state.equipos.find((e) => e.id === r.equipo);
      if (eq && eq.estado !== 'mantenimiento') {
        eq.estado = 'reservado';
        eq.reservaHora = horaLabel(r.inicio);
      }
    });

    function getEquipo(id) {
      return state.equipos.find((e) => e.id === id) || D.equipos.find((e) => e.id === id);
    }

    function bloqueosDe(equipoId, fecha) {
      const out = D.bloqueos.filter((b) => b.equipo === equipoId).map((b) => ({ inicio: b.inicio, fin: b.fin }));
      state.reservas.filter((r) => r.estado === 'confirmada' && r.equipo === equipoId && r.fecha === fecha)
        .forEach((r) => out.push({ inicio: r.inicio, fin: r.inicio + r.duracion }));
      if (fecha === hoyISO()) {
        const original = D.equipos.find((e) => e.id === equipoId);
        if (original && original.estado === 'ocupado' && original.restante) {
          const now = new Date();
          const start = now.getHours() + now.getMinutes() / 60;
          out.push({ inicio: Math.floor(start), fin: Math.ceil(start + original.restante / 60) });
        }
      }
      return out;
    }

    function slotDisponible(equipoId, fecha, hora, duracion) {
      if (hora + duracion > 24) return false;
      if (fecha < hoyISO()) return false;
      if (fecha === hoyISO()) {
        const now = new Date();
        if (hora * 60 <= now.getHours() * 60 + now.getMinutes()) return false;
      }
      return !bloqueosDe(equipoId, fecha).some((b) => hora < b.fin && hora + duracion > b.inicio);
    }

    function horaSugerida() {
      const now = new Date();
      let h = now.getHours() + (now.getMinutes() > 0 ? 1 : 0);
      if (h < 10 || h > 22) h = 10;
      return h;
    }

    function primerHorario(equipoId, fecha, duracion) {
      // Para la demo arrancamos cerca de la hora actual (o 10:00 si es de madrugada).
      const start = fecha === hoyISO() ? horaSugerida() : 10;
      for (let i = 0; i < 24; i += 1) {
        const h = (start + i) % 24;
        if (slotDisponible(equipoId, fecha, h, duracion)) return h;
      }
      return null;
    }

    function totalReserva() {
      if (!state.seleccion) return 0;
      const bruto = state.seleccion.precio * state.duracion;
      return state.duracion === 3 ? Math.round(bruto * 0.9) : bruto;
    }

    function equipHTML(eq) {
      const info = D.estadoInfo[eq.estado] || D.estadoInfo.disponible;
      const tipoIcon = eq.tipo === 'pc' ? 'monitor' : 'gamepad';
      const estadoTxt = eq.estado === 'mantenimiento' ? 'No disponible' : info.label;
      return '<button type="button" class="equip equip--' + eq.estado + (state.seleccion && state.seleccion.id === eq.id ? ' is-selected' : '') + '" data-equipo="' + eq.id + '" title="' + eq.id + ' · ' + estadoTxt + '">' +
        '<span class="equip-top"><span class="equip-id">' + eq.id + '</span>' + icon(tipoIcon) + '</span>' +
        '<span class="equip-state">' + estadoTxt + '</span>' + icon('check', 'eq-check') + '</button>';
    }

    function renderMap() {
      const zonas = ['Zona Pro', 'Zona Oficina', 'Consolas'];
      const equipos = state.equipos.filter((e) => {
        if (state.tipo === 'todos') return true;
        if (state.tipo === 'gaming') return e.zona === 'Zona Pro';
        if (state.tipo === 'oficina') return e.zona === 'Zona Oficina';
        return e.tipo === state.tipo;
      });
      map.innerHTML = zonas.filter((z) => equipos.some((e) => e.zona === z)).map((zona) => {
        const items = equipos.filter((e) => e.zona === zona);
        const libres = items.filter((e) => e.estado === 'disponible').length;
        const zonaIcon = zona === 'Consolas' ? 'gamepad' : (zona === 'Zona Oficina' ? 'briefcase' : 'monitor');
        return '<section class="map-zone"><div class="zone-head"><h3>' + icon(zonaIcon) + zona + '</h3>' +
          '<span>' + libres + ' de ' + items.length + ' disponibles</span></div>' +
          '<div class="equip-grid">' + items.map(equipHTML).join('') + '</div></section>';
      }).join('');

      const libres = state.equipos.filter((e) => e.estado === 'disponible').length;
      $$('[data-live-free]').forEach((el) => { el.textContent = libres; });
    }

    function slotsHTML(eq) {
      let html = '';
      for (let h = 0; h < 24; h += 1) {
        const disabled = !slotDisponible(eq.id, state.fecha, h, state.duracion);
        html += '<button type="button" class="slot' + (state.hora === h ? ' is-active' : '') + '" data-hora="' + h + '"' + (disabled ? ' disabled' : '') + '>' + horaLabel(h) + '</button>';
      }
      return html;
    }

    function renderBooking() {
      const eq = state.seleccion;
      if (!eq) {
        bookingBody.innerHTML = emptyState('monitor', 'Elegí un equipo', 'Seleccioná una computadora o consola del mapa para ver horarios y reservar.');
        return;
      }
      const info = D.estadoInfo[eq.estado] || D.estadoInfo.disponible;
      const chipClass = eq.estado === 'disponible' ? 'chip--green' : eq.estado === 'reservado' ? 'chip--amber' : eq.estado === 'ocupado' ? 'chip--red' : '';
      const sesion = getSession();
      const total = totalReserva();
      bookingBody.innerHTML =
        '<div class="booking-eq"><div><h3>Equipo ' + eq.id + '</h3><p>' + eq.specs + '</p>' +
          '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"><span class="chip ' + chipClass + '">' + (eq.estado === 'mantenimiento' ? 'No disponible' : info.label) + '</span>' +
          '<span class="chip">' + eq.zona + '</span>' +
          '<span class="chip">' + (eq.tipo === 'pc' ? 'Computadora' : 'Consola') + '</span></div></div>' +
          '<div class="price">' + fmt(eq.precio) + '<span>por hora</span></div></div>' +
        '<form class="booking-form" id="bookingForm" novalidate>' +
          '<div class="booking-row">' +
            '<div class="field"><label for="fechaReserva">Fecha</label><input type="date" id="fechaReserva" min="' + hoyISO() + '" max="' + fechaOffset(14) + '" value="' + state.fecha + '"></div>' +
            '<div class="field"><label for="durReserva">Duración</label><select id="durReserva">' +
              '<option value="1"' + (state.duracion === 1 ? ' selected' : '') + '>1 hora</option>' +
              '<option value="2"' + (state.duracion === 2 ? ' selected' : '') + '>2 horas</option>' +
              '<option value="3"' + (state.duracion === 3 ? ' selected' : '') + '>3 horas · -10%</option>' +
            '</select></div>' +
          '</div>' +
          '<div><div class="slot-label">Horario de inicio <span>' + fechaCorta(state.fecha) + '</span></div>' +
            '<div class="slot-grid" id="slotGrid">' + slotsHTML(eq) + '</div>' +
            '<div class="slot-note">' + icon('info') + 'Los horarios tachados ya están ocupados.</div></div>' +
          '<div class="booking-summary"><span>' + state.duracion + ' h · ' + fechaCorta(state.fecha) + (state.hora !== null ? ' · ' + horaLabel(state.hora) : '') + '</span><strong>' + fmt(total) + '</strong></div>' +
          '<div class="booking-error' + (state.error ? ' is-visible' : '') + '" id="bookingError">' + icon('info') + '<span>' + (state.error || '') + '</span></div>' +
          '<button type="submit" class="btn btn-primary btn-block btn-lg">' + (sesion ? 'Confirmar reserva' : 'Ingresá para reservar') + ' ' + icon('arrow-right') + '</button>' +
          (sesion ? '<div class="booking-trust">' + icon('shield-check') + 'Sin pago online: abonás al llegar al local.</div>'
                  : '<div class="booking-login-note">' + icon('user') + '<span>Necesitás una cuenta para reservar. Es la misma que usás en la app móvil.</span></div>') +
        '</form>';

      // Llevamos el scroll interno al horario preseleccionado.
      const grid = $('#slotGrid', bookingBody);
      const active = grid ? $('.slot.is-active', grid) : null;
      if (grid && active) {
        grid.scrollTop = Math.max(0, active.offsetTop - grid.offsetTop - 8);
      }
    }

    function updateSlotsUI() {
      $$('.slot', bookingBody).forEach((slot) => slot.classList.toggle('is-active', Number(slot.dataset.hora) === state.hora));
      const summary = $('.booking-summary', bookingBody);
      if (summary) {
        summary.innerHTML = '<span>' + state.duracion + ' h · ' + fechaCorta(state.fecha) + (state.hora !== null ? ' · ' + horaLabel(state.hora) : '') + '</span><strong>' + fmt(totalReserva()) + '</strong>';
      }
    }

    function seleccionarEquipo(id) {
      const eq = state.equipos.find((e) => e.id === id);
      if (!eq) return;
      if (eq.estado === 'mantenimiento') {
        toast('El equipo ' + eq.id + ' está fuera de servicio por mantenimiento.', 'info');
        return;
      }
      state.seleccion = eq;
      state.error = '';
      if (state.fecha < hoyISO()) state.fecha = hoyISO();
      if (state.hora === null || !slotDisponible(eq.id, state.fecha, state.hora, state.duracion)) {
        state.hora = primerHorario(eq.id, state.fecha, state.duracion);
      }
      renderMap();
      renderBooking();
      if (window.matchMedia('(max-width: 1040px)').matches) {
        const panel = $('#bookingPanel');
        if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    map.addEventListener('click', (event) => {
      const btn = event.target.closest('[data-equipo]');
      if (btn) seleccionarEquipo(btn.dataset.equipo);
    });

    bookingBody.addEventListener('click', (event) => {
      const slot = event.target.closest('.slot');
      if (!slot || slot.disabled) return;
      state.hora = Number(slot.dataset.hora);
      state.error = '';
      updateSlotsUI();
      const err = $('#bookingError');
      if (err) err.classList.remove('is-visible');
    });

    bookingBody.addEventListener('change', (event) => {
      const target = event.target;
      if (target.id === 'fechaReserva') {
        state.fecha = target.value || hoyISO();
        if (state.fecha < hoyISO()) state.fecha = hoyISO();
        if (state.hora === null || !slotDisponible(state.seleccion.id, state.fecha, state.hora, state.duracion)) {
          state.hora = primerHorario(state.seleccion.id, state.fecha, state.duracion);
        }
        state.error = '';
        renderBooking();
      }
      if (target.id === 'durReserva') {
        state.duracion = Number(target.value) || 1;
        if (state.hora === null || !slotDisponible(state.seleccion.id, state.fecha, state.hora, state.duracion)) {
          state.hora = primerHorario(state.seleccion.id, state.fecha, state.duracion);
        }
        state.error = '';
        renderBooking();
      }
    });

    bookingBody.addEventListener('submit', validarYContinuar);

    function validarYContinuar(event) {
      event.preventDefault();
      if (!state.seleccion) return;
      if (state.hora === null) {
        state.error = 'No hay horarios disponibles para esa fecha y duración. Probá con otro día.';
        renderBooking();
        return;
      }
      if (!slotDisponible(state.seleccion.id, state.fecha, state.hora, state.duracion)) {
        state.error = 'Ese horario acaba de ocuparse. Elegí otro, por favor.';
        renderBooking();
        return;
      }
      const sesion = getSession();
      if (!sesion) {
        store.set(STORAGE.pending, {
          equipo: state.seleccion.id,
          fecha: state.fecha,
          hora: state.hora,
          duracion: state.duracion
        });
        toast('Iniciá sesión para confirmar tu reserva. Guardamos tu selección.', 'info');
        setTimeout(() => {
          location.href = 'login.html?next=' + encodeURIComponent('disponibilidad.html?reserva=1');
        }, 1000);
        return;
      }
      confirmarReserva();
    }

    function confirmarReserva() {
      const eq = state.seleccion;
      const total = totalReserva();
      const modal = openModal(
        modalHeader('Confirmá tu reserva', 'Revisá los datos antes de confirmar.') +
        '<div class="modal-body"><div class="summary-list">' +
          '<div class="summary-row"><span>Equipo</span><strong>' + eq.id + ' · ' + (eq.tipo === 'pc' ? 'Computadora' : 'Consola') + '</strong></div>' +
          '<div class="summary-row"><span>Fecha</span><strong>' + fechaLarga(state.fecha) + '</strong></div>' +
          '<div class="summary-row"><span>Horario</span><strong>' + horaLabel(state.hora) + ' a ' + horaLabel(state.hora + state.duracion) + '</strong></div>' +
          '<div class="summary-row"><span>Duración</span><strong>' + state.duracion + ' hora' + (state.duracion > 1 ? 's' : '') + '</strong></div>' +
          '<div class="summary-row total"><span>Total estimado</span><strong>' + fmt(total) + '</strong></div>' +
        '</div><p class="small muted" style="margin-top:12px">El pago se realiza al llegar al local. Podés cancelar sin costo hasta el inicio de la reserva.</p></div>' +
        '<div class="modal-actions"><button type="button" class="btn btn-ghost" data-modal-close>Volver</button>' +
        '<button type="button" class="btn btn-primary" id="confirmBooking">Confirmar reserva ' + icon('check') + '</button></div>'
      );
      const btn = $('#confirmBooking', modal);
      if (btn) {
        btn.addEventListener('click', () => {
          const codigo = 'CYB-' + Math.floor(1000 + Math.random() * 9000);
          const reserva = {
            id: 'r-' + Date.now(),
            codigo: codigo,
            equipo: eq.id,
            fecha: state.fecha,
            inicio: state.hora,
            duracion: state.duracion,
            total: total,
            estado: 'confirmada',
            origen: 'Web',
            creada: new Date().toISOString()
          };
          state.reservas.push(reserva);
          store.set(STORAGE.reservas, state.reservas);

          if (state.fecha === hoyISO()) {
            const target = state.equipos.find((e) => e.id === eq.id);
            if (target) {
              target.estado = 'reservado';
              target.reservaHora = horaLabel(state.hora);
              state.seleccion = target;
            }
          }
          renderMap();
          renderBooking();
          mostrarConfirmacion(reserva);
        });
      }
    }

    function mostrarConfirmacion(reserva) {
      const eq = getEquipo(reserva.equipo);
      openModal(
        '<div class="modal--center">' +
        '<div class="success-icon">' + icon('check') + '</div>' +
        '<h2>¡Reserva confirmada!</h2>' +
        '<p class="small muted" style="margin-top:6px">Te esperamos en el local. Presentá tu código o escaneá el QR al llegar.</p>' +
        '<div class="code-box"><span>Código de reserva</span><strong>' + reserva.codigo + '</strong></div>' +
        '<div class="summary-list" style="margin-top:16px;text-align:left">' +
          '<div class="summary-row"><span>Equipo</span><strong>' + reserva.equipo + ' · ' + (eq ? eq.specs : '') + '</strong></div>' +
          '<div class="summary-row"><span>Fecha y hora</span><strong>' + fechaLarga(reserva.fecha) + ' · ' + horaLabel(reserva.inicio) + '</strong></div>' +
          '<div class="summary-row"><span>Duración</span><strong>' + reserva.duracion + ' h</strong></div>' +
        '</div>' +
        '<div class="modal-actions"><a class="btn btn-ghost" href="disponibilidad.html">Seguir explorando</a>' +
        '<a class="btn btn-primary" href="cuenta.html#reservas">Ver mis reservas ' + icon('arrow-right') + '</a></div></div>'
      );
    }

    // Filtros del mapa
    $$('[data-filter]').forEach((btn) => {
      btn.addEventListener('click', () => {
        state.tipo = btn.dataset.filter;
        $$('[data-filter]').forEach((b) => b.classList.toggle('is-active', b === btn));
        renderMap();
      });
    });

    // Actualización simulada
    let segundos = 3;
    const lastUpdate = $('#lastUpdate');
    const pintarHora = () => { if (lastUpdate) lastUpdate.textContent = 'Actualizado hace ' + segundos + ' s'; };
    pintarHora();
    setInterval(() => { segundos += 5; pintarHora(); }, 5000);

    const refresh = $('#refreshMap');
    if (refresh) {
      refresh.addEventListener('click', () => {
        segundos = 0;
        pintarHora();
        renderMap();
        toast('Mapa de disponibilidad actualizado.', 'success');
      });
    }

    // Retomar una reserva luego de iniciar sesión
    const pending = store.get(STORAGE.pending, null);
    if (pending && params.get('reserva') === '1') {
      const eq = state.equipos.find((e) => e.id === pending.equipo);
      if (eq) {
        state.seleccion = eq;
        state.fecha = pending.fecha >= hoyISO() ? pending.fecha : hoyISO();
        state.duracion = pending.duracion || 1;
        state.hora = pending.hora;
        if (state.hora === null || !slotDisponible(eq.id, state.fecha, state.hora, state.duracion)) {
          state.hora = primerHorario(eq.id, state.fecha, state.duracion);
        }
        renderMap();
        renderBooking();
        setTimeout(() => {
          const panel = $('#bookingPanel');
          if (panel) panel.scrollIntoView({ behavior: 'smooth', block: 'center' });
          toast('Retomamos tu reserva. Revisá el horario y confirmá.', 'info');
        }, 350);
      }
    } else if (params.get('equipo')) {
      seleccionarEquipo(params.get('equipo'));
    }

    renderMap();
    renderBooking();
    actualizarContadores();
  }

  /* ----------------------------- Login ----------------------------------- */
  function initLogin() {
    const loginForm = $('#loginForm');
    if (!loginForm) return;

    const loginError = $('#loginError');
    const registerError = $('#registerError');

    function showError(el, message) {
      if (!el) return;
      const span = $('span', el);
      if (span) span.textContent = message;
      el.classList.add('is-visible');
    }
    function hideError(el) { if (el) el.classList.remove('is-visible'); }

    $$('[data-auth-tab]').forEach((tab) => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.authTab;
        $$('[data-auth-tab]').forEach((t) => t.classList.toggle('is-active', t === tab));
        $$('[data-auth-panel]').forEach((panel) => panel.hidden = panel.dataset.authPanel !== target);
        hideError(loginError);
        hideError(registerError);
        const title = $('#authTitle');
        if (title) title.textContent = target === 'registro' ? 'Creá tu cuenta' : 'Bienvenido de nuevo';
      });
    });
    if (location.hash === '#registro') {
      const regTab = $('[data-auth-tab="registro"]');
      if (regTab) regTab.click();
    }

    $$('[data-toggle-pass]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const input = document.getElementById(btn.dataset.togglePass);
        if (!input) return;
        const visible = input.type === 'text';
        input.type = visible ? 'password' : 'text';
        btn.innerHTML = icon(visible ? 'eye' : 'eye-off');
        btn.setAttribute('aria-label', visible ? 'Mostrar contraseña' : 'Ocultar contraseña');
      });
    });

    function safeNext() {
      const raw = new URLSearchParams(location.search).get('next') || 'cuenta.html';
      return /^[\w-]+\.html(#[\w-]+)?$/.test(raw) ? raw : 'cuenta.html';
    }

    function redirectAfterLogin() {
      const pending = store.get(STORAGE.pending, null);
      const target = pending ? 'disponibilidad.html?reserva=1' : safeNext();
      setTimeout(() => { location.href = target; }, 750);
    }

    function login(email, password) {
      const users = store.get(STORAGE.users, []);
      const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      let user = null;

      if (found && found.password === password) {
        user = { nombre: found.nombre, email: found.email, puntos: found.puntos || 150, desde: found.desde };
      } else if (email.toLowerCase() === DEMO_USER.email && password === DEMO_USER.password) {
        user = { nombre: DEMO_USER.nombre, email: DEMO_USER.email, puntos: DEMO_USER.puntos, desde: DEMO_USER.desde };
      }

      if (!user) {
        showError(loginError, 'Correo o contraseña incorrectos. Podés usar la cuenta de demostración.');
        return;
      }

      setSession(user);
      hideError(loginError);
      toast('¡Hola, ' + primerNombre(user.nombre) + '! Sesión iniciada.', 'success');
      redirectAfterLogin();
    }

    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = $('#loginEmail').value.trim();
      const password = $('#loginPass').value;
      hideError(loginError);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError(loginError, 'Ingresá un correo electrónico válido.');
        $('#loginEmail').classList.add('field-error');
        return;
      }
      $('#loginEmail').classList.remove('field-error');
      if (password.length < 6) {
        showError(loginError, 'La contraseña debe tener al menos 6 caracteres.');
        $('#loginPass').classList.add('field-error');
        return;
      }
      $('#loginPass').classList.remove('field-error');
      login(email, password);
    });

    const demo = $('#demoLogin');
    if (demo) {
      demo.addEventListener('click', () => {
        $('#loginEmail').value = DEMO_USER.email;
        $('#loginPass').value = DEMO_USER.password;
        login(DEMO_USER.email, DEMO_USER.password);
      });
    }

    const registerForm = $('#registerForm');
    if (registerForm) {
      registerForm.addEventListener('submit', (event) => {
        event.preventDefault();
        hideError(registerError);
        const nombre = $('#regName').value.trim();
        const email = $('#regEmail').value.trim();
        const pass = $('#regPass').value;
        const pass2 = $('#regPass2').value;
        const terms = $('#regTerms').checked;

        if (nombre.length < 3) {
          showError(registerError, 'Ingresá tu nombre completo.');
          return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          showError(registerError, 'Ingresá un correo electrónico válido.');
          return;
        }
        if (pass.length < 6) {
          showError(registerError, 'La contraseña debe tener al menos 6 caracteres.');
          return;
        }
        if (pass !== pass2) {
          showError(registerError, 'Las contraseñas no coinciden.');
          return;
        }
        if (!terms) {
          showError(registerError, 'Tenés que aceptar los términos y condiciones.');
          return;
        }
        const users = store.get(STORAGE.users, []);
        if (users.some((u) => u.email.toLowerCase() === email.toLowerCase()) || email.toLowerCase() === DEMO_USER.email) {
          showError(registerError, 'Ya existe una cuenta con ese correo. Iniciá sesión.');
          return;
        }
        const user = { nombre: nombre, email: email, password: pass, puntos: 150, desde: new Date().toISOString() };
        users.push(user);
        store.set(STORAGE.users, users);
        setSession({ nombre: user.nombre, email: user.email, puntos: user.puntos, desde: user.desde });
        toast('¡Cuenta creada! Te regalamos 150 puntos de bienvenida.', 'success');
        redirectAfterLogin();
      });
    }

    const session = getSession();
    if (session) {
      const card = $('.auth-card');
      if (card) {
        const banner = document.createElement('div');
        banner.className = 'auth-demo';
        banner.style.marginBottom = '18px';
        banner.innerHTML = '<strong>' + icon('user') + ' Ya iniciaste sesión</strong>' +
          '<p>Estás como <b>' + session.nombre + '</b>. Podés ir a tu cuenta o cerrar sesión.</p>' +
          '<div style="display:flex;gap:8px;margin-top:10px"><a class="btn btn-primary btn-sm" href="cuenta.html">Mi cuenta</a>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-logout>Cerrar sesión</button></div>';
        card.insertBefore(banner, card.firstChild);
      }
    }
  }

  /* ----------------------------- Account --------------------------------- */
  function initAccount() {
    const shell = $('#cuentaShell');
    const gate = $('#cuentaGate');
    if (!shell || !gate) return;

    function paintUser(session) {
      $$('[data-user-name]').forEach((el) => { el.textContent = primerNombre(session.nombre); });
      $$('[data-user-fullname]').forEach((el) => { el.textContent = session.nombre; });
      $$('[data-user-email]').forEach((el) => { el.textContent = session.email; });
      $$('[data-user-points]').forEach((el) => { el.textContent = Number(session.puntos || 0).toLocaleString('es-AR'); });
      $$('[data-user-initials]').forEach((el) => { el.textContent = iniciales(session.nombre); });
      const since = $('[data-user-since]');
      if (since) {
        const d = new Date(session.desde);
        since.textContent = isNaN(d) ? '2024' : d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
      }
    }

    let session = getSession();
    if (!session && new URLSearchParams(location.search).get('demo') === '1') {
      // Acceso rápido para presentar el prototipo: cuenta.html?demo=1
      setSession({ nombre: DEMO_USER.nombre, email: DEMO_USER.email, puntos: DEMO_USER.puntos, desde: DEMO_USER.desde });
      session = getSession();
    }
    if (!session) {
      gate.hidden = false;
      shell.hidden = true;
      const demoBtn = $('#gateDemoLogin');
      if (demoBtn) {
        demoBtn.addEventListener('click', () => {
          setSession({ nombre: DEMO_USER.nombre, email: DEMO_USER.email, puntos: DEMO_USER.puntos, desde: DEMO_USER.desde });
          toast('Sesión demo iniciada.', 'success');
          setTimeout(() => location.reload(), 500);
        });
      }
      return;
    }

    gate.hidden = true;
    shell.hidden = false;
    paintUser(session);

    // Tabs
    function activateTab(tab) {
      $$('.account-nav [data-account-tab]').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.accountTab === tab));
      $$('.account-panel').forEach((panel) => panel.classList.toggle('is-active', panel.dataset.panel === tab));
    }
    $$('[data-account-tab]').forEach((btn) => {
      btn.addEventListener('click', (event) => {
        if (btn.tagName === 'A') event.preventDefault();
        activateTab(btn.dataset.accountTab);
      });
    });
    const hash = (location.hash || '').replace('#', '');
    if (hash && $('[data-panel="' + hash + '"]')) activateTab(hash);

    // Reservas
    let reservas = store.get(STORAGE.reservas, []).filter((r) => r.estado === 'confirmada')
      .concat(D.reservasDemo.map((r) => Object.assign({}, r)))
      .sort((a, b) => (a.fecha + String(a.inicio).padStart(2, '0')).localeCompare(b.fecha + String(b.inicio).padStart(2, '0')));

    function renderReservas() {
      const wrap = $('#reservasList');
      const count = $('#reservasCount');
      if (count) count.textContent = reservas.length;
      const summaryCount = $('#summaryReservas');
      if (summaryCount) summaryCount.textContent = reservas.length;
      const summaryNext = $('#summaryProxima');
      if (summaryNext) {
        const next = reservas[0];
        if (!next) {
          summaryNext.textContent = 'Sin reservas próximas';
        } else {
          const d = new Date(next.fecha + 'T12:00:00');
          const dia = next.fecha === hoyISO() ? 'hoy' : (next.fecha === hoyISO(1) ? 'mañana' : d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }));
          summaryNext.textContent = 'Próxima: ' + dia + ' ' + horaLabel(next.inicio);
        }
      }
      if (!wrap) return;
      if (!reservas.length) {
        wrap.innerHTML = emptyState('calendar', 'No tenés reservas activas', 'Elegí un equipo desde el mapa de disponibilidad y reservá en segundos.');
        return;
      }
      wrap.innerHTML = reservas.map((r) => {
        const eq = D.equipos.find((e) => e.id === r.equipo);
        const d = new Date(r.fecha + 'T12:00:00');
        return '<div class="reserva-card">' +
          '<div class="reserva-date"><strong>' + pad(d.getDate()) + '</strong><span>' + d.toLocaleDateString('es-AR', { month: 'short' }) + '</span></div>' +
          '<div class="reserva-info"><strong>' + r.equipo + ' · ' + (eq && eq.tipo === 'consola' ? 'Consola' : 'Computadora') + '</strong>' +
          '<span>' + fechaLarga(r.fecha) + ' · ' + horaLabel(r.inicio) + ' a ' + horaLabel(r.inicio + r.duracion) + ' · ' + r.duracion + ' h</span>' +
          '<span>' + r.codigo + ' · ' + r.origen + ' · ' + fmt(r.total) + '</span></div>' +
          '<button type="button" class="btn btn-danger-soft btn-sm" data-cancelar="' + r.id + '">Cancelar</button>' +
          '</div>';
      }).join('');
    }

    const list = $('#reservasList');
    if (list) {
      list.addEventListener('click', (event) => {
        const btn = event.target.closest('[data-cancelar]');
        if (!btn) return;
        const id = btn.dataset.cancelar;
        const stored = store.get(STORAGE.reservas, []);
        const found = stored.find((r) => r.id === id);
        if (found) {
          found.estado = 'cancelada';
          store.set(STORAGE.reservas, stored);
        }
        reservas = reservas.filter((r) => r.id !== id);
        renderReservas();
        toast('Reserva cancelada. El equipo volvió a estar disponible.', 'success');
      });
    }
    renderReservas();

    // Sesión activa (demo)
    const end = Date.now() + 47 * 60 * 1000;
    const timerEls = $$('[data-session-time]');
    const bar = $('#sessionBar');
    function tick() {
      const diff = Math.max(0, end - Date.now());
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      timerEls.forEach((el) => { el.textContent = pad(mins) + ':' + pad(secs); });
      if (bar) {
        const progress = diff / (47 * 60 * 1000);
        bar.style.strokeDashoffset = String(Math.round(214 * (1 - progress)));
      }
      if (diff > 0) setTimeout(tick, 1000);
    }
    if (timerEls.length) tick();

    // Puntos
    const puntosBar = $('#pointsBar');
    if (puntosBar) puntosBar.style.width = Math.min(100, Math.round((Number(session.puntos || 0) / 1500) * 100)) + '%';

    const movimientos = $('#puntosMovimientos');
    if (movimientos) {
      movimientos.innerHTML = D.puntos.movimientos.map((m) => '<div class="summary-row">' +
        '<span>' + m.detalle + ' · ' + m.fecha + '</span>' +
        '<strong style="color:' + (m.valor > 0 ? 'var(--green)' : 'var(--pink)') + '">' + (m.valor > 0 ? '+' : '') + m.valor + ' pts</strong></div>').join('');
    }

    // Historial
    const historial = $('#historialBody');
    if (historial) {
      historial.innerHTML = D.historial.map((h) => '<tr>' +
        '<td class="strong">' + h.fecha + '</td><td>' + h.equipo + '</td><td>' + h.horas + ' h</td>' +
        '<td>' + fmt(h.kiosco) + '</td><td>' + (h.impresiones ? fmt(h.impresiones) : '—') + '</td>' +
        '<td class="strong">' + fmt(h.total) + '</td>' +
        '<td><span class="status-pill status--' + h.estado.toLowerCase() + '">' + h.estado + '</span></td></tr>').join('');
    }

    // Perfil
    const profileName = $('#profileName');
    const profileEmail = $('#profileEmail');
    if (profileName) profileName.value = session.nombre;
    if (profileEmail) profileEmail.value = session.email;

    const profileForm = $('#profileForm');
    if (profileForm) {
      profileForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const nombre = profileName.value.trim();
        const email = profileEmail.value.trim();
        if (nombre.length < 3 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          toast('Revisá tu nombre y correo electrónico.', 'error');
          return;
        }
        const updated = Object.assign({}, session, { nombre: nombre, email: email });
        setSession(updated);
        paintUser(updated);
        toast('Datos de perfil actualizados.', 'success');
      });
    }

    // Acciones de la sesión activa
    $$('[data-accion-demo]').forEach((btn) => {
      btn.addEventListener('click', () => {
        toast(btn.dataset.accionDemo, 'info');
      });
    });
  }

  /* ----------------------------- Global ---------------------------------- */
  function initGlobal() {
    document.addEventListener('click', (event) => {
      const toastBtn = event.target.closest('[data-toast]');
      if (toastBtn) {
        event.preventDefault();
        toast(toastBtn.dataset.toast, toastBtn.dataset.toastType || 'info');
      }
      const logout = event.target.closest('[data-logout]');
      if (logout) {
        event.preventDefault();
        store.remove(STORAGE.session);
        toast('Sesión cerrada. ¡Hasta la próxima!', 'info');
        setTimeout(() => { location.href = 'index.html'; }, 600);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initHeader();
    initGlobal();
    const page = document.body.dataset.page;
    if (page === 'home') initLanding();
    if (page === 'availability') initAvailability();
    if (page === 'login') initLogin();
    if (page === 'account') initAccount();
    initReveal();
  });
})();

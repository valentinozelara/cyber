/* ==========================================================================
   CYBER 24 HORAS — Panel de empleados (prototipo, sin backend)
   ========================================================================== */
(function () {
  'use strict';

  const D = window.PanelData;
  if (!D) return;

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const fmt = (n) => '$ ' + Number(n).toLocaleString('es-AR');
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const icon = (name, cls) => '<svg class="icon ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + name + '"></use></svg>';
  const pad = (n) => String(n).padStart(2, '0');
  const nowHM = () => { const d = new Date(); return pad(d.getHours()) + ':' + pad(d.getMinutes()); };
  const initials = (name) => String(name || '').split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
  const firstName = (name) => String(name || '').split(/\s+/)[0] || name;
  const norm = (v) => String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const fmtMin = (m) => {
    const n = Math.max(0, Number(m) || 0);
    if (n < 60) return n + ' min';
    return Math.floor(n / 60) + ' h' + (n % 60 ? ' ' + (n % 60) + ' min' : '');
  };
  const TONES = { green: 'var(--green)', cyan: 'var(--cyan)', violet: 'var(--violet)', pink: 'var(--pink)', amber: 'var(--amber)', red: 'var(--red)', gray: 'var(--gray)' };
  const STATE_LABEL = { disponible: 'Disponible', reservado: 'Reservado', ocupado: 'Ocupado', mantenimiento: 'Mantenimiento' };

  const SESSION_KEY = 'cyber24_panel_session';
  const store = {
    get(key, fallback) { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* modo privado */ } },
    remove(key) { try { localStorage.removeItem(key); } catch (e) { /* modo privado */ } }
  };

  const SECTIONS = {
    resumen: { title: 'Resumen', sub: 'Estado general del local y del turno.', icon: 'layout-dashboard' },
    mapa: { title: 'Mapa y equipos', sub: 'Estado en vivo de las 32 estaciones del local.', icon: 'monitor' },
    reservas: { title: 'Reservas del día', sub: 'Llegadas, tolerancia de 15 minutos y check-in.', icon: 'calendar' },
    caja: { title: 'Caja y tiempo', sub: 'Pagos, extensiones y movimientos del turno.', icon: 'wallet' },
    kiosco: { title: 'Kiosco', sub: 'Pedidos en curso, stock y ventas de mostrador.', icon: 'package' },
    impresiones: { title: 'Impresiones', sub: 'Cola de trabajos y entregas de la zona oficina.', icon: 'printer' },
    clientes: { title: 'Clientes', sub: 'Fichas, historial y valor de cada cliente.', icon: 'users' },
    mensajes: { title: 'Mensajes', sub: 'Avisos a las pantallas de los equipos.', icon: 'message-square' },
    reportes: { title: 'Reportes', sub: 'Ingresos, ocupación y mezcla de servicio.', icon: 'bar-chart' }
  };

  const state = {
    section: 'resumen',
    equipos: D.equipos.map((e) => Object.assign({}, e)),
    reservas: D.reservas.map((r) => Object.assign({}, r)),
    pagos: D.pagos.map((p) => Object.assign({}, p)),
    kiosco: D.kiosco.map((k) => Object.assign({}, k)),
    pedidos: D.pedidos.map((p) => Object.assign({}, p)),
    impresiones: D.impresiones.map((p) => Object.assign({}, p)),
    mensajes: D.mensajes.map((m) => Object.assign({}, m)),
    clientes: D.clientes.map((c) => Object.assign({}, c)),
    mapZone: 'todas',
    mapState: 'todos',
    mapSearch: '',
    cashAmount: 2500,
    cashConcept: 'Hora adicional',
    msgTemplate: null,
    reportRange: 'semana'
  };

  /* ---------------------------- Feedback ---------------------------------- */
  function toast(message, type) {
    const root = $('#panelToasts');
    if (!root) return;
    const el = document.createElement('div');
    const kind = type || 'success';
    const tone = kind === 'error' ? 'alert-triangle' : kind === 'info' ? 'info' : 'check-circle';
    el.className = 'toast toast--' + kind;
    el.innerHTML = icon(tone, 'toast-icon') + '<div>' + esc(message) + '</div>';
    root.appendChild(el);
    requestAnimationFrame(() => el.classList.add('is-visible'));
    setTimeout(() => {
      el.classList.remove('is-visible');
      setTimeout(() => el.remove(), 320);
    }, 3600);
  }

  function openModal(opts) {
    const root = $('#panelModalRoot');
    root.innerHTML =
      '<div class="modal-backdrop" id="panelModalBackdrop">' +
        '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="panelModalTitle">' +
          '<div class="modal-head">' +
            '<div><h2 id="panelModalTitle">' + esc(opts.title) + '</h2>' +
            (opts.subtitle ? '<p>' + esc(opts.subtitle) + '</p>' : '') + '</div>' +
            '<button type="button" class="modal-close" data-action="close-modal" aria-label="Cerrar">' + icon('x') + '</button>' +
          '</div>' +
          '<div class="modal-body">' + (opts.body || '') + '</div>' +
          (opts.actions ? '<div class="modal-actions">' + opts.actions + '</div>' : '') +
        '</div>' +
      '</div>';
    const backdrop = $('#panelModalBackdrop');
    requestAnimationFrame(() => backdrop.classList.add('is-open'));
    backdrop.addEventListener('mousedown', (ev) => { if (ev.target === backdrop) closeModal(); });
    document.body.classList.add('panel-locked');
    if (opts.onOpen) opts.onOpen(backdrop);
    return backdrop;
  }

  function closeModal() {
    const backdrop = $('#panelModalBackdrop');
    if (!backdrop) return;
    backdrop.classList.remove('is-open');
    if (!($('#panelDrawer') && $('#panelDrawer').classList.contains('is-open'))) document.body.classList.remove('panel-locked');
    setTimeout(() => { const root = $('#panelModalRoot'); if (root) root.innerHTML = ''; }, 240);
  }

  function ensureDrawer() {
    if ($('#panelDrawer')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML =
      '<div class="drawer-backdrop" id="drawerBackdrop"></div>' +
      '<aside class="panel-drawer" id="panelDrawer" aria-hidden="true" aria-label="Detalle">' +
        '<div class="drawer-head">' +
          '<div><h2 id="drawerTitle"></h2><p id="drawerSub"></p></div>' +
          '<button type="button" class="drawer-close" data-action="close-drawer" aria-label="Cerrar">' + icon('x') + '</button>' +
        '</div>' +
        '<div class="drawer-body" id="drawerBody"></div>' +
        '<div class="drawer-foot" id="drawerFoot"></div>' +
      '</aside>';
    document.body.appendChild(wrap);
    $('#drawerBackdrop').addEventListener('click', closeDrawer);
  }

  function openDrawer(opts) {
    ensureDrawer();
    $('#drawerTitle').textContent = opts.title || '';
    $('#drawerSub').textContent = opts.sub || '';
    $('#drawerBody').innerHTML = opts.body || '';
    $('#drawerFoot').innerHTML = opts.foot || '';
    const drawer = $('#panelDrawer');
    drawer.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    $('#drawerBackdrop').classList.add('is-open');
    document.body.classList.add('panel-locked');
  }

  function closeDrawer() {
    const drawer = $('#panelDrawer');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    $('#drawerBackdrop').classList.remove('is-open');
    if (!$('#panelModalBackdrop.is-open')) document.body.classList.remove('panel-locked');
  }

  /* ---------------------------- Login ------------------------------------- */
  function fillOperator() {
    $$('[data-user-name]').forEach((el) => { el.textContent = D.operador.nombre; });
    $$('[data-user-initials]').forEach((el) => { el.textContent = D.operador.iniciales; });
    $$('[data-user-role]').forEach((el) => { el.textContent = D.operador.rol + ' · Turno noche'; });
    $$('[data-shift]').forEach((el) => { el.textContent = 'Turno noche'; });
  }

  function enterPanel(remember) {
    $('#panelLogin').hidden = true;
    $('#panelApp').hidden = false;
    document.body.classList.remove('panel-login-open');
    fillOperator();
    setSection('resumen');
    startClock();
    if (remember !== false) store.set(SESSION_KEY, { email: D.operador.email, nombre: D.operador.nombre, at: Date.now() });
    setTimeout(() => { const main = $('#panelContent'); if (main) main.focus({ preventScroll: true }); }, 60);
  }

  function exitPanel() {
    store.remove(SESSION_KEY);
    closeDrawer();
    closeModal();
    $('#panelApp').hidden = true;
    $('#panelLogin').hidden = false;
    document.body.classList.add('panel-login-open');
    toast('Sesión cerrada. Buen descanso.', 'info');
  }

  function initLogin() {
    const form = $('#panelLoginForm');
    const error = $('#panelLoginError');
    const email = $('#panelEmail');
    const pass = $('#panelPassword');

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const mail = email.value.trim().toLowerCase();
      const pwd = pass.value;
      if (!mail || !pwd) {
        error.textContent = 'Completá tu correo laboral y contraseña.';
        error.classList.add('is-visible');
        return;
      }
      if (mail === D.operador.email && pwd === D.operador.password) {
        error.classList.remove('is-visible');
        enterPanel(true);
        toast('Bienvenida, ' + firstName(D.operador.nombre) + '. Turno iniciado.', 'success');
      } else {
        error.textContent = 'Credenciales incorrectas. Usá el acceso demo si estás probando el prototipo.';
        error.classList.add('is-visible');
      }
    });

    $('#panelDemoBtn').addEventListener('click', () => {
      email.value = D.operador.email;
      pass.value = D.operador.password;
      error.classList.remove('is-visible');
      enterPanel(true);
      toast('Turno demo iniciado. Todos los datos son de ejemplo.', 'info');
    });

    $('#panelPassToggle').addEventListener('click', () => {
      const show = pass.type === 'password';
      pass.type = show ? 'text' : 'password';
      $('#panelPassToggle').innerHTML = icon(show ? 'eye-off' : 'eye');
      $('#panelPassToggle').setAttribute('aria-label', show ? 'Ocultar contraseña' : 'Mostrar contraseña');
    });

    $('#panelLogout').addEventListener('click', exitPanel);

    const session = store.get(SESSION_KEY, null);
    if (session) enterPanel(false);
    else document.body.classList.add('panel-login-open');
  }

  /* ---------------------------- Shell ------------------------------------- */
  function startClock() {
    const timeEl = $('#panelTime');
    const dateEl = $('#panelDate');
    if (!timeEl) return;
    const update = () => {
      const d = new Date();
      timeEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes());
      dateEl.textContent = d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).replace('.', '').toUpperCase();
    };
    update();
    if (!startClock.timer) startClock.timer = setInterval(update, 15000);
  }

  function setSection(name) {
    if (!SECTIONS[name]) return;
    state.section = name;
    $$('.panel-nav-item').forEach((btn) => btn.classList.toggle('is-active', btn.dataset.section === name));
    $('#panelTitle').textContent = SECTIONS[name].title;
    $('#panelSubtitle').textContent = SECTIONS[name].sub;
    render();
    closeSidebar();
    window.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
  }

  function render() {
    const content = $('#panelContent');
    if (!content) return;
    const views = { resumen: viewResumen, mapa: viewMapa, reservas: viewReservas, caja: viewCaja, kiosco: viewKiosco, impresiones: viewImpresiones, clientes: viewClientes, mensajes: viewMensajes, reportes: viewReportes };
    content.innerHTML = views[state.section]();
    updateBadges();
  }

  function updateBadges() {
    const counts = {
      mapa: state.equipos.length,
      reservas: state.reservas.filter((r) => r.estado === 'Confirmada' || r.estado === 'En gracia').length,
      kiosco: state.pedidos.filter((p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado').length,
      impresiones: state.impresiones.filter((p) => p.estado !== 'Retirado').length
    };
    Object.entries(counts).forEach(([key, value]) => {
      $$('[data-nav-count="' + key + '"]').forEach((el) => { el.textContent = value; });
    });
  }

  function openSidebar() {
    $('#panelSidebar').classList.add('is-open');
    $('#panelScrim').classList.add('is-open');
    $('#panelMenuBtn').setAttribute('aria-expanded', 'true');
  }

  function closeSidebar() {
    $('#panelSidebar').classList.remove('is-open');
    $('#panelScrim').classList.remove('is-open');
    $('#panelMenuBtn').setAttribute('aria-expanded', 'false');
  }

  function initShell() {
    $('#panelMenuBtn').addEventListener('click', () => {
      if ($('#panelSidebar').classList.contains('is-open')) closeSidebar(); else openSidebar();
    });
    $('#panelScrim').addEventListener('click', closeSidebar);
    $$('.panel-nav-item').forEach((btn) => {
      btn.addEventListener('click', () => setSection(btn.dataset.section));
    });
    $('#panelAlertsBtn').addEventListener('click', () => {
      const low = lowStock();
      const expiring = expiringSoon();
      if (!low.length && !expiring.length) {
        toast('Sin alertas pendientes. Todo el local está en orden.', 'success');
        return;
      }
      openModal({
        title: 'Alertas del turno',
        subtitle: low.length + ' de stock · ' + expiring.length + ' sesiones por terminar',
        body:
          (expiring.length ? '<p class="detail-section-title">Sesiones por terminar</p><div class="state-actions" style="grid-template-columns:1fr;gap:6px">' +
            expiring.map((eq) => '<div class="expiring-item"><span class="expiring-id">' + eq.id + '</span><div class="expiring-copy"><strong>' + esc(eq.cliente) + '</strong><span>' + esc(eq.zona) + '</span></div><span class="expiring-time">' + eq.restante + '<small>min</small></span></div>').join('') + '</div>' : '') +
          (low.length ? '<p class="detail-section-title">Stock bajo</p><div>' + low.map((k) => '<div class="stock-alert-item">' + icon('alert-triangle') + '<strong>' + esc(k.nombre) + '</strong><span>' + k.stock + ' / mín. ' + k.minimo + '</span></div>').join('') + '</div>' : ''),
        actions: '<button type="button" class="btn btn-ghost" data-action="close-modal">Cerrar</button><button type="button" class="btn btn-primary" data-action="goto" data-section="kiosco">Ir al kiosco</button>'
      });
    });
  }

  /* ---------------------------- Helpers de datos -------------------------- */
  function equiposOf(zone) { return state.equipos.filter((e) => zone === 'todas' || e.zona === zone); }
  function lowStock() { return state.kiosco.filter((k) => k.stock <= k.minimo); }
  function expiringSoon() { return state.equipos.filter((e) => e.estado === 'ocupado' && typeof e.restante === 'number' && e.restante <= 30).sort((a, b) => a.restante - b.restante); }
  function cashTotals() {
    const total = state.pagos.reduce((s, p) => s + Number(p.monto || 0), 0);
    const efectivo = state.pagos.filter((p) => p.medio === 'Efectivo').reduce((s, p) => s + Number(p.monto || 0), 0);
    return { total, efectivo, digital: total - efectivo };
  }
  function nextId(prefix, list) {
    const nums = list.map((item) => parseInt(String(item.id).replace(/\D/g, ''), 10) || 0);
    return prefix + '-' + (Math.max(0, ...nums) + 1);
  }

  /* ---------------------------- Resumen ----------------------------------- */
  function kpiCard(label, value, foot, iconName, tone) {
    return '<div class="kpi-card" style="--kpi-tone:' + (tone || TONES.cyan) + '">' +
      '<div class="kpi-top"><span class="kpi-label">' + esc(label) + '</span><span class="kpi-icon">' + icon(iconName) + '</span></div>' +
      '<div class="kpi-value">' + value + '</div>' +
      '<div class="kpi-foot">' + foot + '</div>' +
    '</div>';
  }

  function miniMapMarkup() {
    return '<div class="mini-map">' + state.equipos.map((eq) =>
      '<button type="button" class="mini-eq st--' + eq.estado + '" data-action="equip" data-id="' + eq.id + '" title="' + eq.id + ' · ' + STATE_LABEL[eq.estado] + (eq.cliente ? ' · ' + esc(eq.cliente) : '') + '">' + eq.id + '</button>'
    ).join('') + '</div>' +
    '<div class="mini-legend">' +
      '<span><i style="--c:var(--green)"></i>Libre</span>' +
      '<span><i style="--c:var(--amber)"></i>Reservado</span>' +
      '<span><i style="--c:var(--red)"></i>En sesión</span>' +
      '<span><i style="--c:var(--gray)"></i>Mantenimiento</span>' +
    '</div>';
  }

  function viewResumen() {
    const ocupados = state.equipos.filter((e) => e.estado === 'ocupado');
    const reservados = state.equipos.filter((e) => e.estado === 'reservado');
    const disponibles = state.equipos.filter((e) => e.estado === 'disponible');
    const mantenimiento = state.equipos.filter((e) => e.estado === 'mantenimiento');
    const reservasHoy = state.reservas.filter((r) => r.estado === 'Confirmada' || r.estado === 'En gracia');
    const { total, efectivo, digital } = cashTotals();
    const low = lowStock();
    const expiring = expiringSoon();
    const pendingOrders = state.pedidos.filter((p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado');
    const proximas = reservasHoy.slice().sort((a, b) => a.hora.localeCompare(b.hora)).slice(0, 3);

    const sessions = (expiring.length ? expiring : ocupados.sort((a, b) => a.restante - b.restante)).slice(0, 4);

    return '' +
      '<div class="kpi-grid">' +
        kpiCard('Ingresos del turno', fmt(total), icon('arrow-up-right') + '<span class="up">Turno noche</span>', 'wallet', TONES.green) +
        kpiCard('Equipos en sesión', ocupados.length + '<small> / ' + state.equipos.length + '</small>', '<span class="up">' + disponibles.length + '</span> libres · ' + reservados.length + ' reservados', 'monitor', TONES.cyan) +
        kpiCard('Reservas activas', String(reservasHoy.length), 'Tolerancia de 15 min', 'calendar', TONES.violet) +
        kpiCard('Alertas de stock', String(low.length), low.length ? '<span class="down">Requiere reposición</span>' : 'Todo abastecido', 'package', low.length ? TONES.amber : TONES.green) +
      '</div>' +

      '<div class="panel-grid panel-grid--2">' +
        '<section class="panel-card">' +
          '<div class="panel-card-head"><div><h3>' + icon('monitor') + 'Mapa rápido del local</h3><p>' + disponibles.length + ' libres · ' + ocupados.length + ' en sesión · ' + reservados.length + ' reservados · ' + mantenimiento.length + ' en mantenimiento</p></div>' +
            '<button type="button" class="link-arrow" data-action="goto" data-section="mapa">Abrir mapa' + icon('arrow-right') + '</button></div>' +
          '<div class="panel-card-body">' + miniMapMarkup() +
            '<div class="panel-note" style="margin-top:14px">' + icon('info') + '<span>Los equipos se actualizan desde el mapa operativo. Tocá una estación para ver el detalle, extender tiempo o liberarla.</span></div>' +
          '</div>' +
        '</section>' +

        '<section class="panel-card">' +
          '<div class="panel-card-head"><div><h3>' + icon('clock') + 'Sesiones por terminar</h3><p>Ordenadas por tiempo restante</p></div><span class="pill pill--amber">' + expiring.length + ' en alerta</span></div>' +
          '<div class="panel-card-body">' +
            (sessions.length ? sessions.map((eq) =>
              '<div class="expiring-item"><span class="expiring-id">' + eq.id + '</span>' +
                '<div class="expiring-copy"><strong>' + esc(eq.cliente || 'Sin cliente') + '</strong><span>' + esc(eq.zona) + ' · ' + esc(eq.specs.split(' · ')[0]) + '</span></div>' +
                '<span class="expiring-time">' + (eq.restante != null ? eq.restante + '<small>min</small>' : '—') + '</span>' +
                '<button type="button" class="btn btn-ghost btn-sm" data-action="extend" data-id="' + eq.id + '">+' + icon('plus') + '</button>' +
              '</div>'
            ).join('') : '<div class="panel-empty">' + icon('check-circle') + '<strong>Sin sesiones urgentes</strong><span>Todas las sesiones tienen margen suficiente.</span></div>') +
            '<div class="panel-note" style="margin-top:14px">' + icon('clock') + '<span>Las sesiones con 30 minutos o menos se resaltan para ofrecer la extensión antes de que el equipo se bloquee.</span></div>' +
            '<p class="detail-section-title">Próximas llegadas</p>' +
            (proximas.length ? proximas.map((r) =>
              '<div class="expiring-item"><span class="arrival-id">' + esc(r.hora) + '</span>' +
                '<div class="expiring-copy"><strong>' + esc(r.cliente) + '</strong><span>' + r.equipo + ' · ' + r.duracion + ' h · ' + esc(r.origen) + '</span></div>' +
                '<span class="pill pill--cyan">' + esc(r.estado) + '</span>' +
              '</div>'
            ).join('') : '<div class="panel-empty" style="padding:12px">' + icon('calendar') + '<strong>Sin llegadas pendientes</strong><span>La agenda del día está completa.</span></div>') +
            '<button type="button" class="link-arrow" style="margin-top:12px" data-action="goto" data-section="reservas">Ver la agenda completa' + icon('arrow-right') + '</button>' +
          '</div>' +
        '</section>' +
      '</div>' +

      '<div class="panel-grid panel-grid--2" style="margin-top:16px">' +
        '<section class="panel-card">' +
          '<div class="panel-card-head"><div><h3>' + icon('history') + 'Actividad reciente</h3><p>Últimos movimientos del local</p></div><span class="live-indicator"><span class="live-dot"></span> En vivo</span></div>' +
          '<div class="panel-card-body"><div class="activity-list">' +
            D.actividad.slice(0, 7).map((a) =>
              '<div class="activity-item"><span class="activity-icon" style="--tone:' + (TONES[a.tono] || TONES.cyan) + '">' + icon(a.icono) + '</span>' +
                '<div class="activity-copy"><strong>' + esc(a.titulo) + '</strong><span>' + esc(a.detalle) + '</span></div>' +
                '<span class="activity-time">' + esc(a.hora) + '</span>' +
              '</div>'
            ).join('') +
          '</div></div>' +
        '</section>' +

        '<div class="panel-stack">' +
          '<section class="panel-card">' +
            '<div class="panel-card-head"><div><h3>' + icon('banknote') + 'Caja del turno</h3><p>Desde las 22:00</p></div><button type="button" class="link-arrow" data-action="goto" data-section="caja">Ver caja' + icon('arrow-right') + '</button></div>' +
            '<div class="panel-card-body"><div class="cash-summary" style="grid-template-columns:1fr 1fr">' +
              '<div class="cash-box"><span>Efectivo</span><strong>' + fmt(efectivo) + '</strong></div>' +
              '<div class="cash-box cash-box--total"><span>Total</span><strong>' + fmt(total) + '</strong></div>' +
            '</div><div class="kpi-foot" style="margin-top:10px">' + icon('credit-card') + 'Digital y puntos: <strong>' + fmt(digital) + '</strong></div></div>' +
          '</section>' +
          '<section class="panel-card">' +
            '<div class="panel-card-head"><div><h3>' + icon('alert-triangle') + 'Stock bajo</h3><p>Reponer antes del cierre</p></div>' +
              (low.length ? '<span class="pill pill--red">' + low.length + '</span>' : '<span class="pill pill--green">OK</span>') + '</div>' +
            '<div class="panel-card-body">' +
              (low.length ? low.map((k) => '<div class="stock-alert-item">' + icon('package') + '<strong>' + esc(k.nombre) + '</strong><span>' + k.stock + ' / mín. ' + k.minimo + '</span></div>').join('') : '<div class="panel-empty" style="padding:12px">' + icon('check-circle') + '<strong>Sin faltantes</strong></div>') +
              (pendingOrders.length ? '<div class="panel-note" style="margin-top:10px">' + icon('shopping-cart') + '<span>' + pendingOrders.length + ' pedido(s) de kiosco sin entregar. <button type="button" class="link-arrow" style="font-size:.72rem" data-action="goto" data-section="kiosco">Ver pedidos</button></span></div>' : '') +
            '</div>' +
          '</section>' +
        '</div>' +
      '</div>' +

      '<div class="panel-note" style="margin-top:16px">' + icon('shield-check') +
        '<span><strong>Rol Empleado:</strong> gestión operativa del turno. La configuración de tarifas, usuarios y permisos corresponde al panel de administrador.</span></div>';
  }

  /* ---------------------------- Mapa -------------------------------------- */
  const ZONAS = ['Zona Pro', 'Zona Oficina', 'Consolas'];
  const ZONE_FILTERS = [
    { id: 'todas', label: 'Todos' },
    { id: 'Zona Pro', label: 'Gaming' },
    { id: 'Zona Oficina', label: 'Oficina' },
    { id: 'Consolas', label: 'Consolas' }
  ];
  const STATE_FILTERS = [
    { id: 'todos', label: 'Todos' },
    { id: 'disponible', label: 'Libres' },
    { id: 'ocupado', label: 'En sesión' },
    { id: 'reservado', label: 'Reservados' },
    { id: 'mantenimiento', label: 'Mantenimiento' }
  ];

  function zoneIcon(zone) {
    if (zone === 'Consolas') return 'gamepad';
    if (zone === 'Zona Oficina') return 'briefcase';
    return 'monitor';
  }

  function equipCard(eq) {
    const meta = eq.estado === 'ocupado'
      ? '<span class="pe-meta' + (eq.restante <= 30 ? ' pe-meta--warn' : '') + '">' + icon('clock') + 'Quedan ' + fmtMin(eq.restante) + '</span>'
      : eq.estado === 'reservado'
        ? '<span class="pe-meta">' + icon('calendar') + (eq.reservaHora ? eq.reservaHora : 'Hoy') + ' · ' + esc(eq.cliente || 'Reserva web') + '</span>'
        : eq.estado === 'mantenimiento'
          ? '<span class="pe-meta">' + icon('alert-triangle') + esc(eq.motivo || 'Fuera de servicio') + '</span>'
          : '<span class="pe-meta">' + icon('tag') + fmt(eq.precio) + ' / hora</span>';
    return '<button type="button" class="panel-equip st--' + eq.estado + '" data-action="equip" data-id="' + eq.id + '">' +
      '<span class="pe-top"><span class="pe-id">' + eq.id + '</span>' + icon(zoneIcon(eq.zona)) + '</span>' +
      '<span class="pe-state">' + STATE_LABEL[eq.estado] + '</span>' +
      '<span class="pe-client">' + esc(eq.cliente || (eq.estado === 'mantenimiento' ? '—' : 'Sin asignar')) + '</span>' +
      meta +
    '</button>';
  }

  function viewMapa() {
    const search = norm(state.mapSearch.trim());
    const match = state.equipos.filter((eq) => {
      const zoneOk = state.mapZone === 'todas' || eq.zona === state.mapZone;
      const stateOk = state.mapState === 'todos' || eq.estado === state.mapState;
      const textOk = !search || norm([eq.id, eq.zona, eq.cliente, eq.specs].join(' ')).includes(search);
      return zoneOk && stateOk && textOk;
    });
    const counts = { disponible: 0, ocupado: 0, reservado: 0, mantenimiento: 0 };
    state.equipos.forEach((e) => { counts[e.estado]++; });

    const toolbar =
      '<div class="map-toolbar">' +
        '<div class="map-toolbar-group">' +
          '<div class="tabs" role="tablist" aria-label="Filtrar por zona">' +
            ZONE_FILTERS.map((z) => '<button type="button" class="tab' + (state.mapZone === z.id ? ' is-active' : '') + '" data-action="map-zone" data-zone="' + z.id + '">' + z.label + '</button>').join('') +
          '</div>' +
          '<div class="map-search">' + icon('search') + '<input type="search" id="mapSearch" placeholder="Buscar equipo o cliente" value="' + esc(state.mapSearch) + '" aria-label="Buscar equipo o cliente"></div>' +
        '</div>' +
        '<div class="map-toolbar-group">' +
          STATE_FILTERS.map((s) => '<button type="button" class="pill' + (state.mapState === s.id ? ' pill--cyan' : '') + '" data-action="map-state" data-state="' + s.id + '" style="cursor:pointer">' + s.label + '</button>').join('') +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="map-reset">' + icon('refresh-cw') + 'Limpiar</button>' +
        '</div>' +
      '</div>';

    const legend =
      '<div class="mini-legend" style="margin:0 0 16px">' +
        '<span><i style="--c:var(--green)"></i>' + counts.disponible + ' libres</span>' +
        '<span><i style="--c:var(--red)"></i>' + counts.ocupado + ' en sesión</span>' +
        '<span><i style="--c:var(--amber)"></i>' + counts.reservado + ' reservados</span>' +
        '<span><i style="--c:var(--gray)"></i>' + counts.mantenimiento + ' mantenimiento</span>' +
        '<span style="margin-left:auto">Mostrando ' + match.length + ' de ' + state.equipos.length + ' equipos</span>' +
      '</div>';

    const zones = ZONAS.filter((z) => state.mapZone === 'todas' || z === state.mapZone).map((z) => {
      const list = match.filter((eq) => eq.zona === z);
      if (!list.length && (state.mapState !== 'todos' || search)) return '';
      return '<section class="panel-zone">' +
        '<div class="panel-zone-head"><h3>' + icon(zoneIcon(z)) + z + '</h3><span>' + list.filter((e) => e.estado === 'disponible').length + ' libres de ' + list.length + '</span></div>' +
        (list.length ? '<div class="panel-equip-grid">' + list.map(equipCard).join('') + '</div>' : '<div class="panel-empty">' + icon('search') + '<strong>Sin equipos con este filtro</strong><span>Probá con otra zona o estado.</span></div>') +
      '</section>';
    }).join('');

    return '<div class="panel-section-head">' +
        '<div><h2>Mapa operativo</h2><p>Tocá un equipo para gestionar la sesión, el estado o el control remoto.</p></div>' +
        '<div class="panel-section-actions">' +
          '<span class="panel-note" style="padding:8px 11px">' + icon('power') + 'Control remoto disponible en equipos en sesión</span>' +
        '</div>' +
      '</div>' +
      toolbar + legend + (zones || '<section class="panel-card"><div class="panel-empty">' + icon('filter') + '<strong>No hay resultados</strong><span>Cambiá los filtros para ver otros equipos.</span></div></section>') +
      '<div class="panel-note" style="margin-top:18px">' + icon('info') +
        '<span>Los cambios de estado impactan en el mapa público y en la disponibilidad de reservas. Los equipos en mantenimiento no aceptan reservas.</span></div>';
  }

  function detailRow(label, value) {
    return '<div class="detail-row"><span>' + esc(label) + '</span><strong>' + value + '</strong></div>';
  }

  function openEquipoDrawer(id) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    const reserva = state.reservas.find((r) => r.equipo === id && (r.estado === 'Confirmada' || r.estado === 'En gracia'));

    const rows = [
      detailRow('Zona', esc(eq.zona)),
      detailRow('Equipo', esc(eq.specs)),
      detailRow('Tarifa', fmt(eq.precio) + ' / hora'),
      detailRow('Estado', '<span class="st st--' + eq.estado + '"><span class="st-label"><span class="st-dot"></span>' + STATE_LABEL[eq.estado] + '</span></span>')
    ];
    if (eq.estado === 'ocupado') {
      rows.push(detailRow('Cliente', esc(eq.cliente || '—')));
      rows.push(detailRow('Tiempo restante', '<span style="color:var(--amber)">' + fmtMin(eq.restante) + '</span>'));
      rows.push(detailRow('Inició', esc(eq.desde || '—')));
    }
    if (eq.estado === 'reservado') {
      rows.push(detailRow('Reserva', esc(eq.reservaHora || '—')));
      rows.push(detailRow('Cliente', esc(eq.cliente || 'Reserva web')));
    }
    if (eq.estado === 'mantenimiento') rows.push(detailRow('Motivo', esc(eq.motivo || 'Service programado')));

    let foot = '';
    if (eq.estado === 'disponible') {
      foot = '<button type="button" class="btn btn-primary" data-action="start-session" data-id="' + eq.id + '">' + icon('play') + 'Iniciar sesión</button>' +
             '<button type="button" class="btn btn-ghost" data-action="set-state" data-id="' + eq.id + '" data-state="mantenimiento">' + icon('alert-triangle') + 'Mantenimiento</button>';
    } else if (eq.estado === 'ocupado') {
      foot = '<button type="button" class="btn btn-primary" data-action="extend" data-id="' + eq.id + '">' + icon('plus') + 'Extender tiempo</button>' +
             '<button type="button" class="btn btn-ghost" data-action="free" data-id="' + eq.id + '">' + icon('check-circle') + 'Cobrar y liberar</button>' +
             '<button type="button" class="btn btn-danger-soft" data-action="set-state" data-id="' + eq.id + '" data-state="mantenimiento">' + icon('alert-triangle') + 'Mantenimiento</button>';
    } else if (eq.estado === 'reservado') {
      foot = '<button type="button" class="btn btn-primary" data-action="checkin" data-id="' + eq.id + '">' + icon('play') + 'Hacer check-in</button>' +
             '<button type="button" class="btn btn-ghost" data-action="release" data-id="' + eq.id + '">' + icon('x') + 'Liberar reserva</button>';
    } else {
      foot = '<button type="button" class="btn btn-primary" data-action="set-state" data-id="' + eq.id + '" data-state="disponible">' + icon('rotate-cw') + 'Marcar disponible</button>';
    }

    const remote = eq.estado !== 'mantenimiento'
      ? '<p class="detail-section-title">Control remoto</p><div class="remote-actions">' +
          '<button type="button" class="btn btn-ghost" data-action="remote" data-id="' + eq.id + '" data-do="reiniciar">' + icon('rotate-cw') + 'Reiniciar</button>' +
          '<button type="button" class="btn btn-ghost" data-action="remote" data-id="' + eq.id + '" data-do="apagar">' + icon('power') + 'Apagar</button>' +
          '<button type="button" class="btn btn-ghost" data-action="remote" data-id="' + eq.id + '" data-do="bloquear">' + icon('lock') + 'Bloquear</button>' +
        '</div>'
      : '';

    const quick = '<p class="detail-section-title">Cambiar estado</p><div class="state-actions">' +
      ['disponible', 'reservado', 'ocupado', 'mantenimiento'].map((st) =>
        '<button type="button" class="btn btn-ghost' + (eq.estado === st ? ' is-current' : '') + '" data-action="set-state" data-id="' + eq.id + '" data-state="' + st + '">' + STATE_LABEL[st] + '</button>'
      ).join('') + '</div>';

    openDrawer({
      title: eq.id + ' · ' + eq.zona,
      sub: eq.estado === 'ocupado' ? 'Sesión en curso de ' + (eq.cliente || 'cliente') : STATE_LABEL[eq.estado] + ' · ' + fmt(eq.precio) + '/h',
      body: '<div class="detail-state st--' + eq.estado + '"><span class="st-dot"></span><div><strong>' + STATE_LABEL[eq.estado] + '</strong><span>' + esc(eq.specs) + '</span></div></div>' +
        '<div class="detail-list">' + rows.join('') + '</div>' +
        (reserva ? '<p class="detail-section-title">Reserva asociada</p><div class="panel-note">' + icon('calendar') + '<span>' + esc(reserva.cliente) + ' · ' + esc(reserva.hora) + ' · ' + reserva.duracion + ' h · ' + fmt(reserva.total) + '</span></div>' : '') +
        remote + quick,
      foot: foot
    });
  }

  function promptExtend(id) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    openModal({
      title: 'Extender sesión · ' + eq.id,
      subtitle: (eq.cliente || 'Cliente') + ' · quedan ' + fmtMin(eq.restante),
      body:
        '<div class="modal-form">' +
          '<div class="field"><label for="extHours">Tiempo adicional</label><select id="extHours">' +
            '<option value="1">1 hora · ' + fmt(eq.precio) + '</option>' +
            '<option value="2">2 horas · ' + fmt(eq.precio * 2) + '</option>' +
            '<option value="3">3 horas (pack -10%) · ' + fmt(Math.round(eq.precio * 3 * 0.9)) + '</option>' +
          '</select></div>' +
          '<div class="field"><label for="extPay">Medio de pago</label><select id="extPay"><option>Efectivo</option><option>Digital</option><option>Puntos</option></select></div>' +
          '<div class="modal-summary"><div><span>Total a cobrar</span><strong id="extTotal">' + fmt(eq.precio) + '</strong></div></div>' +
        '</div>',
      actions: '<button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>' +
        '<button type="button" class="btn btn-primary" data-action="confirm-extend" data-id="' + eq.id + '">Confirmar y cobrar</button>',
      onOpen: (root) => {
        $('#extHours', root).addEventListener('change', (ev) => {
          const h = Number(ev.target.value);
          const total = h >= 3 ? Math.round(eq.precio * h * 0.9) : eq.precio * h;
          $('#extTotal', root).textContent = fmt(total);
        });
      }
    });
  }

  function promptStartSession(id) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    const options = [1, 2, 3, 4].map((h) => {
      const total = h >= 3 ? Math.round(eq.precio * h * 0.9) : eq.precio * h;
      return '<option value="' + h + '">' + h + ' hora' + (h > 1 ? 's' : '') + ' · ' + fmt(total) + (h >= 3 ? ' (pack)' : '') + '</option>';
    }).join('');
    openModal({
      title: 'Iniciar sesión · ' + eq.id,
      subtitle: eq.zona + ' · ' + fmt(eq.precio) + ' por hora',
      body:
        '<div class="modal-form">' +
          '<div class="field"><label for="sessClient">Cliente</label><input type="text" id="sessClient" placeholder="Nombre o documento" autocomplete="off"></div>' +
          '<div class="field"><label for="sessHours">Duración</label><select id="sessHours">' + options + '</select></div>' +
          '<div class="field"><label for="sessPay">Medio de pago</label><select id="sessPay"><option>Efectivo</option><option>Digital</option><option>Puntos</option></select></div>' +
          '<div class="modal-summary"><div><span>Equipo</span><strong>' + eq.id + '</strong></div><div><span>Total</span><strong id="sessTotal">' + fmt(eq.precio) + '</strong></div></div>' +
        '</div>',
      actions: '<button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>' +
        '<button type="button" class="btn btn-primary" data-action="confirm-session" data-id="' + eq.id + '">Iniciar y cobrar</button>',
      onOpen: (root) => {
        const sel = $('#sessHours', root);
        sel.addEventListener('change', () => {
          const h = Number(sel.value);
          const total = h >= 3 ? Math.round(eq.precio * h * 0.9) : eq.precio * h;
          $('#sessTotal', root).textContent = fmt(total);
        });
      }
    });
  }

  function promptFree(id) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    openModal({
      title: 'Liberar ' + eq.id,
      subtitle: 'Se cierra la sesión de ' + (eq.cliente || 'el cliente') + '.',
      body: '<div class="modal-form">' +
          '<div class="modal-warning">' + icon('alert-triangle') + '<span>Confirmá que el pago pendiente ya fue registrado en la caja antes de liberar el equipo.</span></div>' +
          '<div class="form-grid" style="margin-top:0">' +
            '<div class="field"><label for="freePay">Medio de pago</label><select id="freePay"><option>Efectivo</option><option>Digital</option><option>Puntos</option></select></div>' +
            '<div class="field"><label for="freeAmount">Monto a cobrar</label><input type="number" id="freeAmount" min="0" step="100" value="' + eq.precio + '"></div>' +
          '</div>' +
          '<div class="modal-summary"><div><span>Equipo</span><strong>' + eq.id + '</strong></div><div><span>Cliente</span><strong>' + esc(eq.cliente || '—') + '</strong></div></div>' +
        '</div>',
      actions: '<button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>' +
        '<button type="button" class="btn btn-primary" data-action="confirm-free" data-id="' + eq.id + '">Cobrar y liberar</button>'
    });
  }

  function promptRemote(id, action) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    const labels = { reiniciar: 'Reiniciar equipo', apagar: 'Apagar equipo', bloquear: 'Bloquear por mantenimiento' };
    const ocupado = eq.estado === 'ocupado';
    const destino = action === 'bloquear' ? 'en mantenimiento' : 'disponible';
    const warning = ocupado
      ? 'Hay una sesión activa de <strong>' + esc(eq.cliente || 'un cliente') + '</strong>. Si continuás, la sesión se cierra, se registra el cierre y ' + eq.id + ' queda ' + destino + '.'
      : action === 'bloquear'
        ? eq.id + ' pasa a mantenimiento y deja de aceptar reservas hasta que lo liberes.'
        : 'El equipo no tiene una sesión activa. Se enviará el comando remoto y quedará ' + destino + '.';

    openModal({
      title: labels[action] + ' · ' + eq.id,
      subtitle: eq.zona + ' · ' + STATE_LABEL[eq.estado],
      body: '<div class="modal-form">' +
          '<div class="modal-warning">' + icon('alert-triangle') + '<span>' + warning + '</span></div>' +
          '<div class="modal-summary"><div><span>Equipo</span><strong>' + eq.id + '</strong></div><div><span>Estado resultante</span><strong>' + (action === 'bloquear' ? 'Mantenimiento' : 'Disponible') + '</strong></div></div>' +
        '</div>',
      actions: '<button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>' +
        '<button type="button" class="btn btn-primary" data-action="confirm-remote" data-id="' + eq.id + '" data-do="' + action + '">Sí, continuar</button>'
    });
  }

  function applyRemote(id, action) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    const wasOccupied = eq.estado === 'ocupado';
    if (action === 'bloquear') {
      eq.estado = 'mantenimiento';
      eq.motivo = 'Bloqueo remoto';
    } else {
      eq.estado = 'disponible';
    }
    delete eq.cliente; delete eq.restante; delete eq.desde; delete eq.reservaHora;
    if (action !== 'bloquear') delete eq.motivo;
    state.reservas.forEach((r) => { if (r.equipo === id && (r.estado === 'Confirmada' || r.estado === 'En gracia')) r.estado = 'Cancelada'; });
    D.actividad.unshift({ icono: action === 'bloquear' ? 'lock' : action === 'apagar' ? 'power' : 'rotate-cw', tono: action === 'bloquear' ? 'amber' : 'red', titulo: action === 'bloquear' ? 'Equipo bloqueado por mantenimiento' : 'Comando remoto ejecutado', detalle: id + ' · ' + (wasOccupied ? 'sesión cerrada' : 'equipo libre'), hora: 'Ahora' });
    closeModal();
    closeDrawer();
    render();
    toast(labelsRemote[action] + ' en ' + id + '. ' + (wasOccupied ? 'La sesión se cerró y quedó registrada.' : ''), action === 'bloquear' ? 'info' : 'success');
  }

  const labelsRemote = { reiniciar: 'Equipo reiniciado', apagar: 'Equipo apagado', bloquear: 'Equipo bloqueado' };

  /* ---------------------------- Reservas ---------------------------------- */
  function reservaPill(estado) {
    const map = { Confirmada: 'green', 'En gracia': 'amber', Finalizada: 'violet', Cancelada: 'red', 'No asistió': 'red' };
    return '<span class="pill pill--' + (map[estado] || 'cyan') + '">' + esc(estado) + '</span>';
  }

  function viewReservas() {
    const list = state.reservas.slice().sort((a, b) => a.hora.localeCompare(b.hora));
    const activas = list.filter((r) => r.estado === 'Confirmada' || r.estado === 'En gracia');
    const total = activas.reduce((s, r) => s + Number(r.total || 0), 0);

    const items = list.map((r) => {
      const eq = state.equipos.find((e) => e.id === r.equipo);
      const actions = (r.estado === 'Confirmada' || r.estado === 'En gracia')
        ? '<button type="button" class="btn btn-primary btn-sm" data-action="res-checkin" data-id="' + r.id + '">' + icon('play') + 'Check-in</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="res-noshow" data-id="' + r.id + '">' + icon('x') + 'No asistió</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="res-cancel" data-id="' + r.id + '">Cancelar</button>'
        : '<button type="button" class="btn btn-ghost btn-sm" data-action="goto" data-section="mapa">' + icon('monitor') + 'Ver equipo</button>';

      return '<div class="res-item' + (r.estado === 'En gracia' ? ' res-item--reserved' : '') + '">' +
        '<div class="res-time"><strong>' + esc(r.hora) + '</strong><span>Hoy</span></div>' +
        '<div class="res-copy"><strong>' + esc(r.cliente) + '</strong>' +
          '<span>' + r.equipo + ' · ' + esc(eq ? eq.zona : 'Equipo') + ' · ' + r.duracion + ' h · ' + esc(r.origen) + ' · ' + esc(r.telefono) + '</span>' +
          '<div class="res-tags">' + reservaPill(r.estado) + '<span class="pill">' + r.id + '</span><span class="pill">' + fmt(r.total) + '</span>' +
          (r.estado === 'En gracia' ? '<span class="pill pill--amber">Tolerancia 15 min</span>' : '') + '</div>' +
        '</div>' +
        '<div class="res-actions">' + actions + '</div>' +
      '</div>';
    }).join('');

    return '<div class="panel-section-head">' +
        '<div><h2>Reservas del día</h2><p>La reserva se mantiene 15 minutos después del horario. Pasado ese plazo, el equipo se libera.</p></div>' +
        '<div class="panel-section-actions">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="res-export">' + icon('download') + 'Exportar lista</button>' +
          '<button type="button" class="btn btn-primary btn-sm" data-action="new-reserva">' + icon('plus') + 'Nueva reserva</button>' +
        '</div>' +
      '</div>' +
      '<div class="kpi-grid kpi-grid--3">' +
        kpiCard('Reservas activas', String(activas.length), 'Confirmadas y en gracia', 'calendar', TONES.cyan) +
        kpiCard('Ingreso proyectado', fmt(total), 'Según duración reservada', 'banknote', TONES.green) +
        kpiCard('Check-ins del turno', String(state.reservas.filter((r) => r.estado === 'Finalizada').length), 'Reservas ya utilizadas', 'check-circle', TONES.violet) +
      '</div>' +
      '<section class="panel-card"><div class="panel-card-head"><div><h3>' + icon('calendar') + 'Agenda del día</h3><p>' + list.length + ' reservas registradas</p></div><span class="pill pill--cyan">Ordenadas por horario</span></div>' +
        '<div class="panel-card-body">' + (items ? '<div class="res-list">' + items + '</div>' : '<div class="panel-empty">' + icon('calendar') + '<strong>Sin reservas para hoy</strong><span>Creá una nueva reserva desde el botón superior.</span></div>') + '</div>' +
      '</section>' +
      '<div class="panel-note" style="margin-top:16px">' + icon('info') + '<span>Si el cliente no llega, usá <strong>No asistió</strong> para liberar el equipo y dejar registro. El check-in inicia la sesión y carga el tiempo reservado.</span></div>';
  }

  function promptNewReserva() {
    const libres = state.equipos.filter((e) => e.estado === 'disponible');
    openModal({
      title: 'Nueva reserva',
      subtitle: 'Registrá la reserva tomada por teléfono, web o en el mostrador.',
      body: '<div class="modal-form">' +
          '<div class="field"><label for="nrClient">Cliente</label><input type="text" id="nrClient" placeholder="Nombre y apellido" autocomplete="off"></div>' +
          '<div class="field"><label for="nrPhone">Teléfono</label><input type="tel" id="nrPhone" placeholder="+54 11 ..." autocomplete="off"></div>' +
          '<div class="form-grid" style="margin-top:0">' +
            '<div class="field"><label for="nrEquip">Equipo</label><select id="nrEquip">' + libres.map((e) => '<option value="' + e.id + '">' + e.id + ' · ' + e.zona + '</option>').join('') + '</select></div>' +
            '<div class="field"><label for="nrHour">Hora</label><input type="time" id="nrHour" value="' + nowHM() + '"></div>' +
            '<div class="field"><label for="nrDur">Duración</label><select id="nrDur"><option value="1">1 hora</option><option value="2" selected>2 horas</option><option value="3">3 horas (pack)</option><option value="4">4 horas</option></select></div>' +
            '<div class="field"><label for="nrOrigin">Origen</label><select id="nrOrigin"><option>Mostrador</option><option>Web</option><option>App</option></select></div>' +
          '</div>' +
          '<div class="modal-summary"><div><span>Total estimado</span><strong id="nrTotal">—</strong></div></div>' +
        '</div>',
      actions: '<button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>' +
        '<button type="button" class="btn btn-primary" data-action="confirm-reserva">Confirmar reserva</button>',
      onOpen: (root) => {
        const equip = $('#nrEquip', root);
        const dur = $('#nrDur', root);
        const calc = () => {
          const eq = state.equipos.find((e) => e.id === equip.value);
          const h = Number(dur.value);
          if (!eq) return;
          const total = h >= 3 ? Math.round(eq.precio * h * 0.9) : eq.precio * h;
          $('#nrTotal', root).textContent = fmt(total);
        };
        equip.addEventListener('change', calc);
        dur.addEventListener('change', calc);
        calc();
      }
    });
  }

  /* ---------------------------- Caja -------------------------------------- */
  function viewCaja() {
    const { total, efectivo, digital } = cashTotals();
    const last = state.pagos.slice(0, 5);
    const rows = state.pagos.map((p) =>
      '<tr><td class="muted-cell">' + esc(p.hora) + '</td><td><strong>' + esc(p.cliente) + '</strong></td><td class="muted-cell">' + esc(p.equipo) + '</td>' +
      '<td>' + esc(p.concepto) + '</td><td class="muted-cell">' + esc(p.medio) + '</td><td class="num">' + fmt(p.monto) + '</td></tr>'
    ).join('');

    return '<div class="panel-section-head">' +
        '<div><h2>Caja y tiempo</h2><p>Registrá cobros en efectivo, digital o con puntos. Cada movimiento queda asociado al turno.</p></div>' +
        '<div class="panel-section-actions"><button type="button" class="btn btn-ghost btn-sm" data-action="close-shift">' + icon('check-circle') + 'Cerrar turno</button></div>' +
      '</div>' +
      '<div class="cash-layout">' +
        '<section class="panel-card"><div class="panel-card-head"><div><h3>' + icon('banknote') + 'Registrar cobro</h3><p>Hora adicional, extensión, kiosco o impresión</p></div><span class="pill pill--green">Caja abierta</span></div>' +
          '<div class="panel-card-body"><div class="cash-form">' +
            '<div class="form-grid" style="margin-top:0">' +
              '<div class="field"><label for="cashClient">Cliente</label><input type="text" id="cashClient" placeholder="Nombre o “Mostrador”"></div>' +
              '<div class="field"><label for="cashEquip">Equipo</label><select id="cashEquip"><option>Mostrador</option>' + state.equipos.filter((e) => e.estado === 'ocupado').map((e) => '<option value="' + e.id + '">' + e.id + ' · ' + esc(e.cliente || '') + '</option>').join('') + '</select></div>' +
              '<div class="field"><label for="cashConcept">Concepto</label><select id="cashConcept"><option>Hora adicional</option><option>Extensión de sesión</option><option>Pack 3 horas</option><option>Venta kiosco</option><option>Impresión</option><option>Otro</option></select></div>' +
              '<div class="field"><label for="cashPay">Medio de pago</label><select id="cashPay"><option>Efectivo</option><option>Digital</option><option>Puntos</option></select></div>' +
            '</div>' +
            '<div class="field"><label for="cashAmount">Monto</label><input type="number" id="cashAmount" min="0" step="100" value="' + state.cashAmount + '"></div>' +
            '<div class="quick-amounts">' + [1200, 1600, 2500, 3200, 5000].map((a) => '<button type="button" data-action="cash-amount" data-amount="' + a + '">' + fmt(a) + '</button>').join('') + '</div>' +
            '<div class="cash-preview"><span>Total a registrar</span><strong id="cashPreview">' + fmt(state.cashAmount) + '</strong></div>' +
            '<button type="button" class="btn btn-primary" data-action="cash-submit">' + icon('check') + 'Registrar movimiento</button>' +
          '</div></div>' +
        '</section>' +
        '<div class="panel-stack">' +
          '<section class="panel-card"><div class="panel-card-head"><div><h3>' + icon('wallet') + 'Resumen del turno</h3><p>Turno noche · 22:00 a 06:00</p></div></div>' +
            '<div class="panel-card-body"><div class="cash-summary" style="grid-template-columns:1fr">' +
              '<div class="cash-box"><span>Efectivo</span><strong>' + fmt(efectivo) + '</strong></div>' +
              '<div class="cash-box"><span>Digital / puntos</span><strong>' + fmt(digital) + '</strong></div>' +
              '<div class="cash-box cash-box--total"><span>Total del turno</span><strong>' + fmt(total) + '</strong></div>' +
            '</div></div>' +
          '</section>' +
          '<section class="panel-card"><div class="panel-card-head"><div><h3>' + icon('history') + 'Últimos movimientos</h3><p>' + state.pagos.length + ' registros</p></div></div>' +
            '<div class="panel-card-body"><div class="activity-list">' + last.map((p) =>
              '<div class="activity-item"><span class="activity-icon" style="--tone:' + (p.medio === 'Efectivo' ? TONES.green : TONES.cyan) + '">' + icon(p.medio === 'Efectivo' ? 'banknote' : 'credit-card') + '</span>' +
                '<div class="activity-copy"><strong>' + esc(p.concepto) + '</strong><span>' + esc(p.cliente) + ' · ' + esc(p.equipo) + '</span></div>' +
                '<span class="activity-time">' + esc(p.hora) + '<br>' + fmt(p.monto) + '</span></div>'
            ).join('') + '</div></div>' +
          '</section>' +
        '</div>' +
      '</div>' +
      '<section class="panel-card" style="margin-top:16px"><div class="panel-card-head"><div><h3>' + icon('clipboard') + 'Movimientos del turno</h3><p>Todos los cobros registrados</p></div><span class="pill">' + fmt(total) + '</span></div>' +
        '<div class="panel-card-body" style="padding:6px 10px 10px"><div style="overflow-x:auto"><table class="panel-table"><thead><tr><th>Hora</th><th>Cliente</th><th>Equipo</th><th>Concepto</th><th>Medio</th><th style="text-align:right">Monto</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '</section>';
  }

  function submitCash() {
    const cliente = ($('#cashClient').value || '').trim() || 'Mostrador';
    const equipo = $('#cashEquip').value;
    const concepto = $('#cashConcept').value;
    const medio = $('#cashPay').value;
    const monto = Number($('#cashAmount').value);
    if (!monto || monto <= 0) {
      toast('Ingresá un monto mayor a cero para registrar el cobro.', 'error');
      return;
    }
    const eq = state.equipos.find((e) => e.id === equipo);
    const esTiempo = /hora adicional|extensión|extension|pack/i.test(concepto);
    let extraMin = 0;
    if (eq && esTiempo && eq.estado === 'ocupado') {
      extraMin = Math.round((monto / eq.precio) * 60);
      eq.restante = (eq.restante || 0) + extraMin;
    }
    state.pagos.unshift({ id: nextId('PG', state.pagos), hora: nowHM(), cliente, equipo, concepto, medio, monto });
    state.cashAmount = monto;
    if (extraMin > 0) {
      toast('Cobro de ' + fmt(monto) + ' registrado. Se sumaron ' + fmtMin(extraMin) + ' a ' + eq.id + '.', 'success');
    } else {
      toast('Cobro de ' + fmt(monto) + ' registrado en ' + medio.toLowerCase() + '.', 'success');
    }
    render();
  }

  /* ---------------------------- Kiosco ------------------------------------ */
  function viewKiosco() {
    const low = lowStock();
    const activos = state.pedidos.filter((p) => p.estado !== 'Entregado' && p.estado !== 'Cancelado');
    const ventas = state.pagos.filter((p) => p.equipo === 'Kiosco' || p.concepto.toLowerCase().includes('kiosco'));

    const stock = state.kiosco.map((k) => {
      const pct = Math.max(4, Math.min(100, Math.round((k.stock / Math.max(k.minimo * 3, 1)) * 100)));
      const tone = k.stock <= k.minimo ? TONES.red : (TONES[k.tema] || TONES.cyan);
      return '<div class="stock-card"><div class="stock-top">' +
          '<span class="stock-icon" style="--tone:' + tone + '">' + icon(k.icono) + '</span>' +
          '<div class="stock-copy"><strong>' + esc(k.nombre) + '</strong><span>' + esc(k.categoria) + '</span></div>' +
          '<div class="stock-num"><strong style="color:' + tone + '">' + k.stock + '</strong><span>mín. ' + k.minimo + '</span></div>' +
        '</div>' +
        '<div class="stock-bar"><i style="width:' + pct + '%;background:' + tone + '"></i></div>' +
        '<div class="stock-foot"><span class="stock-price">' + fmt(k.precio) + '</span>' +
          '<div class="stock-actions">' +
            '<button type="button" data-action="stock" data-id="' + k.id + '" data-delta="-1" aria-label="Restar stock">' + icon('minus') + '</button>' +
            '<button type="button" data-action="stock" data-id="' + k.id + '" data-delta="1" aria-label="Sumar stock">' + icon('plus') + '</button>' +
            '<button type="button" data-action="stock" data-id="' + k.id + '" data-delta="12">+12</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('');

    const orders = activos.length ? activos.map((p) =>
      '<div class="order-card"><div class="order-head"><div><strong>' + esc(p.cliente) + '</strong><span>' + esc(p.equipo) + ' · ' + esc(p.hora) + ' · ' + p.id + '</span></div>' +
        '<span class="pill pill--' + (p.estado === 'Pendiente' ? 'amber' : 'cyan') + '">' + esc(p.estado) + '</span></div>' +
        '<div class="order-items">' + p.items.map((it) => '<span><span>' + it.cantidad + '× ' + esc(it.nombre) + '</span><span>' + fmt(it.precio * it.cantidad) + '</span></span>').join('') + '</div>' +
        '<div class="order-foot"><span class="order-total">' + fmt(p.total) + '</span><div class="order-actions">' +
          (p.estado === 'Pendiente'
            ? '<button type="button" class="btn btn-ghost btn-sm" data-action="order" data-id="' + p.id + '" data-state="Preparando">' + icon('package') + 'Preparar</button>'
            : '<button type="button" class="btn btn-primary btn-sm" data-action="order" data-id="' + p.id + '" data-state="Entregado">' + icon('check') + 'Entregado</button>') +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="order" data-id="' + p.id + '" data-state="Cancelado">' + icon('x') + 'Cancelar</button>' +
        '</div></div>' +
      '</div>'
    ).join('') : '<div class="panel-empty">' + icon('check-circle') + '<strong>Sin pedidos pendientes</strong><span>Los pedidos nuevos aparecen acá en tiempo real.</span></div>';

    const movs = D.movimientosKiosco.map((m) =>
      '<tr><td class="muted-cell">' + esc(m.hora) + '</td><td><span class="pill pill--' + (m.tipo === 'Venta' ? 'green' : 'cyan') + '">' + esc(m.tipo) + '</span></td>' +
      '<td>' + esc(m.detalle) + '</td><td class="num">' + m.cantidad + '</td><td class="muted-cell">' + esc(m.usuario) + '</td></tr>'
    ).join('');

    return '<div class="panel-section-head">' +
        '<div><h2>Kiosco</h2><p>Pedidos desde las pantallas, ventas de mostrador y control de stock.</p></div>' +
        '<div class="panel-section-actions">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="goto" data-section="caja">' + icon('wallet') + 'Ir a caja</button>' +
          '<button type="button" class="btn btn-primary btn-sm" data-action="kiosco-sale">' + icon('shopping-cart') + 'Venta rápida</button>' +
        '</div>' +
      '</div>' +
      '<div class="kpi-grid">' +
        kpiCard('Pedidos en curso', String(activos.length), 'Pendientes y en preparación', 'shopping-cart', TONES.cyan) +
        kpiCard('Alertas de stock', String(low.length), low.length ? 'Reponer hoy' : 'Sin faltantes', 'alert-triangle', low.length ? TONES.amber : TONES.green) +
        kpiCard('Ventas del turno', fmt(ventas.reduce((s, p) => s + p.monto, 0)), ventas.length + ' movimientos de kiosco', 'banknote', TONES.green) +
        kpiCard('Productos activos', String(state.kiosco.length), 'Bebidas, snacks y accesorios', 'package', TONES.violet) +
      '</div>' +
      '<div class="kiosco-panel-grid">' +
        '<section class="panel-card"><div class="panel-card-head"><div><h3>' + icon('package') + 'Stock del kiosco</h3><p>Ajustá cantidades o reponé con un toque</p></div>' +
          (low.length ? '<span class="pill pill--red">' + low.length + ' bajo mínimo</span>' : '<span class="pill pill--green">Stock saludable</span>') + '</div>' +
          '<div class="panel-card-body"><div class="stock-grid">' + stock + '</div></div>' +
        '</section>' +
        '<section class="panel-card"><div class="panel-card-head"><div><h3>' + icon('shopping-cart') + 'Pedidos en curso</h3><p>Desde las pantallas de los equipos</p></div><span class="pill pill--amber">' + activos.length + '</span></div>' +
          '<div class="panel-card-body"><div class="order-list">' + orders + '</div>' +
            '<div class="panel-note" style="margin-top:12px">' + icon('info') + '<span>Al marcar <strong>Entregado</strong> el pedido se descuenta del stock y queda en el historial.</span></div>' +
          '</div>' +
        '</section>' +
      '</div>' +
      '<section class="panel-card" style="margin-top:16px"><div class="panel-card-head"><div><h3>' + icon('clipboard') + 'Movimientos de kiosco</h3><p>Ventas y reposiciones del turno</p></div><button type="button" class="link-arrow" data-action="kiosco-export">Exportar' + icon('download') + '</button></div>' +
        '<div class="panel-card-body" style="padding:6px 10px 10px"><div style="overflow-x:auto"><table class="panel-table"><thead><tr><th>Hora</th><th>Tipo</th><th>Detalle</th><th style="text-align:right">Cant.</th><th>Usuario</th></tr></thead><tbody>' + movs + '</tbody></table></div></div>' +
      '</section>';
  }

  function promptKioscoSale() {
    openModal({
      title: 'Venta rápida de kiosco',
      subtitle: 'Descuenta stock y registra el cobro en la caja del turno.',
      body: '<div class="modal-form">' +
          '<div class="field"><label for="ksProduct">Producto</label><select id="ksProduct">' + state.kiosco.map((k) => '<option value="' + k.id + '">' + esc(k.nombre) + ' · ' + fmt(k.precio) + ' · stock ' + k.stock + '</option>').join('') + '</select></div>' +
          '<div class="form-grid" style="margin-top:0">' +
            '<div class="field"><label for="ksQty">Cantidad</label><input type="number" id="ksQty" min="1" max="20" value="1"></div>' +
            '<div class="field"><label for="ksPay">Medio de pago</label><select id="ksPay"><option>Efectivo</option><option>Digital</option><option>Puntos</option></select></div>' +
          '</div>' +
          '<div class="modal-summary"><div><span>Total</span><strong id="ksTotal">' + fmt(state.kiosco[0] ? state.kiosco[0].precio : 0) + '</strong></div></div>' +
        '</div>',
      actions: '<button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>' +
        '<button type="button" class="btn btn-primary" data-action="confirm-sale">Registrar venta</button>',
      onOpen: (root) => {
        const prod = $('#ksProduct', root);
        const qty = $('#ksQty', root);
        const calc = () => {
          const k = state.kiosco.find((x) => x.id === prod.value);
          $('#ksTotal', root).textContent = fmt((k ? k.precio : 0) * Math.max(1, Number(qty.value) || 1));
        };
        prod.addEventListener('change', calc);
        qty.addEventListener('input', calc);
      }
    });
  }

  /* ---------------------------- Impresiones ------------------------------- */
  const PRINT_FLOW = ['Recibido', 'En impresión', 'Listo', 'Retirado'];

  function printTone(estado) {
    return estado === 'Recibido' ? 'amber' : estado === 'En impresión' ? 'cyan' : estado === 'Listo' ? 'violet' : 'green';
  }

  function viewImpresiones() {
    const enCola = state.impresiones.filter((p) => p.estado === 'Recibido').length;
    const imprimiendo = state.impresiones.filter((p) => p.estado === 'En impresión').length;
    const listos = state.impresiones.filter((p) => p.estado === 'Listo').length;
    const retirados = state.impresiones.filter((p) => p.estado === 'Retirado').length;

    const cards = state.impresiones.map((p) => {
      const stepIndex = PRINT_FLOW.indexOf(p.estado);
      const steps = PRINT_FLOW.map((s, i) => '<span class="print-step' + (i <= stepIndex ? ' is-done' : '') + '" style="--pstep:var(--' + (i <= stepIndex ? 'cyan' : 'gray') + ')"></span>').join('');
      const next = PRINT_FLOW[Math.min(stepIndex + 1, PRINT_FLOW.length - 1)];
      const action = p.estado === 'Retirado'
        ? '<span class="pill pill--green">' + icon('check') + 'Entregado</span>'
        : '<button type="button" class="btn btn-primary btn-sm" data-action="print" data-id="' + p.id + '" data-state="' + next + '">' + icon(next === 'Listo' ? 'check' : 'arrow-right') + (next === 'En impresión' ? 'Imprimir' : next === 'Listo' ? 'Marcar listo' : 'Entregar') + '</button>';

      return '<div class="print-card">' +
        '<div class="print-head"><div class="print-file">' + icon('file-text') + '<div><strong>' + esc(p.archivo) + '</strong><span>' + esc(p.cliente) + ' · ' + esc(p.equipo) + '</span></div></div>' +
          '<span class="pill pill--' + printTone(p.estado) + '">' + esc(p.estado) + '</span></div>' +
        '<div class="print-meta">' +
          '<span>' + icon('file-text') + p.paginas + ' págs.</span>' +
          '<span>' + icon('printer') + esc(p.modo) + '</span>' +
          '<span>' + icon('credit-card') + esc(p.pago) + '</span>' +
          '<span>' + icon('clock') + esc(p.hora) + '</span>' +
          '<span>' + icon('globe') + esc(p.origen) + '</span>' +
        '</div>' +
        '<div class="print-steps">' + steps + '</div>' +
        '<div class="print-step-labels"><span>Recibido</span><span>Impresión</span><span>Listo</span><span>Retirado</span></div>' +
        '<div class="print-actions"><span class="print-price">' + fmt(p.monto) + '</span>' + action + '</div>' +
      '</div>';
    }).join('');

    return '<div class="panel-section-head">' +
        '<div><h2>Impresiones</h2><p>Los trabajos llegan desde la web, la app o el mostrador de fotocopias.</p></div>' +
        '<div class="panel-section-actions">' +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="print-export">' + icon('download') + 'Exportar cola</button>' +
          '<button type="button" class="btn btn-primary btn-sm" data-action="print-new">' + icon('plus') + 'Registrar trabajo</button>' +
        '</div>' +
      '</div>' +
      '<div class="print-layout">' +
        '<section class="panel-card"><div class="panel-card-head"><div><h3>' + icon('printer') + 'Cola de trabajos</h3><p>' + state.impresiones.length + ' trabajos del turno</p></div><span class="pill pill--cyan">' + (enCola + imprimiendo) + ' activos</span></div>' +
          '<div class="panel-card-body"><div class="print-list">' + cards + '</div></div>' +
        '</section>' +
        '<div class="panel-stack">' +
          '<section class="panel-card"><div class="panel-card-head"><div><h3>' + icon('bar-chart') + 'Estado de la cola</h3><p>Resumen operativo</p></div></div>' +
            '<div class="panel-card-body"><div class="queue-stats">' +
              '<div class="queue-stat"><span>En cola</span><strong style="color:var(--amber)">' + enCola + '</strong></div>' +
              '<div class="queue-stat"><span>Imprimiendo</span><strong style="color:var(--cyan)">' + imprimiendo + '</strong></div>' +
              '<div class="queue-stat"><span>Listos</span><strong style="color:var(--violet)">' + listos + '</strong></div>' +
              '<div class="queue-stat"><span>Retirados</span><strong style="color:var(--green)">' + retirados + '</strong></div>' +
            '</div>' +
            '<div class="panel-note" style="margin-top:12px">' + icon('info') + '<span>Avisá al cliente desde <strong>Mensajes</strong> cuando el trabajo esté listo.</span></div>' +
            '</div>' +
          '</section>' +
          '<section class="panel-card"><div class="panel-card-head"><div><h3>' + icon('tag') + 'Tarifas de impresión</h3><p>Precios de referencia</p></div></div>' +
            '<div class="panel-card-body"><div class="detail-list">' +
              detailRow('B/N por página', fmt(150)) +
              detailRow('Color por página', fmt(500)) +
              detailRow('Fotocopia DNI', fmt(150)) +
              detailRow('Escaneo por hoja', fmt(200)) +
            '</div><div class="kpi-foot" style="margin-top:10px">' + icon('wallet') + 'El cobro se registra en caja al retirar.</div></div>' +
          '</section>' +
        '</div>' +
      '</div>';
  }

  function promptPrintJob() {
    openModal({
      title: 'Registrar trabajo de impresión',
      subtitle: 'Fotocopias o impresiones recibidas en el mostrador.',
      body: '<div class="modal-form">' +
          '<div class="field"><label for="pjClient">Cliente</label><input type="text" id="pjClient" placeholder="Nombre o “Mostrador”"></div>' +
          '<div class="field"><label for="pjFile">Archivo o descripción</label><input type="text" id="pjFile" placeholder="Ej.: fotocopia DNI, apunte.pdf"></div>' +
          '<div class="form-grid" style="margin-top:0">' +
            '<div class="field"><label for="pjPages">Páginas</label><input type="number" id="pjPages" min="1" value="1"></div>' +
            '<div class="field"><label for="pjMode">Modo</label><select id="pjMode"><option>B/N</option><option>Color</option></select></div>' +
          '</div>' +
          '<div class="field"><label for="pjPay">Forma de pago</label><select id="pjPay"><option>Efectivo</option><option>Digital</option><option>Puntos</option></select></div>' +
          '<div class="modal-summary"><div><span>Total estimado</span><strong id="pjTotal">$ 150</strong></div></div>' +
        '</div>',
      actions: '<button type="button" class="btn btn-ghost" data-action="close-modal">Cancelar</button>' +
        '<button type="button" class="btn btn-primary" data-action="confirm-print">Agregar a la cola</button>',
      onOpen: (root) => {
        const calc = () => {
          const pages = Math.max(1, Number($('#pjPages', root).value) || 1);
          const mode = $('#pjMode', root).value;
          $('#pjTotal', root).textContent = fmt(pages * (mode === 'Color' ? 500 : 150));
        };
        $('#pjPages', root).addEventListener('input', calc);
        $('#pjMode', root).addEventListener('change', calc);
      }
    });
  }

  /* ---------------------------- Clientes ---------------------------------- */
  state.clientSearch = state.clientSearch || '';

  function clientCard(c) {
    return '<button type="button" class="client-card" data-action="client" data-id="' + c.id + '">' +
      '<span class="client-avatar">' + initials(c.nombre) + '</span>' +
      '<div class="client-copy"><strong>' + esc(c.nombre) + '</strong><span>' + esc(c.email) + '</span>' +
        '<div class="client-tags"><span class="pill' + (c.tier === 'VIP' ? ' pill--violet' : c.tier === 'En riesgo' ? ' pill--red' : ' pill--green') + '">' + esc(c.tier) + '</span>' +
        '<span class="pill">' + esc(c.estado) + '</span></div>' +
        '<div class="client-stats"><span><strong>' + c.visitas + '</strong> visitas</span><span><strong>' + c.horas + ' h</strong></span><span><strong>' + fmt(c.gasto) + '</strong></span></div>' +
      '</div>' +
      '<span class="client-rating">' + icon('star') + c.rating.toFixed(1) + '</span>' +
    '</button>';
  }

  function viewClientes() {
    const q = norm(state.clientSearch.trim());
    const list = state.clientes.filter((c) => !q || norm([c.nombre, c.email, c.id, c.tier].join(' ')).includes(q));
    const enLocal = state.clientes.filter((c) => c.estado === 'En el local').length;
    const vip = state.clientes.filter((c) => c.tier === 'VIP').length;
    const riesgo = state.clientes.filter((c) => c.tier === 'En riesgo').length;

    return '<div class="panel-section-head">' +
        '<div><h2>Clientes</h2><p>Ficha completa, historial de consumo y calificaciones del local.</p></div>' +
        '<div class="panel-section-actions"><div class="map-search">' + icon('search') + '<input type="search" id="clientSearch" placeholder="Buscar cliente" value="' + esc(state.clientSearch) + '" aria-label="Buscar cliente"></div></div>' +
      '</div>' +
      '<div class="kpi-grid">' +
        kpiCard('Clientes registrados', String(state.clientes.length), 'Base de demostración', 'users', TONES.cyan) +
        kpiCard('En el local', String(enLocal), 'Con sesión activa', 'monitor', TONES.green) +
        kpiCard('Clientes VIP', String(vip), 'Mayor valor histórico', 'star', TONES.violet) +
        kpiCard('En riesgo', String(riesgo), 'Sin visitas hace +10 días', 'alert-triangle', TONES.amber) +
      '</div>' +
      (list.length ? '<div class="client-grid">' + list.map(clientCard).join('') + '</div>' : '<section class="panel-card"><div class="panel-empty">' + icon('search') + '<strong>Sin resultados</strong><span>Probá con otro nombre o correo.</span></div></section>') +
      '<div class="panel-note" style="margin-top:16px">' + icon('info') + '<span>Los datos personales se muestran en modo demostración. En producción, el acceso queda auditado por rol.</span></div>';
  }

  function openClientDrawer(id) {
    const c = state.clientes.find((x) => x.id === id);
    if (!c) return;
    const hist = c.historial.map((h) =>
      '<div class="history-item"><strong><span>' + esc(h.fecha) + ' · ' + esc(h.equipo) + '</span><span>' + fmt(h.total) + '</span></strong>' +
        '<span>' + esc(h.horas) + ' · ' + esc(h.estado) + '</span></div>'
    ).join('');
    const ratings = c.calificaciones.map((r) =>
      '<div class="rating-item"><strong>' + icon('star') + r.nota + '/5 <span style="color:var(--muted-2);font-weight:400">' + esc(r.fecha) + '</span></strong><p>' + esc(r.texto) + '</p></div>'
    ).join('');
    const movs = c.movimientos.map((m) =>
      '<div class="detail-row"><span>' + esc(m.fecha) + ' · ' + esc(m.detalle) + '</span><strong style="color:var(--green)">+' + m.valor + ' pts</strong></div>'
    ).join('');

    openDrawer({
      title: c.nombre,
      sub: c.id + ' · Cliente desde ' + esc(c.desde),
      body:
        '<div class="client-detail-hero"><span class="client-avatar">' + initials(c.nombre) + '</span><div><h2>' + esc(c.nombre) + '</h2><p>' + esc(c.email) + ' · ' + esc(c.telefono) + '</p>' +
          '<div class="client-tags"><span class="pill' + (c.tier === 'VIP' ? ' pill--violet' : c.tier === 'En riesgo' ? ' pill--red' : ' pill--green') + '">' + esc(c.tier) + '</span><span class="pill">' + esc(c.estado) + (c.equipo !== '—' ? ' · ' + c.equipo : '') + '</span><span class="pill">' + icon('star') + c.rating.toFixed(1) + '</span></div></div></div>' +
        '<div class="client-metrics">' +
          '<div class="client-metric"><span>Visitas</span><strong>' + c.visitas + '</strong></div>' +
          '<div class="client-metric"><span>Horas</span><strong>' + c.horas + '</strong></div>' +
          '<div class="client-metric"><span>Gasto total</span><strong>' + fmt(c.gasto) + '</strong></div>' +
        '</div>' +
        '<div class="detail-list" style="margin-top:12px">' +
          detailRow('Última visita', esc(c.ultima)) +
          detailRow('Puntos de fidelidad', c.puntos + ' pts') +
          detailRow('Equipo actual', esc(c.equipo)) +
        '</div>' +
        '<p class="detail-section-title">Historial reciente</p><div class="history-list">' + hist + '</div>' +
        '<p class="detail-section-title">Calificaciones</p><div>' + (ratings || '<div class="panel-empty" style="padding:12px"><span>Sin calificaciones.</span></div>') + '</div>' +
        '<p class="detail-section-title">Movimientos de puntos</p><div class="detail-list">' + movs + '</div>',
      foot: '<button type="button" class="btn btn-primary" data-action="client-msg" data-id="' + c.id + '">' + icon('message-square') + 'Enviar mensaje</button>' +
        '<a class="btn btn-ghost" href="mailto:' + esc(c.email) + '">' + icon('mail') + 'Correo</a>' +
        '<a class="btn btn-ghost" href="tel:' + esc(c.telefono.replace(/\s/g, '')) + '">' + icon('phone') + 'Llamar</a>'
    });
  }

  /* ---------------------------- Mensajes ---------------------------------- */
  function viewMensajes() {
    const ocupados = state.equipos.filter((e) => e.estado === 'ocupado');
    const tpl = D.plantillas.find((p) => p.id === state.msgTemplate);
    const history = state.mensajes.map((m) =>
      '<div class="message-item"><div class="message-head"><strong>' + esc(m.equipo) + ' · ' + esc(m.cliente) + '</strong><span>' + esc(m.hora) + '</span></div>' +
        '<p>' + esc(m.texto) + '</p><span class="pill' + (m.estado === 'Entregado' ? ' pill--green' : m.estado === 'Leído' ? ' pill--cyan' : '') + '">' + esc(m.estado) + '</span>' +
        '<span class="pill" style="margin-left:4px">' + esc(m.operador) + '</span></div>'
    ).join('');

    return '<div class="panel-section-head">' +
        '<div><h2>Mensajes</h2><p>Los avisos aparecen como notificación en la pantalla del equipo del cliente.</p></div>' +
        '<div class="panel-section-actions"><span class="panel-note" style="padding:8px 11px">' + icon('message-square') + state.mensajes.length + ' mensajes enviados</span></div>' +
      '</div>' +
      '<div class="messages-layout">' +
        '<section class="panel-card"><div class="panel-card-head"><div><h3>' + icon('send') + 'Nuevo mensaje</h3><p>Elegí un equipo y una plantilla</p></div></div>' +
          '<div class="panel-card-body"><div class="message-form">' +
            '<div class="field"><label for="msgEquip">Equipo destinatario</label><select id="msgEquip">' +
              (ocupados.length ? ocupados.map((e) => '<option value="' + e.id + '">' + e.id + ' · ' + esc(e.cliente || 'Cliente') + ' · ' + esc(e.zona) + '</option>').join('') : '<option value="">Sin equipos en sesión</option>') +
              '<option value="TODOS">Todos los equipos en sesión</option>' +
            '</select></div>' +
            '<div class="field"><label>Plantillas rápidas</label><div class="template-chips">' +
              D.plantillas.map((p) => '<button type="button" class="template-chip' + (state.msgTemplate === p.id ? ' is-active' : '') + '" data-action="msg-template" data-id="' + p.id + '">' + esc(p.titulo) + '</button>').join('') +
            '</div></div>' +
            '<div class="field"><label for="msgText">Mensaje</label><textarea id="msgText" placeholder="Escribí el aviso para la pantalla del cliente…">' + esc(tpl ? tpl.texto : '') + '</textarea></div>' +
            '<button type="button" class="btn btn-primary" data-action="msg-send">' + icon('send') + 'Enviar a la pantalla</button>' +
            '<div class="panel-note">' + icon('info') + '<span>El mensaje se muestra 20 segundos y queda registrado en el historial del turno.</span></div>' +
          '</div></div>' +
        '</section>' +
        '<section class="panel-card"><div class="panel-card-head"><div><h3>' + icon('history') + 'Historial del turno</h3><p>Mensajes enviados desde este puesto</p></div><span class="pill pill--cyan">' + state.mensajes.length + '</span></div>' +
          '<div class="panel-card-body"><div class="message-list">' + (history || '<div class="panel-empty">' + icon('message-square') + '<strong>Sin mensajes</strong><span>Los avisos enviados aparecen acá.</span></div>') + '</div></div>' +
        '</section>' +
      '</div>';
  }

  /* ---------------------------- Reportes ---------------------------------- */
  const REPORT_FACTOR = { hoy: 0.16, semana: 1, mes: 4.1 };

  function viewReportes() {
    const factor = REPORT_FACTOR[state.reportRange];
    const dias = D.reportes.dias.map((d) => ({ label: d.label, ingresos: Math.round(d.ingresos * factor), clientes: Math.round(d.clientes * factor), horas: Math.round(d.horas * factor) }));
    const ingresos = dias.reduce((s, d) => s + d.ingresos, 0);
    const clientes = dias.reduce((s, d) => s + d.clientes, 0);
    const horas = dias.reduce((s, d) => s + d.horas, 0);
    const ticket = clientes ? Math.round(ingresos / clientes) : 0;
    const max = Math.max(...dias.map((d) => d.ingresos), 1);
    const peak = Math.max(...dias.map((d) => d.ingresos));
    const linesTotal = D.reportes.lineas.reduce((s, l) => s + l.monto, 0);
    let acc = 0;
    const stops = D.reportes.lineas.map((l) => {
      const from = acc / linesTotal * 100;
      acc += l.monto;
      const to = acc / linesTotal * 100;
      return TONES[l.tone] + ' ' + from.toFixed(1) + '% ' + to.toFixed(1) + '%';
    }).join(', ');

    const bars = dias.map((d) =>
      '<div class="bar-col' + (d.ingresos === peak ? ' is-peak' : '') + '"><div class="bar" style="height:' + Math.max(6, Math.round(d.ingresos / max * 100)) + '%"><span>$' + Math.round(d.ingresos / 1000) + 'k</span></div><span>' + d.label + '</span></div>'
    ).join('');

    const top = D.reportes.equiposTop.map((e) =>
      '<div class="hbar-row"><span>' + e.id + '</span><div class="hbar-track"><i style="width:' + e.pct + '%;background:var(--cyan)"></i></div><span>' + e.horas + ' h</span></div>'
    ).join('');

    const franjas = D.reportes.franjas.map((f) =>
      '<div class="franja-row"><span>' + f.label + '</span><div class="hbar-track"><i style="width:' + f.pct + '%;background:' + (TONES[f.tone] || TONES.cyan) + '"></i></div><strong>' + f.pct + '%</strong></div>'
    ).join('');

    const legend = D.reportes.lineas.map((l) =>
      '<div><i style="--tone:' + (TONES[l.tone] || TONES.cyan) + '"></i><span>' + esc(l.label) + '</span><strong>' + fmt(Math.round(ingresos * l.monto / linesTotal)) + '</strong></div>'
    ).join('');

    const rangeBtn = (id, label) => '<button type="button" class="tab' + (state.reportRange === id ? ' is-active' : '') + '" data-action="report-range" data-range="' + id + '">' + label + '</button>';

    return '<div class="panel-section-head">' +
        '<div><h2>Reportes</h2><p>Indicadores del negocio para el cierre y la toma de decisiones.</p></div>' +
        '<div class="panel-section-actions">' +
          '<div class="tabs">' + rangeBtn('hoy', 'Hoy') + rangeBtn('semana', 'Semana') + rangeBtn('mes', 'Mes') + '</div>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-action="report-export">' + icon('download') + 'Descargar CSV</button>' +
        '</div>' +
      '</div>' +
      '<div class="report-kpis">' +
        '<div class="report-kpi"><span>Ingresos</span><strong>' + fmt(ingresos) + '</strong><small>' + (state.reportRange === 'hoy' ? 'Turno actual' : state.reportRange === 'semana' ? 'Últimos 7 días' : 'Estimado 30 días') + '</small></div>' +
        '<div class="report-kpi"><span>Clientes atendidos</span><strong>' + clientes + '</strong><small>' + Math.round(clientes / dias.length) + ' por día</small></div>' +
        '<div class="report-kpi"><span>Horas vendidas</span><strong>' + horas + ' h</strong><small>Ocupación promedio 64%</small></div>' +
        '<div class="report-kpi"><span>Ticket promedio</span><strong>' + fmt(ticket) + '</strong><small>Por cliente</small></div>' +
      '</div>' +
      '<div class="panel-grid panel-grid--2">' +
        '<section class="panel-card chart-card"><h3>Ingresos por día</h3><p>Comparación de la semana operativa</p><div class="bar-chart">' + bars + '</div></section>' +
        '<section class="panel-card chart-card"><h3>Mezcla de servicio</h3><p>Participación sobre el total facturado</p>' +
          '<div class="donut-wrap"><div class="donut" style="background:conic-gradient(' + stops + ')"><div class="donut-center"><strong>$' + Math.round(ingresos / 1000) + 'k</strong><span>Total</span></div></div>' +
            '<div class="donut-legend">' + legend + '</div></div>' +
        '</section>' +
        '<section class="panel-card chart-card"><h3>Equipos más usados</h3><p>Horas acumuladas en la semana</p><div class="hbar-list">' + top + '</div></section>' +
        '<section class="panel-card chart-card"><h3>Franjas horarias</h3><p>Distribución de la ocupación</p><div class="franja-list">' + franjas + '</div>' +
          '<div class="panel-note" style="margin-top:14px">' + icon('zap') + '<span>La franja de <strong>18 a 24</strong> concentra la mayor demanda: conviene reforzar personal y stock en ese horario.</span></div>' +
        '</section>' +
      '</div>';
  }

  function downloadCSV(filename, rows) {
    const csv = rows.map((r) => r.map((cell) => '"' + String(cell).replace(/"/g, '""') + '"').join(';')).join('\r\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  /* ---------------------------- Acciones ---------------------------------- */
  function setEquipoState(id, next) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    if (next === 'ocupado' && eq.estado !== 'ocupado') { promptStartSession(id); return; }
    if (next === 'mantenimiento' && eq.estado === 'ocupado') {
      toast('Cerrá la sesión de ' + id + ' antes de pasarlo a mantenimiento.', 'error');
      return;
    }
    eq.estado = next;
    if (next === 'disponible') {
      delete eq.cliente; delete eq.restante; delete eq.desde; delete eq.reservaHora; delete eq.motivo;
      state.reservas.forEach((r) => { if (r.equipo === id && (r.estado === 'Confirmada' || r.estado === 'En gracia')) r.estado = 'Cancelada'; });
    }
    if (next === 'mantenimiento') { delete eq.cliente; delete eq.restante; delete eq.desde; delete eq.reservaHora; eq.motivo = 'Service programado'; }
    if (next === 'reservado') { eq.reservaHora = eq.reservaHora || nowHM(); eq.cliente = eq.cliente || 'Reserva web'; delete eq.restante; delete eq.desde; }
    render();
    if ($('#panelDrawer') && $('#panelDrawer').classList.contains('is-open')) openEquipoDrawer(id);
    toast(id + ' ahora está ' + STATE_LABEL[next].toLowerCase() + '.', next === 'mantenimiento' ? 'info' : 'success');
  }

  function startSession(id, cliente, horas, medio) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    const total = horas >= 3 ? Math.round(eq.precio * horas * 0.9) : eq.precio * horas;
    eq.estado = 'ocupado';
    eq.cliente = cliente || 'Cliente mostrador';
    eq.restante = horas * 60;
    eq.desde = nowHM();
    delete eq.reservaHora; delete eq.motivo;
    state.reservas.forEach((r) => { if (r.equipo === id && r.estado === 'Confirmada') r.estado = 'Finalizada'; });
    state.pagos.unshift({ id: nextId('PG', state.pagos), hora: nowHM(), cliente: eq.cliente, equipo: id, concepto: 'Sesión ' + horas + ' h', medio, monto: total });
    render();
    toast('Sesión iniciada en ' + id + ' por ' + fmtMin(horas * 60) + ' · ' + fmt(total) + '.', 'success');
  }

  function confirmSession(id) {
    const cliente = ($('#sessClient').value || '').trim();
    const horas = Number($('#sessHours').value);
    const medio = $('#sessPay').value;
    closeModal();
    startSession(id, cliente, horas, medio);
  }

  function confirmExtend(id) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    const horas = Number($('#extHours').value);
    const medio = $('#extPay').value;
    const total = horas >= 3 ? Math.round(eq.precio * horas * 0.9) : eq.precio * horas;
    eq.restante = (eq.restante || 0) + horas * 60;
    state.pagos.unshift({ id: nextId('PG', state.pagos), hora: nowHM(), cliente: eq.cliente || 'Cliente', equipo: id, concepto: 'Extensión ' + horas + ' h', medio, monto: total });
    closeModal();
    render();
    if ($('#panelDrawer') && $('#panelDrawer').classList.contains('is-open')) openEquipoDrawer(id);
    toast('Extensión de ' + horas + ' h en ' + id + ' · ' + fmt(total) + ' cobrados.', 'success');
  }

  function confirmFree(id) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    const medio = $('#freePay').value;
    const amountEl = $('#freeAmount');
    const monto = amountEl ? Math.max(0, Number(amountEl.value)) : eq.precio;
    if (monto > 0) state.pagos.unshift({ id: nextId('PG', state.pagos), hora: nowHM(), cliente: eq.cliente || 'Cliente', equipo: id, concepto: 'Cierre de sesión', medio, monto });
    eq.estado = 'disponible';
    delete eq.cliente; delete eq.restante; delete eq.desde; delete eq.reservaHora; delete eq.motivo;
    closeModal();
    closeDrawer();
    render();
    toast(id + ' liberado. ' + (monto > 0 ? fmt(monto) + ' registrados en caja.' : ''), 'success');
  }

  function checkinEquipo(id) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    const reserva = state.reservas.find((r) => r.equipo === id && (r.estado === 'Confirmada' || r.estado === 'En gracia'));
    const horas = reserva ? reserva.duracion : 2;
    eq.estado = 'ocupado';
    eq.restante = horas * 60;
    eq.desde = nowHM();
    delete eq.reservaHora;
    if (reserva) { reserva.estado = 'Finalizada'; eq.cliente = reserva.cliente; }
    render();
    closeDrawer();
    toast('Check-in confirmado en ' + id + '. Sesión de ' + horas + ' h iniciada.', 'success');
  }

  function releaseEquipo(id) {
    const eq = state.equipos.find((e) => e.id === id);
    if (!eq) return;
    eq.estado = 'disponible';
    delete eq.cliente; delete eq.restante; delete eq.desde; delete eq.reservaHora; delete eq.motivo;
    state.reservas.forEach((r) => { if (r.equipo === id && (r.estado === 'Confirmada' || r.estado === 'En gracia')) r.estado = 'Cancelada'; });
    render();
    closeDrawer();
    toast('Reserva liberada. ' + id + ' vuelve a estar disponible.', 'info');
  }

  function confirmReserva() {
    const cliente = ($('#nrClient').value || '').trim();
    const telefono = ($('#nrPhone').value || '').trim() || 'Sin teléfono';
    const equipo = $('#nrEquip').value;
    const hora = $('#nrHour').value || nowHM();
    const duracion = Number($('#nrDur').value);
    const origen = $('#nrOrigin').value;
    if (!cliente) { toast('Ingresá el nombre del cliente.', 'error'); return; }
    const eq = state.equipos.find((e) => e.id === equipo);
    if (!eq) { toast('No hay equipos disponibles para reservar.', 'error'); return; }
    const total = duracion >= 3 ? Math.round(eq.precio * duracion * 0.9) : eq.precio * duracion;
    state.reservas.push({ id: nextId('R', state.reservas), cliente, telefono, equipo, hora, duracion, estado: 'Confirmada', origen, total });
    eq.estado = 'reservado';
    eq.cliente = cliente;
    eq.reservaHora = hora;
    delete eq.restante; delete eq.desde; delete eq.motivo;
    closeModal();
    render();
    toast('Reserva confirmada para ' + cliente + ' · ' + equipo + ' a las ' + hora + '.', 'success');
  }

  function handleAction(action, el) {
    const id = el.dataset.id;
    switch (action) {
      case 'close-modal': closeModal(); break;
      case 'close-drawer': closeDrawer(); break;
      case 'goto':
        closeModal(); closeDrawer();
        setSection(el.dataset.section);
        break;
      case 'equip': openEquipoDrawer(id); break;
      case 'set-state': setEquipoState(id, el.dataset.state); break;
      case 'start-session': closeDrawer(); promptStartSession(id); break;
      case 'extend': promptExtend(id); break;
      case 'free': promptFree(id); break;
      case 'checkin': checkinEquipo(id); break;
      case 'release': releaseEquipo(id); break;
      case 'confirm-session': confirmSession(id); break;
      case 'confirm-extend': confirmExtend(id); break;
      case 'confirm-free': confirmFree(id); break;
      case 'remote': promptRemote(id, el.dataset.do); break;
      case 'confirm-remote': applyRemote(id, el.dataset.do); break;
      case 'map-zone': state.mapZone = el.dataset.zone; render(); break;
      case 'map-state': state.mapState = el.dataset.state; render(); break;
      case 'map-reset': state.mapZone = 'todas'; state.mapState = 'todos'; state.mapSearch = ''; render(); break;

      case 'new-reserva': promptNewReserva(); break;
      case 'confirm-reserva': confirmReserva(); break;
      case 'res-checkin': {
        const r = state.reservas.find((x) => x.id === id);
        if (r) { checkinEquipo(r.equipo); }
        break;
      }
      case 'res-noshow': {
        const r = state.reservas.find((x) => x.id === id);
        if (!r) break;
        r.estado = 'No asistió';
        const eq = state.equipos.find((e) => e.id === r.equipo);
        if (eq) { eq.estado = 'disponible'; delete eq.cliente; delete eq.reservaHora; }
        render();
        toast('Reserva ' + r.id + ' marcada como no asistió. Equipo liberado.', 'info');
        break;
      }
      case 'res-cancel': {
        const r = state.reservas.find((x) => x.id === id);
        if (!r) break;
        r.estado = 'Cancelada';
        const eq = state.equipos.find((e) => e.id === r.equipo);
        if (eq && eq.estado === 'reservado') { eq.estado = 'disponible'; delete eq.cliente; delete eq.reservaHora; }
        render();
        toast('Reserva ' + r.id + ' cancelada.', 'info');
        break;
      }
      case 'res-export':
        downloadCSV('reservas-cyber24.csv', [['ID', 'Cliente', 'Teléfono', 'Equipo', 'Hora', 'Duración', 'Estado', 'Origen', 'Total']].concat(
          state.reservas.map((r) => [r.id, r.cliente, r.telefono, r.equipo, r.hora, r.duracion, r.estado, r.origen, r.total])
        ));
        toast('Lista de reservas exportada en CSV.', 'success');
        break;

      case 'cash-amount': {
        const amount = Number(el.dataset.amount);
        state.cashAmount = amount;
        const input = $('#cashAmount');
        if (input) input.value = amount;
        const preview = $('#cashPreview');
        if (preview) preview.textContent = fmt(amount);
        break;
      }
      case 'cash-submit': submitCash(); break;
      case 'close-shift': {
        const { total, efectivo, digital } = cashTotals();
        openModal({
          title: 'Cerrar turno',
          subtitle: 'Resumen antes de entregar la caja',
          body: '<div class="modal-summary" style="display:grid;gap:8px">' +
              '<div><span>Efectivo</span><strong>' + fmt(efectivo) + '</strong></div>' +
              '<div><span>Digital y puntos</span><strong>' + fmt(digital) + '</strong></div>' +
              '<div><span>Total registrado</span><strong>' + fmt(total) + '</strong></div>' +
              '<div><span>Movimientos</span><strong>' + state.pagos.length + '</strong></div>' +
            '</div><div class="modal-warning" style="margin-top:12px">' + icon('alert-triangle') + '<span>En el prototipo el cierre es simulado: no se bloquea la caja ni se genera un archivo contable.</span></div>',
          actions: '<button type="button" class="btn btn-ghost" data-action="close-modal">Volver</button><button type="button" class="btn btn-primary" data-action="confirm-shift">Confirmar cierre</button>'
        });
        break;
      }
      case 'confirm-shift':
        closeModal();
        toast('Turno cerrado correctamente. Caja entregada al siguiente operador.', 'success');
        break;

      case 'stock': {
        const k = state.kiosco.find((x) => x.id === id);
        if (!k) break;
        const delta = Number(el.dataset.delta);
        k.stock = Math.max(0, k.stock + delta);
        render();
        break;
      }
      case 'order': {
        const p = state.pedidos.find((x) => x.id === id);
        if (!p) break;
        p.estado = el.dataset.state;
        if (p.estado === 'Entregado') {
          p.items.forEach((it) => {
            const k = state.kiosco.find((x) => x.id === it.id);
            if (k) k.stock = Math.max(0, k.stock - it.cantidad);
          });
          D.movimientosKiosco.unshift({ id: 'MK-' + Date.now(), hora: nowHM(), tipo: 'Venta', detalle: p.cliente + ' · ' + p.items.map((i) => i.cantidad + '× ' + i.nombre).join(', '), cantidad: p.items.reduce((s, i) => s + i.cantidad, 0), usuario: D.operador.iniciales });
          state.pagos.unshift({ id: nextId('PG', state.pagos), hora: nowHM(), cliente: p.cliente, equipo: 'Kiosco', concepto: 'Pedido ' + p.id, medio: 'Efectivo', monto: p.total });
          toast('Pedido ' + p.id + ' entregado y stock actualizado.', 'success');
        } else if (p.estado === 'Cancelado') {
          toast('Pedido ' + p.id + ' cancelado.', 'info');
        } else {
          toast('Pedido ' + p.id + ' en preparación.', 'info');
        }
        render();
        break;
      }
      case 'kiosco-sale': promptKioscoSale(); break;
      case 'confirm-sale': {
        const k = state.kiosco.find((x) => x.id === $('#ksProduct').value);
        const qty = Math.max(1, Number($('#ksQty').value) || 1);
        const medio = $('#ksPay').value;
        if (!k) { toast('Elegí un producto válido.', 'error'); break; }
        if (qty > k.stock) { toast('Stock insuficiente de ' + k.nombre + ' (quedan ' + k.stock + ').', 'error'); break; }
        const total = k.precio * qty;
        k.stock -= qty;
        state.pagos.unshift({ id: nextId('PG', state.pagos), hora: nowHM(), cliente: 'Mostrador', equipo: 'Kiosco', concepto: 'Venta kiosco', medio, monto: total });
        D.movimientosKiosco.unshift({ id: 'MK-' + Date.now(), hora: nowHM(), tipo: 'Venta', detalle: k.nombre + ' x' + qty, cantidad: qty, usuario: D.operador.iniciales });
        closeModal();
        render();
        toast('Venta registrada: ' + qty + '× ' + k.nombre + ' · ' + fmt(total) + '.', 'success');
        break;
      }
      case 'kiosco-export':
        downloadCSV('kiosco-cyber24.csv', [['Hora', 'Tipo', 'Detalle', 'Cantidad', 'Usuario']].concat(D.movimientosKiosco.map((m) => [m.hora, m.tipo, m.detalle, m.cantidad, m.usuario])));
        toast('Movimientos de kiosco exportados.', 'success');
        break;

      case 'print': {
        const p = state.impresiones.find((x) => x.id === id);
        if (!p) break;
        p.estado = el.dataset.state;
        if (p.estado === 'Retirado') {
          const medio = p.pago === 'Puntos' ? 'Puntos' : p.pago === 'Digital' ? 'Digital' : 'Efectivo';
          state.pagos.unshift({ id: nextId('PG', state.pagos), hora: nowHM(), cliente: p.cliente, equipo: p.equipo, concepto: 'Impresión ' + p.archivo, medio, monto: p.monto });
          toast('Trabajo ' + p.archivo + ' entregado y ' + fmt(p.monto) + ' registrados en caja.', 'success');
        } else {
          toast('Trabajo ' + p.archivo + ' → ' + p.estado + '. ' + (p.estado === 'Listo' ? 'Avisá al cliente para que lo retire.' : ''), 'success');
        }
        render();
        break;
      }
      case 'print-new': promptPrintJob(); break;
      case 'confirm-print': {
        const cliente = ($('#pjClient').value || '').trim() || 'Mostrador';
        const archivo = ($('#pjFile').value || '').trim() || 'Fotocopia';
        const paginas = Math.max(1, Number($('#pjPages').value) || 1);
        const modo = $('#pjMode').value;
        const pago = $('#pjPay').value;
        const monto = paginas * (modo === 'Color' ? 500 : 150);
        state.impresiones.unshift({ id: nextId('IMP', state.impresiones), cliente, equipo: 'Kiosco', archivo, paginas, modo, monto, pago, estado: 'Recibido', origen: 'Fotocopia', hora: nowHM() });
        closeModal();
        render();
        toast('Trabajo de ' + paginas + ' páginas registrado · ' + fmt(monto) + '.', 'success');
        break;
      }
      case 'print-export':
        downloadCSV('impresiones-cyber24.csv', [['ID', 'Archivo', 'Cliente', 'Equipo', 'Páginas', 'Modo', 'Monto', 'Pago', 'Estado', 'Origen', 'Hora']].concat(
          state.impresiones.map((p) => [p.id, p.archivo, p.cliente, p.equipo, p.paginas, p.modo, p.monto, p.pago, p.estado, p.origen, p.hora])
        ));
        toast('Cola de impresiones exportada.', 'success');
        break;

      case 'client': openClientDrawer(id); break;
      case 'client-msg': {
        const c = state.clientes.find((x) => x.id === id);
        closeDrawer();
        setSection('mensajes');
        if (c && c.equipo !== '—') {
          const sel = $('#msgEquip');
          if (sel) sel.value = c.equipo;
          const ta = $('#msgText');
          if (ta) ta.value = 'Hola ' + firstName(c.nombre) + ', ¿necesitás algo desde el mostrador?';
        }
        break;
      }

      case 'msg-template': {
        const tpl = D.plantillas.find((p) => p.id === id);
        state.msgTemplate = id;
        $$('.template-chip').forEach((chip) => chip.classList.toggle('is-active', chip.dataset.id === id));
        if (tpl) $('#msgText').value = tpl.texto;
        break;
      }
      case 'msg-send': {
        const equip = $('#msgEquip').value;
        const texto = ($('#msgText').value || '').trim();
        if (!equip || !texto) { toast('Elegí un equipo y escribí el mensaje.', 'error'); break; }
        const target = equip === 'TODOS' ? 'Todos' : equip;
        state.mensajes.unshift({ id: nextId('M', state.mensajes), equipo: target, cliente: equip === 'TODOS' ? 'Equipos en sesión' : (state.equipos.find((e) => e.id === equip) || {}).cliente || 'Cliente', texto, hora: nowHM(), estado: 'Enviado', operador: D.operador.iniciales });
        state.msgTemplate = null;
        render();
        toast('Mensaje enviado a ' + (equip === 'TODOS' ? 'todas las pantallas activas' : equip) + '.', 'success');
        break;
      }

      case 'report-range': state.reportRange = el.dataset.range; render(); break;
      case 'report-export': {
        const factor = REPORT_FACTOR[state.reportRange];
        downloadCSV('reporte-cyber24.csv', [['Día', 'Ingresos', 'Clientes', 'Horas']].concat(
          D.reportes.dias.map((d) => [d.label, Math.round(d.ingresos * factor), Math.round(d.clientes * factor), Math.round(d.horas * factor)])
        ));
        toast('Reporte descargado en CSV.', 'success');
        break;
      }
      default: break;
    }
  }

  function initEvents() {
    document.addEventListener('click', (ev) => {
      const el = ev.target.closest('[data-action]');
      if (!el) return;
      ev.preventDefault();
      handleAction(el.dataset.action, el);
    });

    document.addEventListener('input', (ev) => {
      const t = ev.target;
      if (t.id === 'mapSearch') {
        state.mapSearch = t.value;
        const pos = t.selectionStart;
        render();
        const next = $('#mapSearch');
        if (next) { next.focus(); try { next.setSelectionRange(pos, pos); } catch (e) { /* tipo search */ } }
      } else if (t.id === 'clientSearch') {
        state.clientSearch = t.value;
        const pos = t.selectionStart;
        render();
        const next = $('#clientSearch');
        if (next) { next.focus(); try { next.setSelectionRange(pos, pos); } catch (e) { /* tipo search */ } }
      } else if (t.id === 'cashAmount') {
        state.cashAmount = Number(t.value) || 0;
        const preview = $('#cashPreview');
        if (preview) preview.textContent = fmt(state.cashAmount);
      }
    });

    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') return;
      if ($('#panelModalBackdrop')) closeModal();
      else if ($('#panelDrawer') && $('#panelDrawer').classList.contains('is-open')) closeDrawer();
    });
  }

  /* ---------------------------- Init -------------------------------------- */
  ensureDrawer();
  initEvents();
  initShell();
  initLogin();
  startClock();
  updateBadges();

})();

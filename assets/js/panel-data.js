/* ==========================================================================
   CYBER 24 HORAS — Datos de demostración del panel de empleados
   ========================================================================== */
window.PanelData = (function () {
  const base = (window.CyberData && window.CyberData.equipos) || [];

  const sesiones = {
    P02: { cliente: 'Lucas Martínez', restante: 42, desde: '21:30' },
    P08: { cliente: 'Sofía Ramírez', restante: 96, desde: '23:20' },
    P14: { cliente: 'Mateo González', restante: 18, desde: '21:50' },
    P21: { cliente: 'Valentina Pérez', restante: 64, desde: '23:00' },
    C02: { cliente: 'Joaquín López', restante: 35, desde: '22:30' },
    C07: { cliente: 'Thiago Acosta', restante: 12, desde: '23:45' }
  };

  const reservasEquipo = {
    P04: { cliente: 'Camila Suárez', reservaHora: '01:00' },
    P11: { cliente: 'Lucas Martínez', reservaHora: '22:00' },
    P17: { cliente: 'Bruno Díaz', reservaHora: '19:00' },
    P24: { cliente: 'Sofía Ramírez', reservaHora: '21:00' },
    C04: { cliente: 'Camila Suárez', reservaHora: '18:00' }
  };

  const equipos = base.map((eq) => {
    const item = Object.assign({}, eq);
    if (item.estado === 'ocupado' && sesiones[item.id]) Object.assign(item, sesiones[item.id]);
    if (item.estado === 'reservado' && reservasEquipo[item.id]) Object.assign(item, reservasEquipo[item.id]);
    if (item.id === 'P19') item.motivo = 'Actualización de sistema';
    return item;
  });

  const operador = {
    nombre: 'Valentina Ríos',
    iniciales: 'VR',
    email: 'empleado@cyber24h.com',
    password: 'turno1234',
    rol: 'Empleado',
    turno: 'Turno noche · 22:00 a 06:00',
    sucursal: 'Sede Centro',
    desde: 'Marzo 2025'
  };

  const clientes = [
    {
      id: 'CL-1042', nombre: 'Lucas Martínez', email: 'lucas.martinez@mail.com', telefono: '+54 11 5542-8801',
      desde: '2024-04-12', visitas: 18, horas: 42.5, gasto: 128400, puntos: 420, ultima: 'Hoy · 21:30',
      rating: 4.8, estado: 'En el local', equipo: 'P02', tier: 'Frecuente',
      historial: [
        { fecha: 'Hoy', equipo: 'P02', horas: '2 h', total: 5000, estado: 'En curso' },
        { fecha: '12/11', equipo: 'P09', horas: '2 h', total: 8400, estado: 'Utilizada' },
        { fecha: '03/11', equipo: 'P03', horas: '1,5 h', total: 4950, estado: 'Utilizada' }
      ],
      calificaciones: [
        { fecha: '12/11', nota: 5, texto: 'Los equipos impecables y la conexión vuela.' },
        { fecha: '03/11', nota: 4, texto: 'Buena atención, faltaban snacks.' }
      ],
      movimientos: [
        { fecha: '12/11', detalle: 'Sesión P09 · 2 horas', valor: 40 },
        { fecha: '03/11', detalle: 'Sesión P03 · 1,5 horas', valor: 20 }
      ]
    },
    {
      id: 'CL-1088', nombre: 'Sofía Ramírez', email: 'sofia.ramirez@mail.com', telefono: '+54 11 5518-2234',
      desde: '2024-08-03', visitas: 12, horas: 28, gasto: 86400, puntos: 310, ultima: 'Hoy · 23:20',
      rating: 4.9, estado: 'En el local', equipo: 'P08', tier: 'Frecuente',
      historial: [
        { fecha: 'Hoy', equipo: 'P08', horas: '1,5 h', total: 7500, estado: 'En curso' },
        { fecha: '08/11', equipo: 'C01', horas: '3 h', total: 14800, estado: 'Utilizada' }
      ],
      calificaciones: [{ fecha: '08/11', nota: 5, texto: 'Sala de consolas increíble.' }],
      movimientos: [{ fecha: '08/11', detalle: 'Sesión C01 · 3 horas', valor: 60 }]
    },
    {
      id: 'CL-1120', nombre: 'Mateo González', email: 'mateo.gonzalez@mail.com', telefono: '+54 11 5590-7712',
      desde: '2025-01-19', visitas: 7, horas: 15, gasto: 47200, puntos: 180, ultima: 'Hoy · 21:50',
      rating: 4.2, estado: 'En el local', equipo: 'P14', tier: 'Habitual',
      historial: [
        { fecha: 'Hoy', equipo: 'P14', horas: '2 h', total: 3200, estado: 'En curso' },
        { fecha: '05/11', equipo: 'P16', horas: '1 h', total: 1200, estado: 'Utilizada' }
      ],
      calificaciones: [{ fecha: '05/11', nota: 4, texto: 'La PC de oficina anduvo bien.' }],
      movimientos: [{ fecha: '05/11', detalle: 'Sesión P16 · 1 hora', valor: 20 }]
    },
    {
      id: 'CL-1155', nombre: 'Valentina Pérez', email: 'valentina.perez@mail.com', telefono: '+54 11 5521-9033',
      desde: '2023-11-07', visitas: 24, horas: 61, gasto: 195300, puntos: 780, ultima: 'Hoy · 23:00',
      rating: 5, estado: 'En el local', equipo: 'P21', tier: 'VIP',
      historial: [
        { fecha: 'Hoy', equipo: 'P21', horas: '1 h', total: 1200, estado: 'En curso' },
        { fecha: '27/10', equipo: 'P07', horas: '4 h', total: 18100, estado: 'Utilizada' }
      ],
      calificaciones: [{ fecha: '27/10', nota: 5, texto: 'Siempre todo listo cuando llego.' }],
      movimientos: [{ fecha: '27/10', detalle: 'Sesión P07 · 4 horas', valor: 80 }]
    },
    {
      id: 'CL-1190', nombre: 'Joaquín López', email: 'joaquin.lopez@mail.com', telefono: '+54 11 5533-6612',
      desde: '2025-03-22', visitas: 5, horas: 10, gasto: 32400, puntos: 90, ultima: 'Hoy · 22:30',
      rating: 4.5, estado: 'En el local', equipo: 'C02', tier: 'Habitual',
      historial: [{ fecha: 'Hoy', equipo: 'C02', horas: '2 h', total: 6400, estado: 'En curso' }],
      calificaciones: [{ fecha: '10/10', nota: 4, texto: 'Faltaba un mando, lo resolvieron rápido.' }],
      movimientos: [{ fecha: '10/10', detalle: 'Sesión C05 · 2 horas', valor: 40 }]
    },
    {
      id: 'CL-1204', nombre: 'Thiago Acosta', email: 'thiago.acosta@mail.com', telefono: '+54 11 5507-8890',
      desde: '2024-12-01', visitas: 9, horas: 19, gasto: 61800, puntos: 240, ultima: 'Hoy · 23:45',
      rating: 3.9, estado: 'En el local', equipo: 'C07', tier: 'Habitual',
      historial: [
        { fecha: 'Hoy', equipo: 'C07', horas: '1 h', total: 3200, estado: 'En curso' },
        { fecha: '19/10', equipo: 'C05', horas: '2 h', total: 8200, estado: 'Cancelada' }
      ],
      calificaciones: [{ fecha: '19/10', nota: 3, texto: 'El equipo se trabó al inicio.' }],
      movimientos: [{ fecha: '10/10', detalle: 'Sesión C07 · 2 horas', valor: 40 }]
    },
    {
      id: 'CL-1218', nombre: 'Camila Suárez', email: 'camila.suarez@mail.com', telefono: '+54 11 5564-1120',
      desde: '2026-09-14', visitas: 3, horas: 6, gasto: 18600, puntos: 60, ultima: 'Hoy · reserva 01:00',
      rating: 4.7, estado: 'Con reserva', equipo: 'P04', tier: 'Nuevo',
      historial: [
        { fecha: 'Hoy', equipo: 'P04', horas: '2 h', total: 5000, estado: 'Confirmada' },
        { fecha: '02/11', equipo: 'P15', horas: '2 h', total: 2400, estado: 'Utilizada' }
      ],
      calificaciones: [{ fecha: '02/11', nota: 5, texto: 'La zona de oficina es muy tranquila.' }],
      movimientos: [{ fecha: '02/11', detalle: 'Sesión P15 · 2 horas', valor: 40 }]
    },
    {
      id: 'CL-1233', nombre: 'Bruno Díaz', email: 'bruno.diaz@mail.com', telefono: '+54 11 5588-4501',
      desde: '2024-02-18', visitas: 15, horas: 33, gasto: 99800, puntos: 350, ultima: 'Hace 12 días',
      rating: 4.1, estado: 'Inactivo', equipo: '—', tier: 'En riesgo',
      historial: [
        { fecha: '05/11', equipo: 'P17', horas: '2 h', total: 3200, estado: 'Utilizada' },
        { fecha: '27/10', equipo: 'P23', horas: '1 h', total: 1600, estado: 'Utilizada' }
      ],
      calificaciones: [{ fecha: '05/11', nota: 4, texto: 'Todo correcto.' }],
      movimientos: [{ fecha: '05/11', detalle: 'Sesión P17 · 2 horas', valor: 40 }]
    }
  ];

  const reservas = [
    { id: 'R-901', cliente: 'Camila Suárez', telefono: '+54 11 5564-1120', equipo: 'P04', hora: '01:00', duracion: 2, estado: 'Confirmada', origen: 'Web', total: 5000 },
    { id: 'R-902', cliente: 'Lucas Martínez', telefono: '+54 11 5542-8801', equipo: 'P11', hora: '22:00', duracion: 2, estado: 'Confirmada', origen: 'App', total: 5000 },
    { id: 'R-903', cliente: 'Camila Suárez', telefono: '+54 11 5564-1120', equipo: 'C04', hora: '18:00', duracion: 3, estado: 'Confirmada', origen: 'Web', total: 8640 },
    { id: 'R-904', cliente: 'Bruno Díaz', telefono: '+54 11 5588-4501', equipo: 'P17', hora: '19:00', duracion: 2, estado: 'Confirmada', origen: 'Web', total: 3200 },
    { id: 'R-905', cliente: 'Sofía Ramírez', telefono: '+54 11 5518-2234', equipo: 'P24', hora: '21:00', duracion: 1, estado: 'Confirmada', origen: 'App', total: 1200 },
    { id: 'R-906', cliente: 'Bruno Díaz', telefono: '+54 11 5588-4501', equipo: 'P05', hora: '23:30', duracion: 1, estado: 'En gracia', origen: 'Web', total: 2500 },
    { id: 'R-907', cliente: 'Valentina Pérez', telefono: '+54 11 5521-9033', equipo: 'P01', hora: '23:00', duracion: 1, estado: 'Finalizada', origen: 'App', total: 2500 }
  ];

  const pagos = [
    { id: 'PG-881', hora: '00:12', cliente: 'Lucas Martínez', equipo: 'P02', concepto: 'Extensión 2 h', medio: 'Efectivo', monto: 5000 },
    { id: 'PG-880', hora: '23:48', cliente: 'Joaquín López', equipo: 'C02', concepto: 'Extensión 1 h', medio: 'Digital', monto: 3200 },
    { id: 'PG-879', hora: '23:30', cliente: 'Venta mostrador', equipo: 'Kiosco', concepto: 'Combo + energizante', medio: 'Efectivo', monto: 5400 },
    { id: 'PG-878', hora: '23:05', cliente: 'Sofía Ramírez', equipo: 'Impresión', concepto: '14 páginas B/N', medio: 'Efectivo', monto: 2100 },
    { id: 'PG-877', hora: '22:40', cliente: 'Valentina Pérez', equipo: 'P21', concepto: 'Extensión 1 h', medio: 'Efectivo', monto: 1200 },
    { id: 'PG-876', hora: '22:15', cliente: 'Mateo González', equipo: 'P14', concepto: 'Extensión 1 h', medio: 'Digital', monto: 1600 }
  ];

  const kiosco = [
    { id: 'K01', nombre: 'Gaseosa 500 ml', categoria: 'Bebidas', precio: 2500, stock: 18, minimo: 8, icono: 'cup', tema: 'cyan' },
    { id: 'K02', nombre: 'Energizante', categoria: 'Bebidas', precio: 3600, stock: 12, minimo: 6, icono: 'zap', tema: 'violet' },
    { id: 'K03', nombre: 'Agua mineral 500 ml', categoria: 'Bebidas', precio: 1800, stock: 27, minimo: 10, icono: 'cup', tema: 'cyan' },
    { id: 'K04', nombre: 'Papas grandes', categoria: 'Snacks', precio: 2900, stock: 6, minimo: 10, icono: 'tag', tema: 'pink' },
    { id: 'K05', nombre: 'Barrita de cereal', categoria: 'Snacks', precio: 1500, stock: 24, minimo: 8, icono: 'star', tema: 'cyan' },
    { id: 'K06', nombre: 'Café en grano', categoria: 'Cafetería', precio: 1800, stock: 4, minimo: 6, icono: 'cup', tema: 'violet' },
    { id: 'K07', nombre: 'Combo gaseosa + papas', categoria: 'Combos', precio: 4900, stock: 9, minimo: 5, icono: 'shopping-cart', tema: 'pink' },
    { id: 'K08', nombre: 'Auriculares gamer', categoria: 'Accesorios', precio: 4500, stock: 5, minimo: 3, icono: 'headphones', tema: 'violet' }
  ];

  const movimientosKiosco = [
    { id: 'MK-1', hora: '23:30', tipo: 'Venta', detalle: 'Combo gaseosa + papas x1, Energizante x1', cantidad: 2, usuario: 'Valentina R.' },
    { id: 'MK-2', hora: '22:10', tipo: 'Ingreso', detalle: 'Reposición de papas grandes', cantidad: 12, usuario: 'Valentina R.' },
    { id: 'MK-3', hora: '21:45', tipo: 'Venta', detalle: 'Gaseosa 500 ml x2, Barrita x1', cantidad: 3, usuario: 'Valentina R.' }
  ];

  const pedidos = [
    {
      id: 'K-501', equipo: 'P08', cliente: 'Sofía Ramírez', hora: '23:52', estado: 'Pendiente', total: 5400,
      items: [{ id: 'K01', nombre: 'Gaseosa 500 ml', cantidad: 1, precio: 2500 }, { id: 'K04', nombre: 'Papas grandes', cantidad: 1, precio: 2900 }]
    },
    {
      id: 'K-502', equipo: 'C07', cliente: 'Thiago Acosta', hora: '23:58', estado: 'Preparando', total: 7200,
      items: [{ id: 'K02', nombre: 'Energizante', cantidad: 2, precio: 3600 }]
    },
    {
      id: 'K-503', equipo: 'P21', cliente: 'Valentina Pérez', hora: '00:05', estado: 'Pendiente', total: 3300,
      items: [{ id: 'K06', nombre: 'Café en grano', cantidad: 1, precio: 1800 }, { id: 'K05', nombre: 'Barrita de cereal', cantidad: 1, precio: 1500 }]
    }
  ];

  const impresiones = [
    { id: 'IMP-2401', cliente: 'Sofía Ramírez', equipo: 'P08', archivo: 'tp-final.pdf', paginas: 14, modo: 'B/N', monto: 2100, pago: 'Efectivo', estado: 'Recibido', origen: 'Web', hora: '23:44' },
    { id: 'IMP-2402', cliente: 'Joaquín López', equipo: 'C02', archivo: 'apunte-color.pdf', paginas: 6, modo: 'Color', monto: 3000, pago: 'Digital', estado: 'En impresión', origen: 'App', hora: '23:39' },
    { id: 'IMP-2403', cliente: 'Bruno Díaz', equipo: 'P15', archivo: 'cv-bruno.pdf', paginas: 22, modo: 'B/N', monto: 3300, pago: 'Puntos', estado: 'Listo', origen: 'Web', hora: '23:12' },
    { id: 'IMP-2404', cliente: 'Mostrador', equipo: 'Kiosco', archivo: 'Fotocopia DNI', paginas: 8, modo: 'B/N', monto: 1200, pago: 'Efectivo', estado: 'Recibido', origen: 'Fotocopia', hora: '23:51' },
    { id: 'IMP-2405', cliente: 'Lucas Martínez', equipo: 'P02', archivo: 'figura.png', paginas: 3, modo: 'Color', monto: 1500, pago: 'Digital', estado: 'Retirado', origen: 'App', hora: '22:58' }
  ];

  const mensajes = [
    { id: 'M-1', equipo: 'C07', cliente: 'Thiago Acosta', texto: 'Tu tiempo está por terminar. Podés extenderlo desde la app o en el mostrador.', hora: '23:40', estado: 'Leído', operador: 'Valentina R.' },
    { id: 'M-2', equipo: 'P08', cliente: 'Sofía Ramírez', texto: 'Tu pedido está listo para retirar en el kiosco.', hora: '23:35', estado: 'Entregado', operador: 'Valentina R.' },
    { id: 'M-3', equipo: 'P19', cliente: '—', texto: 'Equipo en mantenimiento programado. Disculpá las molestias.', hora: '22:10', estado: 'Enviado', operador: 'Valentina R.' }
  ];

  const actividad = [
    { icono: 'banknote', tono: 'green', titulo: 'Pago en efectivo registrado', detalle: 'Lucas Martínez · P02 · 2 h · $ 5.000', hora: 'Hace 4 min' },
    { icono: 'shopping-cart', tono: 'cyan', titulo: 'Pedido de kiosco recibido', detalle: 'P08 · Sofía Ramírez · $ 5.400', hora: 'Hace 8 min' },
    { icono: 'printer', tono: 'violet', titulo: 'Trabajo de impresión listo', detalle: 'IMP-2403 · Bruno Díaz · 22 páginas', hora: 'Hace 14 min' },
    { icono: 'calendar', tono: 'amber', titulo: 'Reserva próxima', detalle: 'P04 · Camila Suárez · 01:00', hora: 'Hace 18 min' },
    { icono: 'power', tono: 'red', titulo: 'Equipo reiniciado', detalle: 'C02 · Joaquín López · sesión conservada', hora: 'Hace 26 min' },
    { icono: 'message-square', tono: 'cyan', titulo: 'Mensaje enviado a pantalla', detalle: 'C07 · aviso de tiempo restante', hora: 'Hace 32 min' },
    { icono: 'package', tono: 'amber', titulo: 'Alerta de stock bajo', detalle: 'Café en grano · quedan 4 unidades', hora: 'Hace 41 min' },
    { icono: 'briefcase', tono: 'violet', titulo: 'Equipo liberado por mantenimiento', detalle: 'P19 · actualización finalizada', hora: 'Hace 55 min' }
  ];

  const reportes = {
    dias: [
      { label: 'Lun', ingresos: 62000, clientes: 24, horas: 42 },
      { label: 'Mar', ingresos: 78500, clientes: 30, horas: 51 },
      { label: 'Mié', ingresos: 55300, clientes: 22, horas: 37 },
      { label: 'Jue', ingresos: 91200, clientes: 36, horas: 60 },
      { label: 'Vie', ingresos: 120400, clientes: 44, horas: 74 },
      { label: 'Sáb', ingresos: 143800, clientes: 52, horas: 88 },
      { label: 'Dom', ingresos: 96800, clientes: 38, horas: 61 }
    ],
    equiposTop: [
      { id: 'P03', zona: 'Zona Pro', horas: 86, pct: 100 },
      { id: 'P07', zona: 'Zona Pro', horas: 74, pct: 86 },
      { id: 'C01', zona: 'Consolas', horas: 68, pct: 79 },
      { id: 'P21', zona: 'Zona Oficina', horas: 61, pct: 71 },
      { id: 'P15', zona: 'Zona Oficina', horas: 58, pct: 67 }
    ],
    franjas: [
      { label: '00 a 06', pct: 18, tone: 'violet' },
      { label: '06 a 12', pct: 12, tone: 'cyan' },
      { label: '12 a 18', pct: 28, tone: 'amber' },
      { label: '18 a 24', pct: 42, tone: 'pink' }
    ],
    lineas: [
      { label: 'Gaming', monto: 152400, pct: 46, tone: 'cyan' },
      { label: 'Oficina', monto: 72100, pct: 22, tone: 'violet' },
      { label: 'Consolas', monto: 66400, pct: 20, tone: 'pink' },
      { label: 'Kiosco', monto: 26800, pct: 8, tone: 'amber' },
      { label: 'Impresiones', monto: 13100, pct: 4, tone: 'green' }
    ]
  };

  const plantillas = [
    { id: 'tiempo', titulo: 'Tiempo por terminar', texto: 'Tu tiempo está por terminar. Podés extenderlo desde la app o en el mostrador.' },
    { id: 'pedido', titulo: 'Pedido listo', texto: 'Tu pedido está listo para retirar en el kiosco.' },
    { id: 'reserva', titulo: 'Reserva por iniciar', texto: 'Tu reserva comienza en 10 minutos. Acercate al equipo para iniciar sesión.' },
    { id: 'mantenimiento', titulo: 'Aviso de mantenimiento', texto: 'Vamos a realizar una actualización programada. Guardá tu trabajo, el equipo se reiniciará en 5 minutos.' }
  ];

  return { operador, equipos, clientes, reservas, pagos, kiosco, movimientosKiosco, pedidos, impresiones, mensajes, actividad, reportes, plantillas };
})();

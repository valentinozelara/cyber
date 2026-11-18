/* Datos de demostración del sistema Cyber 24 Horas */
window.CyberData = (function () {
  const hoyISO = (offset = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };

  const estadoInfo = {
    disponible: { label: 'Disponible', color: '#34d399', corto: 'Libre' },
    reservado: { label: 'Reservado', color: '#fbbf24', corto: 'Reservado' },
    ocupado: { label: 'Ocupado', color: '#f43f5e', corto: 'En sesión' },
    mantenimiento: { label: 'No disponible', color: '#64748b', corto: 'Mantenimiento' }
  };

  const equipos = [
    // Zona Pro
    { id: 'P01', tipo: 'pc', zona: 'Zona Pro', estado: 'disponible', specs: 'RTX 4060 · i5-13400F · 16 GB', precio: 2500 },
    { id: 'P02', tipo: 'pc', zona: 'Zona Pro', estado: 'ocupado', specs: 'RTX 4060 · i5-13400F · 16 GB', precio: 2500, cliente: 'Lucas M.', restante: 42, desde: 'hace 1 h 18 min' },
    { id: 'P03', tipo: 'pc', zona: 'Zona Pro', estado: 'disponible', specs: 'RTX 4070 · i7-13700F · 32 GB', precio: 3000 },
    { id: 'P04', tipo: 'pc', zona: 'Zona Pro', estado: 'reservado', specs: 'RTX 4060 · i5-13400F · 16 GB', precio: 2500, reservaHora: '20:00' },
    { id: 'P05', tipo: 'pc', zona: 'Zona Pro', estado: 'disponible', specs: 'RTX 4060 · i5-13400F · 16 GB', precio: 2500 },
    { id: 'P06', tipo: 'pc', zona: 'Zona Pro', estado: 'mantenimiento', specs: 'RTX 3060 · i5-12400F · 16 GB', precio: 2200, motivo: 'Service programado' },
    { id: 'P07', tipo: 'pc', zona: 'Zona Pro', estado: 'disponible', specs: 'RTX 4070 · i7-13700F · 32 GB', precio: 3000 },
    { id: 'P08', tipo: 'pc', zona: 'Zona Pro', estado: 'ocupado', specs: 'RTX 4060 · i5-13400F · 16 GB', precio: 2500, cliente: 'Sofía R.', restante: 96, desde: 'hace 24 min' },
    { id: 'P09', tipo: 'pc', zona: 'Zona Pro', estado: 'disponible', specs: 'RTX 4060 · i5-13400F · 16 GB', precio: 2500 },
    { id: 'P10', tipo: 'pc', zona: 'Zona Pro', estado: 'disponible', specs: 'RTX 4060 · i5-13400F · 16 GB', precio: 2500 },
    { id: 'P11', tipo: 'pc', zona: 'Zona Pro', estado: 'reservado', specs: 'RTX 4070 · i7-13700F · 32 GB', precio: 3000, reservaHora: '22:00' },
    { id: 'P12', tipo: 'pc', zona: 'Zona Pro', estado: 'disponible', specs: 'RTX 4060 · i5-13400F · 16 GB', precio: 2500 },

    // Zona Oficina
    { id: 'P13', tipo: 'pc', zona: 'Zona Oficina', estado: 'disponible', specs: 'i7-12700 · 32 GB · SSD 1 TB · Office 365', precio: 1600 },
    { id: 'P14', tipo: 'pc', zona: 'Zona Oficina', estado: 'ocupado', specs: 'i7-12700 · 32 GB · SSD 1 TB · Office 365', precio: 1600, cliente: 'Mateo G.', restante: 18, desde: 'hace 2 h 12 min' },
    { id: 'P15', tipo: 'pc', zona: 'Zona Oficina', estado: 'disponible', specs: 'i5-12400 · 16 GB · SSD 512 GB · Office 365', precio: 1200 },
    { id: 'P16', tipo: 'pc', zona: 'Zona Oficina', estado: 'disponible', specs: 'i5-12400 · 16 GB · SSD 512 GB · Office 365', precio: 1200 },
    { id: 'P17', tipo: 'pc', zona: 'Zona Oficina', estado: 'reservado', specs: 'i7-12700 · 32 GB · SSD 1 TB · Office 365', precio: 1600, reservaHora: '19:00' },
    { id: 'P18', tipo: 'pc', zona: 'Zona Oficina', estado: 'disponible', specs: 'i5-12400 · 16 GB · SSD 512 GB · Office 365', precio: 1200 },
    { id: 'P19', tipo: 'pc', zona: 'Zona Oficina', estado: 'mantenimiento', specs: 'i5-12400 · 16 GB · SSD 512 GB · Office 365', precio: 1200, motivo: 'Service programado' },
    { id: 'P20', tipo: 'pc', zona: 'Zona Oficina', estado: 'disponible', specs: 'i5-12400 · 16 GB · SSD 512 GB · Office 365', precio: 1200 },
    { id: 'P21', tipo: 'pc', zona: 'Zona Oficina', estado: 'ocupado', specs: 'i5-12400 · 16 GB · SSD 512 GB · Office 365', precio: 1200, cliente: 'Valentina P.', restante: 64, desde: 'hace 56 min' },
    { id: 'P22', tipo: 'pc', zona: 'Zona Oficina', estado: 'disponible', specs: 'i5-12400 · 16 GB · SSD 512 GB · Office 365', precio: 1200 },
    { id: 'P23', tipo: 'pc', zona: 'Zona Oficina', estado: 'disponible', specs: 'i7-12700 · 32 GB · SSD 1 TB · Office 365', precio: 1600 },
    { id: 'P24', tipo: 'pc', zona: 'Zona Oficina', estado: 'reservado', specs: 'i5-12400 · 16 GB · SSD 512 GB · Office 365', precio: 1200, reservaHora: '21:00' },

    // Consolas
    { id: 'C01', tipo: 'consola', zona: 'Consolas', estado: 'disponible', specs: 'PS5 · TV 55" 4K · 2 mandos', precio: 3200 },
    { id: 'C02', tipo: 'consola', zona: 'Consolas', estado: 'ocupado', specs: 'PS5 · TV 55" 4K · 2 mandos', precio: 3200, cliente: 'Joaquín L.', restante: 35, desde: 'hace 1 h 25 min' },
    { id: 'C03', tipo: 'consola', zona: 'Consolas', estado: 'disponible', specs: 'Xbox Series X · TV 55" 4K', precio: 3200 },
    { id: 'C04', tipo: 'consola', zona: 'Consolas', estado: 'reservado', specs: 'PS5 · TV 55" 4K · 2 mandos', precio: 3200, reservaHora: '18:00' },
    { id: 'C05', tipo: 'consola', zona: 'Consolas', estado: 'disponible', specs: 'Xbox Series X · TV 55" 4K', precio: 3200 },
    { id: 'C06', tipo: 'consola', zona: 'Consolas', estado: 'disponible', specs: 'PS5 · Monitor 240 Hz · 1 mando', precio: 2800 },
    { id: 'C07', tipo: 'consola', zona: 'Consolas', estado: 'ocupado', specs: 'PS5 · TV 55" 4K · 2 mandos', precio: 3200, cliente: 'Thiago A.', restante: 12, desde: 'hace 2 h 48 min' },
    { id: 'C08', tipo: 'consola', zona: 'Consolas', estado: 'disponible', specs: 'Xbox Series X · TV 55" 4K', precio: 3200 }
  ];

  // Bloqueos de demostración (se repiten todos los días para poder probar la reserva)
  const bloqueos = [
    { equipo: 'P02', inicio: 15, fin: 18 },
    { equipo: 'P03', inicio: 18, fin: 20 },
    { equipo: 'P07', inicio: 20, fin: 22 },
    { equipo: 'P08', inicio: 21, fin: 24 },
    { equipo: 'P11', inicio: 22, fin: 24 },
    { equipo: 'P14', inicio: 22, fin: 24 },
    { equipo: 'P17', inicio: 19, fin: 21 },
    { equipo: 'P21', inicio: 13, fin: 16 },
    { equipo: 'P23', inicio: 21, fin: 23 },
    { equipo: 'P24', inicio: 21, fin: 23 },
    { equipo: 'P04', inicio: 20, fin: 22 },
    { equipo: 'C02', inicio: 19, fin: 22 },
    { equipo: 'C04', inicio: 18, fin: 20 },
    { equipo: 'C06', inicio: 20, fin: 23 },
    { equipo: 'C07', inicio: 12, fin: 15 }
  ];

  const precios = {
    pc: [
      {
        id: 'pc-hora', nombre: 'Hora libre', precio: 2500, unidad: 'por hora', destacado: false,
        detalle: 'Elegí el equipo que quieras del mapa y jugá o trabajá el tiempo que necesites.',
        features: ['PC con RTX 4060 o superior', 'Internet 1 Gbps simétrico', 'Periféricos gamer incluidos', 'Silla ergonómica']
      },
      {
        id: 'pc-pack', nombre: 'Pack 3 horas', precio: 6750, unidad: 'pack', destacado: true,
        detalle: 'El más elegido para sesiones largas. Ahorrás un 10% frente a la tarifa por hora.',
        features: ['3 horas continuas', '10% de descuento', 'Cambio de equipo sujeto a disponibilidad', 'Puntos de fidelidad x2']
      },
      {
        id: 'pc-madrugada', nombre: 'Madrugada', precio: 1800, unidad: 'por hora', destacado: false,
        detalle: 'De 00:00 a 07:00, la tarifa más baja del día para los que juegan hasta tarde.',
        features: ['Tarifa reducida', 'Café de cortesía', 'Zona Pro habilitada', 'Disponible todos los días']
      }
    ],
    oficina: [
      {
        id: 'of-hora', nombre: 'Hora de oficina', precio: 1200, unidad: 'por hora', destacado: false,
        detalle: 'PC preparada para estudiar, redactar documentos y resolver trabajos prácticos con Office y conexión estable.',
        features: ['Office 365 y Google Workspace', 'Monitor 24" Full HD + webcam', 'Internet 1 Gbps simétrico', 'Impresión desde tu puesto']
      },
      {
        id: 'of-pack', nombre: 'Pack 3 horas', precio: 3240, unidad: 'pack', destacado: true,
        detalle: 'Tres horas seguidas con 10% de descuento. Ideal para entregas, parciales o trámites largos.',
        features: ['3 horas continuas', '10% de descuento', 'Office, PDF y almacenamiento en la nube', 'Puntos de fidelidad x2']
      },
      {
        id: 'of-dia', nombre: 'Jornada de trabajo', precio: 6500, unidad: 'hasta 8 h', destacado: false, cta: 'Consultar disponibilidad',
        detalle: 'Ocho horas para proyectos largos, con impresiones incluidas y café de cortesía.',
        features: ['Hasta 8 horas continuas', '10 impresiones B/N incluidas', 'Café de cortesía', 'Archivos guardados en la nube']
      }
    ],
    consola: [
      {
        id: 'co-hora', nombre: 'Hora libre', precio: 3200, unidad: 'por hora', destacado: false,
        detalle: 'PS5 o Xbox Series X con TV 4K y mandos incluidos. Ideal para partidas casuales.',
        features: ['PS5 / Xbox Series X', 'TV 55" 4K HDR', '2 mandos incluidos', 'Catálogo de juegos']
      },
      {
        id: 'co-pack', nombre: 'Pack 3 horas', precio: 8640, unidad: 'pack', destacado: true,
        detalle: 'Tres horas de consola con 10% de descuento y reserva de sala privada.',
        features: ['3 horas continuas', '10% de descuento', 'Sala con sillones', 'Puntos de fidelidad x2']
      },
      {
        id: 'co-torneo', nombre: 'Práctica de torneo', precio: 2500, unidad: 'por hora', destacado: false,
        detalle: 'Tarifa especial para jugadores inscriptos en torneos del cyber.',
        features: ['Requiere inscripción', 'Setup competitivo', 'Monitor 240 Hz', 'Entrenamiento con coach']
      }
    ]
  };

  const promos = [
    {
      id: 'promo-1', badge: '2x1', titulo: 'Martes de oficina', subtitulo: '2 horas al precio de 1',
      detalle: 'Todos los martes de 09:00 a 18:00 en las PCs de Zona Oficina. Ideal para trámites, estudio y trabajos prácticos.',
      vigencia: 'Hasta el 29/12/2026', codigo: 'OFICINA2X1', tema: 'cyan', icono: 'briefcase'
    },
    {
      id: 'promo-2', badge: '-25%', titulo: 'Combo kiosco + hora', subtitulo: '25% off en snacks',
      detalle: 'Reservá una hora o más y llevate el combo gaseosa + papas con 25% de descuento en el kiosco.',
      vigencia: 'Todos los días, 10:00 a 18:00', codigo: 'COMBO25', tema: 'violet', icono: 'cup'
    },
    {
      id: 'promo-3', badge: 'Puntos x2', titulo: 'Viernes de fidelidad', subtitulo: 'Duplicá tus puntos',
      detalle: 'Las sesiones de los viernes suman el doble de puntos. Canjealos por horas gratis o impresiones.',
      vigencia: 'Todos los viernes', codigo: 'FIDELIDAD2X', tema: 'pink', icono: 'gift'
    }
  ];

  const torneos = [
    {
      id: 't-1', juego: 'Valorant', titulo: 'Copa Cyber Nocturna', fecha: '21/11/2026', hora: '18:00',
      formato: '5v5 · Eliminación directa', premio: '$ 250.000 + 10 h de juego',
      cupos: 16, inscriptos: 12, tema: 'violet', icono: 'trophy'
    },
    {
      id: 't-2', juego: 'EA FC 26', titulo: 'Torneo 1v1 Relámpago', fecha: '28/11/2026', hora: '20:00',
      formato: '1v1 · Bo3', premio: '$ 80.000 + mando inalámbrico',
      cupos: 32, inscriptos: 21, tema: 'cyan', icono: 'gamepad'
    },
    {
      id: 't-3', juego: 'Tekken 8', titulo: 'Rey del Arcade', fecha: '05/12/2026', hora: '19:00',
      formato: '1v1 · Doble eliminación', premio: '$ 60.000 + puntos x3',
      cupos: 24, inscriptos: 9, tema: 'pink', icono: 'dice'
    }
  ];

  const kiosco = [
    { id: 'k1', nombre: 'Gaseosa 500 ml', categoria: 'Bebidas', precio: 2500, icono: 'cup', tema: 'cyan' },
    { id: 'k2', nombre: 'Energizante', categoria: 'Bebidas', precio: 3600, icono: 'zap', tema: 'violet' },
    { id: 'k3', nombre: 'Papas grandes', categoria: 'Snacks', precio: 2900, icono: 'tag', tema: 'pink' },
    { id: 'k4', nombre: 'Barrita de cereal', categoria: 'Snacks', precio: 1500, icono: 'star', tema: 'cyan' },
    { id: 'k5', nombre: 'Café en grano', categoria: 'Cafetería', precio: 1800, icono: 'cup', tema: 'violet' },
    { id: 'k6', nombre: 'Impresión B/N', categoria: 'Servicios', precio: 150, icono: 'printer', tema: 'pink' }
  ];

  const reservasDemo = [
    { id: 'r-demo-1', codigo: 'CYB-2841', equipo: 'P05', fecha: hoyISO(1), inicio: 18, duracion: 2, total: 5000, estado: 'confirmada', origen: 'Web' },
    { id: 'r-demo-2', codigo: 'CYB-1937', equipo: 'C03', fecha: hoyISO(2), inicio: 21, duracion: 3, total: 8640, estado: 'confirmada', origen: 'App' },
    { id: 'r-demo-3', codigo: 'CYB-3156', equipo: 'P15', fecha: hoyISO(3), inicio: 9, duracion: 2, total: 2400, estado: 'confirmada', origen: 'Web' }
  ];

  const historial = [
    { fecha: '12/11/2026', equipo: 'P09', horas: 2, kiosco: 3400, impresiones: 0, total: 8400, estado: 'Utilizada' },
    { fecha: '08/11/2026', equipo: 'C01', horas: 3, kiosco: 5200, impresiones: 0, total: 14800, estado: 'Utilizada' },
    { fecha: '03/11/2026', equipo: 'P03', horas: 1.5, kiosco: 0, impresiones: 450, total: 4950, estado: 'Utilizada' },
    { fecha: '27/10/2026', equipo: 'P07', horas: 4, kiosco: 6100, impresiones: 0, total: 18100, estado: 'Utilizada' },
    { fecha: '19/10/2026', equipo: 'C05', horas: 2, kiosco: 1800, impresiones: 0, total: 8200, estado: 'Cancelada' }
  ];

  const puntos = {
    saldo: 1240,
    objetivo: 1500,
    movimientos: [
      { fecha: '12/11/2026', detalle: 'Sesión P09 · 2 horas', tipo: 'acumulado', valor: 40 },
      { fecha: '08/11/2026', detalle: 'Sesión C01 · 3 horas', tipo: 'acumulado', valor: 60 },
      { fecha: '05/11/2026', detalle: 'Canje · 1 hora libre', tipo: 'canjeado', valor: -100 },
      { fecha: '03/11/2026', detalle: 'Sesión P03 · 1,5 horas', tipo: 'acumulado', valor: 20 },
      { fecha: '28/10/2026', detalle: 'Bonus por calificación', tipo: 'acumulado', valor: 25 }
    ]
  };

  const formatearPrecio = (n) => '$ ' + Number(n).toLocaleString('es-AR');

  return { equipos, estadoInfo, bloqueos, precios, promos, torneos, kiosco, reservasDemo, historial, puntos, formatearPrecio, hoyISO };
})();

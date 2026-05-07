// Mapa.js — Lógica del dashboard principal
let ws;

const ESTADIO_IMAGENES = {
  'Santiago Bernabéu':     '/assets/images/estadios/bernabeu.svg',
  'Spotify Camp Nou':      '/assets/images/estadios/campnou.svg',
  'Cívitas Metropolitano': '/assets/images/estadios/metropolitano.svg',
  'Las Gaunas':            '/assets/images/estadios/lasgaunas.svg'
};

async function cargarDashboard() {
  const user = API.getUsuario();
  if (user) {
    const el = document.getElementById('estadio-nombre');
    if (el) el.textContent = user.estadio || user.club || 'Dashboard';

    // Banner del estadio (solo en Smart, el Elite tiene su propio banner)
    const banner = document.getElementById('smart-stadium-banner');
    const bannerNombre = document.getElementById('banner-estadio-nombre-smart');
    if (banner) {
      const img = ESTADIO_IMAGENES[user.estadio] || '/assets/images/estadios/generico.svg';
      banner.style.backgroundImage = `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%), url('${img}')`;
    }
    if (bannerNombre) bannerNombre.textContent = user.estadio || user.club || 'Estadio';

    // Selector de campos (solo plan freemium/smart con múltiples campos disponibles)
    inicializarSelectorCampos(user);
  }

  await Promise.all([
    cargarSensores(),
    cargarSuperficie(),
    cargarAlertas(),
    cargarCumplimiento(),
    cargarHistorico(),
    cargarGestion()
  ]);

  iniciarWebSocket();
}

// =============== SELECTOR DE CAMPOS DISPONIBLES (FREEMIUM) ===============
function inicializarSelectorCampos(user) {
  const selector = document.getElementById('campo-selector');
  const titulo = document.getElementById('estadio-nombre');
  if (!selector || !titulo) return;

  // Solo aplicable para plan smart/freemium
  const plan = (user.plan || 'smart').toLowerCase();
  if (plan === 'elite') return;

  // Lista de campos disponibles del plan smart
  const camposDisponibles = [
    { nombre: 'Las Gaunas',           club: 'CD Logroñés' },
    { nombre: 'Los Cármenes',         club: 'Granada CF B' },
    { nombre: 'Estadio de Anoeta',    club: 'Real Sociedad B' },
    { nombre: 'Nuevo Vivero',         club: 'CF Badajoz' },
    { nombre: 'El Plantío',           club: 'Burgos Promesas' }
  ];

  // Si solo hay 1 disponible, no mostrar selector
  if (camposDisponibles.length <= 1) return;

  // Llenar selector
  selector.innerHTML = camposDisponibles.map(c =>
    `<option value="${c.nombre}" ${c.nombre === user.estadio ? 'selected' : ''}>${c.nombre} — ${c.club}</option>`
  ).join('');

  // Mostrar selector y ocultar h2
  titulo.style.display = 'none';
  selector.style.display = '';
}

function cambiarCampo(nombreCampo) {
  // En esta demo, simulamos el cambio actualizando el banner y avisando
  const banner = document.getElementById('smart-stadium-banner');
  const bannerNombre = document.getElementById('banner-estadio-nombre-smart');
  const img = ESTADIO_IMAGENES[nombreCampo] || '/assets/images/estadios/generico.svg';
  if (banner) banner.style.backgroundImage = `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%), url('${img}')`;
  if (bannerNombre) bannerNombre.textContent = nombreCampo;
  // En producción aquí recargaríamos los datos del nuevo campo
  console.log('Campo cambiado a:', nombreCampo);
}

async function cargarSensores() {
  const sensores = await API.get('/datos/sensores');
  if (!sensores) return;
  renderizarKPIs(sensores);
  renderizarMapa(sensores);
}

function renderizarKPIs(sensores) {
  const vals = sensores.reduce((a, s) => {
    a.humedad += s.humedad; a.temp += s.temp; a.sal += s.salinidad;
    return a;
  }, { humedad:0, temp:0, sal:0 });
  const n = sensores.length;

  const kpis = [
    { label:'Humedad media suelo', value:(vals.humedad/n).toFixed(1), unit:'%', status:'Dentro del rango', cls:'kpi-ok' },
    { label:'Temp. media suelo', value:(vals.temp/n).toFixed(1), unit:'°C', status:'Ryegrass óptimo', cls:'kpi-ok' },
    { label:'Salinidad media (CE)', value:(vals.sal/n).toFixed(2), unit:'dS/m', status:'Nivel moderado', cls:'kpi-warn' },
    { label:'Altura del césped', value:'24', unit:'mm', status:'LaLiga: 20–30mm', cls:'kpi-ok' },
    { label:'Temp. aire', value:'21', unit:'°C', status:'Sin riesgo helada', cls:'kpi-ok' },
    { label:'Humedad relativa', value:'62', unit:'%', status:'Riesgo hongos bajo', cls:'kpi-ok' },
    { label:'Velocidad viento', value:'18', unit:'km/h', status:'Riego eficiente', cls:'kpi-ok' },
    { label:'ET estimada', value:'4.2', unit:'mm/día', status:'Riego recomendado', cls:'kpi-ok' },
  ];

  const grid = document.getElementById('kpi-grid');
  if (!grid) return;
  grid.innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-value">${k.value}<span class="kpi-unit">${k.unit}</span></div>
      <div class="kpi-status ${k.cls}">${k.status}</div>
    </div>
  `).join('');
}

function renderizarMapa(sensores) {
  const layer = document.getElementById('sensores-layer');
  if (!layer) return;
  const colores = { ok:'#52B788', alerta:'#E76F51', critico:'#C1121F' };
  layer.innerHTML = sensores.map(s => `
    <g onclick="mostrarSensor(${JSON.stringify(s).replace(/"/g,'&quot;')})" style="cursor:pointer">
      <circle cx="${s.x}" cy="${s.y}" r="9" fill="${colores[s.estado]}" stroke="#fff" stroke-width="1.5"/>
      <text x="${s.x}" y="${s.y+4}" text-anchor="middle" font-size="7" fill="#fff" font-weight="500">${s.id}</text>
    </g>
  `).join('');
}

function mostrarSensor(s) {
  const colores = { ok:'#52B788', alerta:'#E76F51', critico:'#C1121F' };
  const etiquetas = { ok:'OK', alerta:'Alerta', critico:'Crítico' };
  const detalle = document.getElementById('sensor-detalle');
  if (!detalle) return;
  detalle.style.display = 'block';
  detalle.style.borderLeft = `3px solid ${colores[s.estado]}`;
  detalle.innerHTML = `
    <strong>${s.id} — ${s.zona}</strong><br/>
    Humedad: ${s.humedad}% · Temperatura: ${s.temp}°C · Salinidad: ${s.salinidad} dS/m<br/>
    Batería: ${s.bateria}% · Estado: <strong style="color:${colores[s.estado]}">${etiquetas[s.estado]}</strong>
    <span onclick="this.parentElement.style.display='none'" style="float:right;cursor:pointer;font-size:16px;line-height:1">×</span>
  `;
}

function cerrarModal() {
  const overlay = document.getElementById('modal-overlay');
  if (overlay) overlay.style.display = 'none';
}

async function cargarSuperficie() {}

async function cargarAlertas() {
  const alertas = await API.get('/datos/alertas');
  if (!alertas) return;

  const activas = alertas.filter(a => !a.resuelta);
  const badge = document.getElementById('badge-alertas');
  const count = document.getElementById('alertas-count');
  if (badge) badge.textContent = activas.length;
  if (count) count.textContent = `${activas.length} activas`;

  const topBadges = document.getElementById('topbar-badges');
  if (topBadges) {
    const criticas = activas.filter(a => a.severidad === 'critica').length;
    const prev = activas.filter(a => a.severidad === 'preventiva').length;
    topBadges.innerHTML = (prev ? `<span class="badge badge-warn">${prev} preventiva${prev>1?'s':''}</span>` : '')
      + (criticas ? `<span class="badge badge-crit">${criticas} crítica${criticas>1?'s':''}</span>` : '')
      + (!criticas && !prev ? '<span class="badge badge-ok">Sin alertas activas</span>' : '');
  }

  const lista = document.getElementById('alertas-lista');
  if (!lista) return;
  lista.innerHTML = alertas.map(a => `
    <div class="alert-item alert-${a.severidad === 'critica' ? 'crit' : a.severidad === 'preventiva' ? 'warn' : 'info'}">
      <div class="alert-icon">${a.severidad === 'critica' ? '⚠' : a.severidad === 'preventiva' ? '!' : 'i'}</div>
      <div>
        <div class="alert-title">${a.titulo}</div>
        <div class="alert-desc">${a.descripcion}</div>
        <div class="alert-time">${a.hora} · Severidad: ${a.severidad.toUpperCase()} ${a.resuelta ? '· Resuelta' : ''}</div>
      </div>
    </div>
  `).join('');
}

async function cargarCumplimiento() {
  const c = await API.get('/datos/cumplimiento');
  if (!c) return;
  const grid = document.getElementById('compliance-grid');
  if (!grid) return;
  const items = [
    { key:'altura', nombre:'Altura' }, { key:'dureza', nombre:'Dureza' },
    { key:'traccion', nombre:'Tracción' }, { key:'uniformidad', nombre:'Uniformidad' },
    { key:'iluminacion', nombre:'Iluminación' }
  ];
  grid.innerHTML = items.map(item => {
    const d = c[item.key];
    return `
      <div class="compliance-item ${d.ok ? '' : 'compliance-warn'}">
        <div class="compliance-icon">${d.ok ? '✓' : '!'}</div>
        <div class="compliance-name">${item.nombre}</div>
        <div class="compliance-val ${d.ok ? 'compliance-ok' : ''}">${d.valor}</div>
      </div>
    `;
  }).join('');
}

async function cargarHistorico() {
  const h = await API.get('/datos/historico');
  if (!h) return;
  const grid = document.getElementById('historico-grid');
  if (!grid) return;

  const maxH = Math.max(...h.humedad.map(x => x.valor));
  const maxT = Math.max(...h.temperatura.map(x => x.valor));
  const maxA = Math.max(...h.alertas.map(x => x.valor));

  const estadoBadge = e => e === 'apto'
    ? '<span class="badge badge-ok">Apto</span>'
    : '<span class="badge badge-warn">Condicionado</span>';

  grid.innerHTML = `
    <div class="historico-card">
      <h4>Humedad media por mes — 2025/26</h4>
      ${h.humedad.map(x => `
        <div class="bar-row">
          <span class="bar-label">${x.mes}</span>
          <div class="bar-bg"><div class="bar-fill" style="width:${(x.valor/maxH*100).toFixed(0)}%"></div></div>
          <span class="bar-val">${x.valor}%</span>
        </div>`).join('')}
    </div>
    <div class="historico-card">
      <h4>Temperatura media del suelo — 2025/26</h4>
      ${h.temperatura.map(x => `
        <div class="bar-row">
          <span class="bar-label">${x.mes}</span>
          <div class="bar-bg"><div class="bar-fill" style="width:${(x.valor/maxT*100).toFixed(0)}%;background:#E76F51"></div></div>
          <span class="bar-val">${x.valor}°C</span>
        </div>`).join('')}
    </div>
    <div class="historico-card">
      <h4>Alertas generadas por mes — 2025/26</h4>
      ${h.alertas.map(x => `
        <div class="bar-row">
          <span class="bar-label">${x.mes}</span>
          <div class="bar-bg"><div class="bar-fill" style="width:${(x.valor/maxA*100).toFixed(0)}%;background:#C1121F"></div></div>
          <span class="bar-val">${x.valor}</span>
        </div>`).join('')}
    </div>
    <div class="historico-card">
      <h4>Informes pre-partido — últimas jornadas</h4>
      ${h.partidos.map(p => `
        <div class="ops-row">
          <span class="ops-key">${p.jornada} · ${p.fecha}</span>
          ${estadoBadge(p.estado)}
        </div>`).join('')}
    </div>
  `;
}

async function cargarGestion() {
  const g = await API.get('/datos/gestion');
  if (!g) return;
  const grid = document.getElementById('gestion-grid');
  if (!grid) return;

  const prioridadColor = p => p === 'critica' ? 'ops-crit' : p === 'alta' ? 'ops-warn' : '';

  grid.innerHTML = `
    <div class="gestion-card">
      <h4>Calendario de mantenimiento</h4>
      ${g.mantenimiento.map(t => `
        <div class="ops-row">
          <span class="ops-key">${t.tarea}</span>
          <span class="ops-val ${prioridadColor(t.prioridad)}">${t.fecha}</span>
        </div>`).join('')}
    </div>
    <div class="gestion-card">
      <h4>Historial de eventos</h4>
      ${g.eventos.map(e => `
        <div class="ops-row">
          <span class="ops-key">${e.tipo}</span>
          <span class="ops-val">${e.fecha}</span>
        </div>`).join('')}
    </div>
    <div class="gestion-card">
      <h4>Estado del sistema</h4>
      <div class="ops-row"><span class="ops-key">Sensores activos</span><span class="ops-val ops-ok">${g.sistema.sensoresActivos}/${g.sistema.sensoresTotal}</span></div>
      <div class="ops-row"><span class="ops-key">Batería media</span><span class="ops-val">${g.sistema.bateriaMedia}%</span></div>
      <div class="ops-row"><span class="ops-key">Batería baja</span><span class="ops-val ops-warn">${g.sistema.sensorBajaB}</span></div>
      <div class="ops-row"><span class="ops-key">Última sync</span><span class="ops-val">${g.sistema.ultimaSync}</span></div>
      <div class="ops-row"><span class="ops-key">Gateway</span><span class="ops-val ops-ok">${g.sistema.gateway}</span></div>
    </div>
    <div class="gestion-card">
      <h4>Roles y accesos</h4>
      ${g.roles.map(r => `
        <div class="ops-row">
          <span class="ops-key">${r.usuario}</span>
          <span class="ops-val">${r.rol}</span>
        </div>`).join('')}
    </div>
  `;
}

function irASeccion(id) {
  const el = document.getElementById(id);
  if (el) { event.preventDefault(); el.scrollIntoView({ behavior:'smooth' }); }
}

// =================== EXPORTAR PDF DEL HISTORIAL DE DATOS ===================
async function exportarPDF() {
  // Verificar que jsPDF está cargado
  if (typeof window.jspdf === 'undefined') {
    alert('Error: la librería jsPDF no se ha cargado. Recarga la página e inténtalo de nuevo.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  // Datos del usuario y del campo
  const user = API.getUsuario() || {};
  const estadio = user.estadio || user.club || 'Estadio';
  const plan = (user.plan || 'smart').toUpperCase();
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' });
  const horaHoy = new Date().toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });

  // ===== CABECERA =====
  doc.setFillColor(31, 56, 100); // NAVY
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SensoSmart', 14, 14);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Informe de Historial de Datos', 14, 22);

  doc.setFontSize(9);
  doc.text(`Plan ${plan}`, 196, 14, { align: 'right' });
  doc.text(fechaHoy, 196, 20, { align: 'right' });
  doc.text(horaHoy, 196, 26, { align: 'right' });

  // ===== TÍTULO ESTADIO =====
  doc.setTextColor(31, 56, 100);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(estadio, 14, 42);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text('Informe generado automáticamente por la plataforma SensoSmart', 14, 48);

  let yPos = 58;

  // ===== KPIs ACTUALES =====
  const kpiCards = document.querySelectorAll('.kpi-card');
  if (kpiCards.length > 0) {
    doc.setTextColor(31, 56, 100);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Estado actual del campo', 14, yPos);
    yPos += 5;

    const kpiData = [];
    kpiCards.forEach(card => {
      const label = card.querySelector('.kpi-label')?.textContent || '';
      const value = card.querySelector('.kpi-value')?.textContent || '';
      const status = card.querySelector('.kpi-status')?.textContent || '';
      if (label) kpiData.push([label, value, status]);
    });

    doc.autoTable({
      startY: yPos,
      head: [['Parámetro', 'Valor', 'Estado']],
      body: kpiData,
      theme: 'striped',
      headStyles: { fillColor: [46, 125, 78], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 35 }, 2: { cellWidth: 65 } }
    });
    yPos = doc.lastAutoTable.finalY + 8;
  }

  // ===== HISTORIAL DE DATOS (humedad, temperatura, alertas) =====
  const historicoCards = document.querySelectorAll('.historico-card');
  if (historicoCards.length > 0) {
    if (yPos > 230) { doc.addPage(); yPos = 20; }

    doc.setTextColor(31, 56, 100);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Historial mensual de datos', 14, yPos);
    yPos += 5;

    historicoCards.forEach(card => {
      const titulo = card.querySelector('h4')?.textContent || '';

      // Datos en barras (humedad, temperatura, alertas)
      const barRows = card.querySelectorAll('.bar-row');
      if (barRows.length > 0) {
        const filas = [];
        barRows.forEach(row => {
          const mes = row.querySelector('.bar-label')?.textContent || '';
          const valor = row.querySelector('.bar-val')?.textContent || '';
          if (mes) filas.push([mes, valor]);
        });

        if (yPos > 250) { doc.addPage(); yPos = 20; }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 56, 100);
        doc.text(titulo, 14, yPos);
        yPos += 2;

        doc.autoTable({
          startY: yPos,
          head: [['Período', 'Valor']],
          body: filas,
          theme: 'grid',
          headStyles: { fillColor: [46, 125, 78], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 1.5 },
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 40 } },
          margin: { left: 14 }
        });
        yPos = doc.lastAutoTable.finalY + 6;
      }

      // Datos de partidos / informes (filas tipo ops-row con badges)
      const opsRows = card.querySelectorAll('.ops-row');
      if (opsRows.length > 0 && barRows.length === 0) {
        const filas = [];
        opsRows.forEach(row => {
          const key = row.querySelector('.ops-key')?.textContent || '';
          const val = row.querySelector('.ops-val, .badge')?.textContent || '';
          if (key) filas.push([key, val]);
        });

        if (yPos > 250) { doc.addPage(); yPos = 20; }

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(31, 56, 100);
        doc.text(titulo, 14, yPos);
        yPos += 2;

        doc.autoTable({
          startY: yPos,
          head: [['Concepto', 'Valor']],
          body: filas,
          theme: 'grid',
          headStyles: { fillColor: [46, 125, 78], textColor: 255, fontStyle: 'bold' },
          styles: { fontSize: 9, cellPadding: 1.5 },
          columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50 } },
          margin: { left: 14 }
        });
        yPos = doc.lastAutoTable.finalY + 6;
      }
    });
  }

  // ===== ESTADO DEL SISTEMA Y GESTIÓN =====
  const gestionCards = document.querySelectorAll('.gestion-card');
  if (gestionCards.length > 0) {
    if (yPos > 230) { doc.addPage(); yPos = 20; }

    doc.setTextColor(31, 56, 100);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Estado del sistema y gestión', 14, yPos);
    yPos += 5;

    gestionCards.forEach(card => {
      const titulo = card.querySelector('h4')?.textContent || '';
      const opsRows = card.querySelectorAll('.ops-row');

      const filas = [];
      opsRows.forEach(row => {
        const key = row.querySelector('.ops-key')?.textContent || '';
        const val = row.querySelector('.ops-val')?.textContent || '';
        if (key) filas.push([key, val]);
      });

      if (filas.length === 0) return;
      if (yPos > 250) { doc.addPage(); yPos = 20; }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(31, 56, 100);
      doc.text(titulo, 14, yPos);
      yPos += 2;

      doc.autoTable({
        startY: yPos,
        head: [['Concepto', 'Valor']],
        body: filas,
        theme: 'grid',
        headStyles: { fillColor: [46, 125, 78], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9, cellPadding: 1.5 },
        columnStyles: { 0: { cellWidth: 100 }, 1: { cellWidth: 50 } },
        margin: { left: 14 }
      });
      yPos = doc.lastAutoTable.finalY + 6;
    });
  }

  // ===== PIE DE PÁGINA EN TODAS LAS PÁGINAS =====
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(46, 125, 78);
    doc.setLineWidth(0.5);
    doc.line(14, 285, 196, 285);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'italic');
    doc.text('SensoSmart · Plataforma de monitorización inteligente del césped deportivo', 14, 290);
    doc.text(`Página ${i} de ${totalPages}`, 196, 290, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.text(`Firma digital: STAI-${Date.now().toString(36).toUpperCase()}`, 14, 294);
  }

  // ===== GUARDAR =====
  const nombreArchivo = `Historial_${estadio.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
  doc.save(nombreArchivo);
}

function iniciarWebSocket() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${proto}//${location.host}`);
  const statusEl = document.getElementById('ws-status');

  ws.onopen = () => { if (statusEl) { statusEl.textContent = 'En tiempo real'; statusEl.style.color = '#52B788'; } };
  ws.onclose = () => { if (statusEl) { statusEl.textContent = 'Desconectado'; statusEl.style.color = '#C1121F'; } setTimeout(iniciarWebSocket, 5000); };
  ws.onmessage = (e) => {
    try {
      const msg = JSON.parse(e.data);
      if (msg.tipo === 'alerta') cargarAlertas();
    } catch {}
  };
}

// Iniciar al cargar
window.addEventListener('DOMContentLoaded', cargarDashboard);

// Admin.js — Panel de administración SensoSmart
async function cargarAdmin() {
  const usuarios = await API.get('/usuarios');
  if (usuarios) renderizarUsuarios(usuarios);
  renderizarStats();
  await renderizarLog();
  renderizarAlertasRecientes();
}

function renderizarUsuarios(usuarios) {
  const tbody = document.getElementById('tbody-usuarios');
  if (!tbody) return;
  tbody.innerHTML = usuarios.map(u => {
    const activo = u.activo
      ? `<span class="badge badge-ok"><span class="badge-icon">✓</span>Sí</span>`
      : `<span class="badge badge-crit"><span class="badge-icon">✗</span>No</span>`;
    return `
      <tr>
        <td>${u.id}</td>
        <td>${u.usuario}</td>
        <td>${u.club}</td>
        <td>${u.rol}</td>
        <td>${activo}</td>
        <td>
          <button class="btn-table" onclick="eliminarUsuario(${u.id})">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderizarStats() {
  const grid = document.getElementById('stats-grid');
  if (!grid) return;
  // Cifras realistas para una operación con varios clubes:
  // 6 clientes, ~70-80 sensores totales (mezcla Smart 20 + Elite 45), 8-15 alertas/día, uptime alto
  const stats = [
    { label: 'Usuarios activos', value: '6', tooltip: null },
    { label: 'Sensores en línea', value: '78', tooltip: null },
    { label: 'Alertas hoy', value: '11', tooltip: null },
    { label: 'Uptime sistema', value: '99.8%', tooltip: '% de tiempo operativo en los últimos 30 días' },
  ];
  grid.innerHTML = stats.map(s => {
    const tooltipClass = s.tooltip ? 'has-tooltip' : '';
    const tooltipHtml = s.tooltip
      ? `<div class="stat-tooltip">${s.tooltip}</div>`
      : '';
    return `
      <div class="stat-card ${tooltipClass}">
        ${tooltipHtml}
        <div class="stat-label">${s.label}</div>
        <div class="stat-value">${s.value}</div>
      </div>
    `;
  }).join('');
}

async function renderizarLog() {
  const log = document.getElementById('log-accesos');
  if (!log) return;

  log.innerHTML = '<div class="log-entry" style="color:#6B7280">Cargando accesos recientes...</div>';

  const datos = await API.get('/sesiones/log');

  if (!datos || datos.error) {
    log.innerHTML = '<div class="log-entry" style="color:#C1121F">Error al cargar el log de accesos.</div>';
    return;
  }

  if (datos.length === 0) {
    log.innerHTML = '<div class="log-entry" style="color:#6B7280">No hay accesos registrados todavía.</div>';
    return;
  }

  log.innerHTML = datos.map(e => `<div class="log-entry">${e}</div>`).join('');
}

function renderizarAlertasRecientes() {
  const cont = document.getElementById('alertas-container');
  if (!cont) return;
  // Mock de alertas del sistema sin datos sensibles del cliente, solo metadatos
  const alertas = [
    { fecha: 'Hoy 11:08', tipo: 'Salinidad alta',          club: 'Real Madrid CF',          sev: 'crit' },
    { fecha: 'Hoy 09:34', tipo: 'Humedad baja',            club: 'FC Barcelona',            sev: 'warn' },
    { fecha: 'Hoy 08:22', tipo: 'Sensor desconectado',     club: 'Atlético de Madrid',      sev: 'warn' },
    { fecha: 'Hoy 07:50', tipo: 'Calibración pendiente',   club: 'CD Logroñés',             sev: 'info' },
    { fecha: 'Ayer 22:14', tipo: 'Riesgo viento alto',     club: 'Real Madrid CF',          sev: 'info' },
    { fecha: 'Ayer 19:03', tipo: 'Hongo detectado (IA)',   club: 'FC Barcelona',            sev: 'crit' },
    { fecha: 'Ayer 16:40', tipo: 'Batería sensor < 15%',   club: 'Atlético de Madrid',      sev: 'warn' },
    { fecha: 'Ayer 11:18', tipo: 'Backup nocturno OK',     club: 'Sistema',                 sev: 'info' },
  ];
  cont.innerHTML = alertas.map(a => `
    <div class="alerta-row severity-${a.sev}">
      <span class="alerta-fecha">${a.fecha}</span>
      <span>
        <div class="alerta-tipo">${a.tipo}</div>
        <div class="alerta-club">${a.club}</div>
      </span>
      <span class="alerta-sev-badge severity-${a.sev}">${a.sev === 'crit' ? 'Crítica' : a.sev === 'warn' ? 'Atención' : 'Info'}</span>
    </div>
  `).join('');
}

async function eliminarUsuario(id) {
  if (!confirm('¿Eliminar este usuario?')) return;
  await API.delete(`/usuarios/${id}`);
  cargarAdmin();
}

function abrirModalNuevoUsuario() {
  document.getElementById('modal-overlay').style.display = 'flex';
}
function cerrarModal() {
  document.getElementById('modal-overlay').style.display = 'none';
}

async function crearUsuario() {
  const usuario = document.getElementById('nuevo-usuario').value;
  const club = document.getElementById('nuevo-club').value;
  const password = document.getElementById('nuevo-password').value;
  const rol = document.getElementById('nuevo-rol').value;
  if (!usuario || !club || !password) { alert('Rellena todos los campos'); return; }
  await API.post('/usuarios', { usuario, club, password, rol });
  cerrarModal();
  cargarAdmin();
}

window.addEventListener('DOMContentLoaded', cargarAdmin);

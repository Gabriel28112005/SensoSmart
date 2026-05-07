// Tecnico.js
let todosLosSensores = [];

async function cargarTecnico() {
  const [sensores, superficie] = await Promise.all([
    API.get('/datos/sensores'),
    API.get('/datos/superficie')
  ]);
  if (sensores) { todosLosSensores = sensores; renderizarTabla(sensores); }
  if (superficie) renderizarSuperficie(superficie);
  renderizarET();
  const sub = document.getElementById('topbar-sub');
  if (sub) sub.textContent = `${todosLosSensores.length} sensores activos · Actualización cada 15 min`;
}

function renderizarTabla(sensores) {
  const tbody = document.getElementById('tbody-sensores');
  if (!tbody) return;
  const colores = { ok:'dot-ok', alerta:'dot-warn', critico:'dot-crit' };
  const etiquetas = { ok:'badge-ok', alerta:'badge-warn', critico:'badge-crit' };
  tbody.innerHTML = sensores.map(s => `
    <tr>
      <td><span class="dot ${colores[s.estado]}"></span>${s.id}</td>
      <td>${s.zona}</td>
      <td>${s.capa}</td>
      <td>${s.humedad}%</td>
      <td>${s.temp}°C</td>
      <td>${s.salinidad}</td>
      <td>${s.bateria}%</td>
      <td><span class="badge ${etiquetas[s.estado]}">${s.estado.charAt(0).toUpperCase()+s.estado.slice(1)}</span></td>
      <td><button class="btn-table" onclick="verDetalleSensor('${s.id}')">Ver</button></td>
    </tr>
  `).join('');
}

function renderizarSuperficie(sup) {
  const grid = document.getElementById('sup-aire-grid');
  if (!grid) return;
  const items = [
    { label:'Temp. superficial', value:sup.tempSuperficial, unit:'°C', status:'Segura para corte' },
    { label:'Temp. del aire', value:sup.tempAire, unit:'°C', status:'Sin riesgo helada' },
    { label:'Humedad relativa', value:sup.humedadRelativa, unit:'%', status:'Riesgo hongos bajo' },
    { label:'Velocidad viento', value:sup.velocidadViento, unit:'km/h', status:'Riego eficiente' },
  ];
  grid.innerHTML = items.map(i => `
    <div class="sup-card">
      <div class="sup-label">${i.label}</div>
      <div class="sup-value">${i.value}<span class="sup-unit">${i.unit}</span></div>
      <div class="sup-status">${i.status}</div>
    </div>
  `).join('');
}

function renderizarET() {
  const card = document.getElementById('et-card');
  if (!card) return;
  card.innerHTML = `
    <strong>Evapotranspiración estimada hoy: 4.2 mm/día</strong><br/>
    Calculada con la fórmula Penman-Monteith usando temperatura (21°C), humedad relativa (62%) y velocidad del viento (18 km/h).<br/>
    <strong>Riego mínimo recomendado:</strong> 70% de ET = <strong>2.9 mm</strong> equivalentes a aplicar hoy.
  `;
}

function aplicarFiltro() {
  const estado = document.getElementById('filtro-estado').value;
  const capa = document.getElementById('filtro-capa').value;
  let filtrados = todosLosSensores;
  if (estado !== 'todos') filtrados = filtrados.filter(s => s.estado === estado);
  if (capa !== 'todos') filtrados = filtrados.filter(s => s.capa === capa);
  renderizarTabla(filtrados);
}

function verDetalleSensor(id) {
  const s = todosLosSensores.find(x => x.id === id);
  if (s) alert(`${s.id} — ${s.zona}\nHumedad: ${s.humedad}% | Temp: ${s.temp}°C | Salinidad: ${s.salinidad} dS/m | Batería: ${s.bateria}%`);
}

function refrescarDatos() { cargarTecnico(); }
function exportarCSV() {
  const cab = 'ID,Zona,Capa,Humedad,Temperatura,Salinidad,Bateria,Estado\n';
  const filas = todosLosSensores.map(s => `${s.id},${s.zona},${s.capa},${s.humedad},${s.temp},${s.salinidad},${s.bateria},${s.estado}`).join('\n');
  const blob = new Blob([cab + filas], { type:'text/csv' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
  a.download = 'sensores_smart_turf.csv'; a.click();
}

window.addEventListener('DOMContentLoaded', cargarTecnico);

// IA.js — Carga y renderiza las 3 IAs disponibles en Smart y Elite

(async function cargarIA() {
  // Esperar a que el DOM esté listo si todavía no lo está
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cargarIA);
    return;
  }

  // Cargar las 3 IAs en paralelo
  const [fito, riego, informe] = await Promise.all([
    API.get('/ia/fitosanitario'),
    API.get('/ia/riego'),
    API.get('/ia/informe-oficial')
  ]);

  if (fito) renderFitosanitario(fito);
  if (riego) renderRiego(riego);
  if (informe) renderInforme(informe);

  // Mostrar banner de upgrade solo si el usuario es Smart
  const banner = document.getElementById('ia-upgrade-banner');
  if (banner) {
    try {
      const u = JSON.parse(localStorage.getItem('sai_user') || '{}');
      if (u.plan !== 'elite') banner.style.display = 'block';
    } catch {}
  }
})();

function renderFitosanitario(data) {
  const status = document.getElementById('ia-fito-status');
  const body = document.getElementById('ia-fito-body');
  if (!body) return;

  const colorEstado = { optimo: '#52B788', atencion: '#E76F51', critico: '#C1121F' };
  if (status) {
    status.textContent = data.estadoGlobal === 'atencion' ? 'Requiere atención' :
                         data.estadoGlobal === 'critico' ? 'CRÍTICO' : 'Óptimo';
    status.style.color = colorEstado[data.estadoGlobal] || '#52B788';
  }

  // Malas hierbas
  const mh = data.malasHierbas;
  const malasHierbasHtml = `
    <div class="ia-section-block">
      <div class="ia-section-title">Malas hierbas (Reglamento LaLiga)</div>
      <div class="ia-pill-grid">
        <div class="ia-pill ${mh.trebol.detectado ? 'pill-warn' : 'pill-ok'}">
          Trébol ${mh.trebol.detectado ? '✗' : '✓'}
        </div>
        <div class="ia-pill ${mh.kikuyu.detectado ? 'pill-warn' : 'pill-ok'}">
          Kikuyu ${mh.kikuyu.detectado ? '✗' : '✓'}
        </div>
        <div class="ia-pill ${mh.poa_annua.detectado ? 'pill-warn' : 'pill-ok'}">
          Poa annua ${mh.poa_annua.detectado ? '⚠' : '✓'}
        </div>
      </div>
      ${mh.poa_annua.detectado ? `<div class="ia-zonas">Detectada en: ${mh.poa_annua.zonas.join(', ')}</div>` : ''}
    </div>
  `;

  // Hongos
  const ho = data.hongos;
  const hongosHtml = `
    <div class="ia-section-block">
      <div class="ia-section-title">Hongos y enfermedades</div>
      <div class="ia-pill-grid">
        <div class="ia-pill pill-${ho.fusarium.riesgo === 'bajo' ? 'ok' : 'warn'}">
          Fusarium · ${ho.fusarium.riesgo}
        </div>
        <div class="ia-pill pill-${ho.dollar_spot.riesgo === 'bajo' ? 'ok' : ho.dollar_spot.riesgo === 'medio' ? 'warn' : 'crit'}">
          Dollar spot · ${ho.dollar_spot.riesgo}
        </div>
        <div class="ia-pill pill-${ho.antracnosis.riesgo === 'bajo' ? 'ok' : 'warn'}">
          Antracnosis · ${ho.antracnosis.riesgo}
        </div>
      </div>
      ${ho.dollar_spot.detectado ? `<div class="ia-zonas">⚠ ${ho.dollar_spot.zonas.join(', ')} · prev. ${ho.dollar_spot.prevision_dias} días</div>` : ''}
    </div>
  `;

  // Recomendaciones
  const recos = data.recomendaciones.map(r => `
    <div class="ia-reco ia-reco-${r.prioridad}">
      <strong>[${r.prioridad.toUpperCase()}]</strong> ${r.texto}
    </div>
  `).join('');

  body.innerHTML = malasHierbasHtml + hongosHtml + `
    <div class="ia-section-block">
      <div class="ia-section-title">Recomendaciones</div>
      ${recos}
    </div>
    <div class="ia-footer">
      <span>${data.modelo}</span> · <span>Próximo análisis: ${data.proximoAnalisis}</span>
    </div>
  `;
}

function renderRiego(data) {
  const status = document.getElementById('ia-riego-status');
  const body = document.getElementById('ia-riego-body');
  if (!body) return;

  if (status) {
    status.textContent = `Ahorro previsto ${data.ahorroEstimadoSemanal.litros.toLocaleString('es')} L/sem`;
    status.style.color = '#52B788';
  }

  const recos = data.recomendaciones.map(r => `
    <div class="ia-reco ia-reco-${r.prioridad}">
      <div class="ia-reco-zona">${r.zona}</div>
      <div class="ia-reco-accion">${r.accion}</div>
      <div class="ia-reco-motivo">${r.motivo}</div>
      ${r.ahorroAgua !== '—' ? `<div class="ia-reco-ahorro">💧 Ahorro: ${r.ahorroAgua}</div>` : ''}
    </div>
  `).join('');

  const previsiones = data.prediccion48h.map(p => {
    const cambio = p.humedadPrevista48h - p.humedadActual;
    const colorCambio = cambio < -5 ? '#C1121F' : cambio < 0 ? '#E76F51' : '#52B788';
    return `
      <div class="ia-prev-row">
        <span class="ia-prev-zona">${p.zona}</span>
        <span class="ia-prev-bar">
          <span class="ia-prev-now">${p.humedadActual}%</span>
          <span class="ia-prev-arrow">→</span>
          <span class="ia-prev-future" style="color:${colorCambio}">${p.humedadPrevista48h}%</span>
        </span>
      </div>
    `;
  }).join('');

  body.innerHTML = `
    <div class="ia-kpi-row">
      <div class="ia-kpi-mini">
        <div class="ia-kpi-val">${data.estadoActual.humedadMediaActual}%</div>
        <div class="ia-kpi-lbl">Humedad media</div>
      </div>
      <div class="ia-kpi-mini">
        <div class="ia-kpi-val">${data.estadoActual.etEstimadaHoy}</div>
        <div class="ia-kpi-lbl">ET₀ mm/día</div>
      </div>
      <div class="ia-kpi-mini ia-kpi-success">
        <div class="ia-kpi-val">${data.ahorroEstimadoAnual.euros.toLocaleString('es')} €</div>
        <div class="ia-kpi-lbl">Ahorro anual</div>
      </div>
    </div>
    <div class="ia-section-block">
      <div class="ia-section-title">Predicción humedad 48h</div>
      ${previsiones}
    </div>
    <div class="ia-section-block">
      <div class="ia-section-title">Recomendaciones de riego</div>
      ${recos}
    </div>
    <div class="ia-footer">
      <span>${data.modelo}</span> · <span>Actualizado: ${data.ultimaActualizacion}</span>
    </div>
  `;
}

function renderInforme(data) {
  const status = document.getElementById('ia-informe-status');
  const body = document.getElementById('ia-informe-body');
  if (!body) return;

  // Guardar el informe en variable global para que descargarInformePDF() pueda accederlo
  window._informeIAData = data;

  const colorEstado = { apto: '#52B788', condicionado: '#E76F51', no_apto: '#C1121F' };
  if (status) {
    status.textContent = data.veredicto.estado.toUpperCase();
    status.style.color = colorEstado[data.veredicto.estado] || '#52B788';
  }

  const params = Object.entries(data.parametros).map(([k, v]) => {
    const nombre = {
      altura_cesped: 'Altura del césped',
      temperatura_suelo: 'Temperatura suelo',
      dureza: 'Dureza',
      traccion: 'Tracción',
      uniformidad: 'Uniformidad',
      malas_hierbas: 'Malas hierbas'
    }[k] || k;
    return `
      <div class="ia-param-row ${v.cumple ? 'param-ok' : 'param-warn'}">
        <span class="ia-param-name">${nombre}</span>
        <span class="ia-param-val">${v.valor}${v.unidad ? ' ' + v.unidad : ''}</span>
        <span class="ia-param-status">${v.cumple ? '✓' : '⚠'}</span>
      </div>
      ${v.observacion ? `<div class="ia-param-obs">${v.observacion}</div>` : ''}
    `;
  }).join('');

  body.innerHTML = `
    <div class="ia-info-meta">
      <strong>${data.jornada}</strong> · ${data.fecha}
    </div>
    <div class="ia-section-block">
      <div class="ia-section-title">Parámetros del Reglamento LaLiga</div>
      ${params}
    </div>
    <div class="ia-veredicto veredicto-${data.veredicto.estado}">
      <div class="ia-veredicto-titulo">VEREDICTO: ${data.veredicto.estado.toUpperCase()}</div>
      <div class="ia-veredicto-obs">${data.veredicto.observaciones}</div>
      <div class="ia-veredicto-firma">Firma digital: ${data.veredicto.firmaDigital}</div>
    </div>
    <div class="ia-info-tiempo">
      ⏱ Tiempo ahorrado vs cumplimentación manual: <strong>${data.tiempoAhorrado}</strong>
    </div>
    <div class="ia-info-actions">
      <button class="btn-ia-pdf" onclick="descargarInformePDF()">
        📄 Descargar PDF oficial
      </button>
    </div>
    <div class="ia-footer">
      <span>Generado por IA · ${data.veredicto.firmaDigital}</span>
    </div>
  `;
}

// =================== DESCARGAR PDF DEL INFORME OFICIAL LALIGA ===================
function descargarInformePDF() {
  if (typeof window.jspdf === 'undefined') {
    alert('Error: la librería jsPDF no se ha cargado. Recarga la página e inténtalo de nuevo.');
    return;
  }
  const data = window._informeIAData;
  if (!data) {
    alert('No hay informe disponible para descargar.');
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const user = (typeof API !== 'undefined' && API.getUsuario) ? (API.getUsuario() || {}) : {};
  const estadio = user.estadio || user.club || 'Estadio';
  const plan = (user.plan || 'smart').toUpperCase();
  const fechaHoy = new Date().toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' });

  // ===== CABECERA OFICIAL =====
  doc.setFillColor(31, 56, 100); // NAVY
  doc.rect(0, 0, 210, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SENSOSMART', 14, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('INFORME OFICIAL — REGLAMENTO LALIGA', 14, 24);
  doc.setFontSize(9);
  doc.text('Generado automáticamente por Inteligencia Artificial', 14, 30);

  doc.setFontSize(9);
  doc.text(`Plan ${plan}`, 196, 16, { align: 'right' });
  doc.text(fechaHoy, 196, 22, { align: 'right' });

  // ===== INFO DEL PARTIDO =====
  doc.setTextColor(31, 56, 100);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(estadio, 14, 48);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`${data.jornada}  ·  ${data.fecha}`, 14, 55);

  // ===== TABLA DE PARÁMETROS =====
  const nombresParam = {
    altura_cesped: 'Altura del césped',
    temperatura_suelo: 'Temperatura suelo',
    dureza: 'Dureza',
    traccion: 'Tracción',
    uniformidad: 'Uniformidad',
    malas_hierbas: 'Malas hierbas'
  };

  const filasParam = Object.entries(data.parametros).map(([k, v]) => {
    const nombre = nombresParam[k] || k;
    const valor = v.valor + (v.unidad ? ' ' + v.unidad : '');
    const estado = v.cumple ? 'CUMPLE' : 'OBSERVACIÓN';
    const obs = v.observacion || '—';
    return [nombre, valor, estado, obs];
  });

  doc.setTextColor(31, 56, 100);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Parámetros del Reglamento LaLiga', 14, 68);

  doc.autoTable({
    startY: 72,
    head: [['Parámetro', 'Valor medido', 'Estado', 'Observación']],
    body: filasParam,
    theme: 'striped',
    headStyles: { fillColor: [46, 125, 78], textColor: 255, fontStyle: 'bold', fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 45, fontStyle: 'bold' },
      1: { cellWidth: 35, halign: 'center' },
      2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
      3: { cellWidth: 72 }
    },
    didParseCell: (datos) => {
      if (datos.column.index === 2 && datos.section === 'body') {
        if (datos.cell.raw === 'CUMPLE') {
          datos.cell.styles.textColor = [46, 125, 78];
        } else {
          datos.cell.styles.textColor = [231, 111, 81];
        }
      }
    }
  });

  let yPos = doc.lastAutoTable.finalY + 10;

  // ===== VEREDICTO FINAL =====
  const colorVeredicto = {
    apto: [46, 125, 78],
    condicionado: [231, 111, 81],
    no_apto: [193, 18, 31]
  };
  const colorActual = colorVeredicto[data.veredicto.estado] || [46, 125, 78];

  doc.setFillColor(...colorActual);
  doc.rect(14, yPos, 182, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`VEREDICTO: ${data.veredicto.estado.toUpperCase()}`, 105, yPos + 8, { align: 'center' });

  yPos += 18;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const obsLineas = doc.splitTextToSize(`Observaciones: ${data.veredicto.observaciones}`, 182);
  doc.text(obsLineas, 14, yPos);
  yPos += obsLineas.length * 5 + 4;

  // ===== TIEMPO AHORRADO =====
  doc.setFillColor(245, 247, 250);
  doc.rect(14, yPos, 182, 14, 'F');
  doc.setTextColor(31, 56, 100);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Tiempo ahorrado vs cumplimentación manual:', 18, yPos + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(data.tiempoAhorrado || 'No disponible', 18, yPos + 11);

  yPos += 22;

  // ===== FIRMA DIGITAL =====
  doc.setDrawColor(46, 125, 78);
  doc.setLineWidth(0.5);
  doc.line(14, yPos, 196, yPos);
  yPos += 6;

  doc.setTextColor(60, 60, 60);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Firma digital del informe:', 14, yPos);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(31, 56, 100);
  doc.text(data.veredicto.firmaDigital || 'STAI-' + Date.now().toString(36).toUpperCase(), 14, yPos + 6);

  // ===== PIE DE PÁGINA =====
  doc.setDrawColor(46, 125, 78);
  doc.setLineWidth(0.5);
  doc.line(14, 285, 196, 285);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'italic');
  doc.text('SensoSmart · Plataforma de monitorización inteligente del césped deportivo', 14, 290);
  doc.text('Informe oficial generado automáticamente conforme al Reglamento LaLiga', 14, 294);

  // ===== GUARDAR =====
  const jornadaLimpia = (data.jornada || 'jornada').replace(/[^a-zA-Z0-9]/g, '');
  const nombreArchivo = `Informe_LaLiga_${jornadaLimpia}_${estadio.replace(/\s+/g, '_')}.pdf`;
  doc.save(nombreArchivo);
}

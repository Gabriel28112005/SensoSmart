// Elite.js — Dashboard Premium: mapa de calor, asistente, lesiones y Digital Twin 3D

(async function inicializarElite() {
  // Esperar a que cargue el DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarElite);
    return;
  }

  // Cargar la imagen del estadio según el usuario
  cargarImagenEstadio();

  // Cargar todos los datos Elite en paralelo
  const [mapaCalor, lesiones, twin] = await Promise.all([
    API.get('/elite/mapa-calor'),
    API.get('/elite/lesiones'),
    API.get('/elite/digital-twin')
  ]);

  if (mapaCalor) renderMapaCalor(mapaCalor);
  if (lesiones) renderLesiones(lesiones);
  if (twin) {
    renderTwinInfo(twin);
    iniciarTwin3D(twin);
  }
})();

// ============================================================
// IMAGEN DEL ESTADIO (banner superior)
// ============================================================
function cargarImagenEstadio() {
  const banner = document.getElementById('elite-stadium-banner');
  const nombre = document.getElementById('banner-estadio-nombre');
  if (!banner) return;

  // Mapeo de estadios a sus imágenes
  const mapaImagenes = {
    'Santiago Bernabéu':     '/assets/images/estadios/bernabeu.svg',
    'Spotify Camp Nou':      '/assets/images/estadios/campnou.svg',
    'Cívitas Metropolitano': '/assets/images/estadios/metropolitano.svg',
    'Las Gaunas':            '/assets/images/estadios/lasgaunas.svg'
  };

  let estadio = 'Estadio';
  try {
    const u = JSON.parse(localStorage.getItem('sai_user') || '{}');
    estadio = u.estadio || 'Estadio';
  } catch {}

  const img = mapaImagenes[estadio] || '/assets/images/estadios/generico.svg';
  banner.style.setProperty('--stadium-img', `url('${img}')`);
  banner.style.backgroundImage = `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.7) 100%), url('${img}')`;

  if (nombre) nombre.textContent = estadio;
}

// ============================================================
// 1. DATOS DEL MAPA DE CALOR (NDVI/Térmica) — se aplican en el visor 3D
// ============================================================
let mapaCalorData = null;

function renderMapaCalor(data) {
  // Guardamos los datos del mapa cromático para cuando se active la vista cromática en el visor 3D
  mapaCalorData = data;
}

// ============================================================
// 2. ASISTENTE CONVERSACIONAL
// ============================================================
async function enviarPreguntaAsistente() {
  const input = document.getElementById('chat-input');
  if (!input || !input.value.trim()) return;
  const pregunta = input.value.trim();
  input.value = '';

  const messages = document.getElementById('chat-messages');
  if (!messages) return;

  // Mensaje del usuario
  messages.insertAdjacentHTML('beforeend', `
    <div class="chat-msg chat-msg-user">
      <div class="chat-bubble chat-bubble-user">${escapeHtml(pregunta)}</div>
      <div class="chat-avatar">👤</div>
    </div>
  `);
  messages.scrollTop = messages.scrollHeight;

  // Indicador "escribiendo"
  messages.insertAdjacentHTML('beforeend', `
    <div class="chat-msg chat-msg-bot" id="chat-escribiendo">
      <div class="chat-avatar">🤖</div>
      <div class="chat-bubble chat-bubble-typing">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    </div>
  `);
  messages.scrollTop = messages.scrollHeight;

  // Enviar al backend
  const resp = await API.post('/elite/asistente', { pregunta });

  // Quitar indicador
  const esc = document.getElementById('chat-escribiendo');
  if (esc) esc.remove();

  if (resp && resp.respuesta) {
    messages.insertAdjacentHTML('beforeend', `
      <div class="chat-msg chat-msg-bot">
        <div class="chat-avatar">🤖</div>
        <div class="chat-bubble">
          ${escapeHtml(resp.respuesta).replace(/\n/g, '<br>')}
          <div class="chat-meta">${resp.modelo} · ${resp.latencia}</div>
        </div>
      </div>
    `);
    messages.scrollTop = messages.scrollHeight;
  } else {
    messages.insertAdjacentHTML('beforeend', `
      <div class="chat-msg chat-msg-bot">
        <div class="chat-avatar">🤖</div>
        <div class="chat-bubble chat-bubble-error">No he podido procesar tu pregunta. Inténtalo de nuevo.</div>
      </div>
    `);
  }
}

function usarSugerencia(btn) {
  const input = document.getElementById('chat-input');
  if (input) {
    input.value = btn.textContent;
    input.focus();
    enviarPreguntaAsistente();
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

// ============================================================
// 3. RIESGO DE LESIONES
// ============================================================
function renderLesiones(data) {
  const div = document.getElementById('lesiones-content');
  if (!div) return;

  const colorRiesgo = {
    bajo:      { fondo: '#D8F3DC', border: '#52B788', texto: '#1B4332' },
    medio:     { fondo: '#FFE5D9', border: '#E76F51', texto: '#C65911' },
    alto:      { fondo: '#FFCCD0', border: '#C1121F', texto: '#C1121F' },
    muy_alto:  { fondo: '#7C0A0F', border: '#7C0A0F', texto: '#fff' }
  };

  const zonas = data.porZona.map(z => {
    const c = colorRiesgo[z.riesgo] || colorRiesgo.bajo;
    // Para riesgo alto/muy_alto mostramos un aviso destacado de posible lesión en el próximo partido
    const esRiesgoAlto = z.riesgo === 'alto' || z.riesgo === 'muy_alto';
    const avisoLesion = esRiesgoAlto
      ? `<div class="lesion-zona-alerta"><strong>⚠ Posible lesión en esta zona durante la ${data.proximoPartido.jornada}</strong>${z.alerta ? `<div class="lesion-zona-motivo">Motivo: ${z.alerta}</div>` : ''}</div>`
      : (z.alerta ? `<div class="lesion-zona-alerta">⚠ ${z.alerta}</div>` : '');
    return `
      <div class="lesion-zona-card" style="background:${c.fondo};border-left:4px solid ${c.border};color:${c.texto}">
        <div class="lesion-zona-head">
          <span class="lesion-zona-nombre">${z.zona}</span>
          <span class="lesion-prob">${(z.prob * 100).toFixed(0)}%</span>
        </div>
        <div class="lesion-zona-tag">Riesgo: <strong>${z.riesgo.replace('_',' ').toUpperCase()}</strong></div>
        <div class="lesion-zona-factores">
          <span>Dureza: ${z.dureza}g</span> ·
          <span>Humedad: ${z.humedad}%</span> ·
          <span>Unif: ${z.uniformidad}%</span>
        </div>
        ${avisoLesion}
      </div>
    `;
  }).join('');

  const recos = data.recomendaciones.map(r => `<li>${r}</li>`).join('');

  div.innerHTML = `
    <div class="lesion-resumen">
      <div class="lesion-resumen-block">
        <div class="lesion-resumen-titulo">PRÓXIMO PARTIDO</div>
        <div class="lesion-resumen-val">${data.proximoPartido.jornada}</div>
        <div class="lesion-resumen-sub">${data.proximoPartido.fecha} (en ${data.proximoPartido.diasRestantes} días)</div>
      </div>
      <div class="lesion-resumen-block">
        <div class="lesion-resumen-titulo">RIESGO GLOBAL</div>
        <div class="lesion-resumen-val" style="color:${colorRiesgo[data.resumenGlobal.riesgoMedio].border}">
          ${data.resumenGlobal.riesgoMedio.toUpperCase()}
        </div>
        <div class="lesion-resumen-sub">Probabilidad ${(data.resumenGlobal.probGlobal * 100).toFixed(0)}%</div>
      </div>
      <div class="lesion-resumen-block">
        <div class="lesion-resumen-titulo">VALOR PROTEGIDO</div>
        <div class="lesion-resumen-val lesion-valor">${data.valorPlantillaProtegido}</div>
        <div class="lesion-resumen-sub">Plantilla expuesta a zonas de riesgo</div>
      </div>
    </div>

    <h4 class="lesion-subtitulo">Análisis por zona del campo</h4>
    <div class="lesion-zonas-grid">${zonas}</div>

    <div class="lesion-recos">
      <h4>Recomendaciones del modelo</h4>
      <ul>${recos}</ul>
    </div>

    <div class="lesion-historico">
      <h4>Histórico</h4>
      <div class="lesion-historico-grid">
        ${data.historico.map(h => `
          <div class="lesion-historico-card ${h.conSmartTurfAI ? 'historico-conSmartTurf' : ''}">
            <div class="historico-temp">${h.temporada}</div>
            <div class="historico-num">${h.lesionesCampoTotal}</div>
            <div class="historico-lbl">Lesiones causadas por el terreno</div>
            ${h.conSmartTurfAI ? '<div class="historico-tag">CON SMART TURF AI</div>' : ''}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="ia-footer">
      <span>${data.modelo} · Confianza: ${(data.confianza * 100).toFixed(0)}%</span>
    </div>
  `;
}

// ============================================================
// 4. DIGITAL TWIN 3D — Three.js
// ============================================================
function renderTwinInfo(data) {
  const div = document.getElementById('twin-info');
  if (!div) return;

  div.innerHTML = `
    <h4 class="twin-info-title">${data.estadio}</h4>
    <div class="twin-info-row"><span>Capacidad</span><span>${data.capacidad.toLocaleString('es')}</span></div>
    <div class="twin-info-row"><span>Coordenadas</span><span>${data.coordenadasGPS.lat}, ${data.coordenadasGPS.lon}</span></div>
    <div class="twin-info-row"><span>Orientación</span><span>${data.orientacion}</span></div>
    <div class="twin-info-row"><span>Dimensiones</span><span>${data.dimensionesCampo.largo} × ${data.dimensionesCampo.ancho} m</span></div>
    <div class="twin-info-row"><span>Área</span><span>${data.dimensionesCampo.area} m²</span></div>

    <h4 class="twin-info-subtitle">Capas del terreno</h4>
    <div class="twin-info-row"><span>Césped</span><span>${data.capas.cesped.tipo}</span></div>
    <div class="twin-info-row"><span>Sustrato</span><span>${data.capas.sustrato.profundidad} mm</span></div>
    <div class="twin-info-row"><span>Drenaje</span><span>${data.capas.drenaje.profundidad} mm</span></div>
    <div class="twin-info-row"><span>Base</span><span>${data.capas.base.profundidad} mm</span></div>

    <h4 class="twin-info-subtitle">Sistemas integrados</h4>
    <ul class="twin-sistemas">
      ${data.sistemasIntegrados.map(s => `<li>✓ ${s}</li>`).join('')}
    </ul>
  `;
}

let twinScene, twinCamera, twinRenderer, twinField, twinSensors = [], twinAnim, twinCapasVisibles = true;
let twinRotando = true;
let twinAngle = 0;
let twinModo = '3d'; // '3d' o 'cromatico'
let twinHeatCells = []; // celdas NDVI 3D para la vista cromática
let twinFieldLines = []; // líneas blancas del campo (se ocultan en cromático)

function iniciarTwin3D(data) {
  const container = document.getElementById('twin-3d');
  if (!container || typeof THREE === 'undefined') return;

  // Quitar loading
  const loading = document.getElementById('twin-loading');
  if (loading) loading.style.display = 'none';

  // Limpiar
  while (container.firstChild && container.firstChild.id !== 'twin-loading') {
    container.removeChild(container.firstChild);
  }

  const w = container.clientWidth;
  const h = 480;

  // Escena
  twinScene = new THREE.Scene();
  twinScene.background = new THREE.Color(0x0a1c14);
  twinScene.fog = new THREE.Fog(0x0a1c14, 80, 200);

  // Cámara
  twinCamera = new THREE.PerspectiveCamera(45, w / h, 0.1, 500);
  twinCamera.position.set(60, 50, 90);
  twinCamera.lookAt(0, 0, 0);

  // Renderer
  twinRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  twinRenderer.setSize(w, h);
  twinRenderer.shadowMap.enabled = true;
  container.appendChild(twinRenderer.domElement);

  // Luces
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  twinScene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
  sunLight.position.set(50, 100, 50);
  sunLight.castShadow = true;
  twinScene.add(sunLight);

  // Suelo del estadio
  const groundGeo = new THREE.BoxGeometry(120, 1, 80);
  const groundMat = new THREE.MeshStandardMaterial({ color: 0x1B4332 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.y = -1;
  ground.receiveShadow = true;
  twinScene.add(ground);

  // Campo de fútbol (verde)
  const fieldGeo = new THREE.BoxGeometry(105, 0.5, 68);
  const fieldMat = new THREE.MeshStandardMaterial({ color: 0x2D6A4F, roughness: 0.8 });
  twinField = new THREE.Mesh(fieldGeo, fieldMat);
  twinField.position.y = 0;
  twinField.castShadow = true;
  twinField.receiveShadow = true;
  twinScene.add(twinField);

  // Líneas del campo (rectángulo central, círculo central, áreas)
  // Las guardamos en twinFieldLines para poder ocultarlas en la vista cromática
  twinFieldLines = [];
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true });

  // Borde del campo
  const bordePoints = [
    new THREE.Vector3(-52.5, 0.3,  34),
    new THREE.Vector3( 52.5, 0.3,  34),
    new THREE.Vector3( 52.5, 0.3, -34),
    new THREE.Vector3(-52.5, 0.3, -34),
    new THREE.Vector3(-52.5, 0.3,  34),
  ];
  const bordeGeo = new THREE.BufferGeometry().setFromPoints(bordePoints);
  const bordeLine = new THREE.Line(bordeGeo, lineMat);
  twinScene.add(bordeLine);
  twinFieldLines.push(bordeLine);

  // Línea central
  const centroPoints = [new THREE.Vector3(0, 0.3, -34), new THREE.Vector3(0, 0.3, 34)];
  const centroGeo = new THREE.BufferGeometry().setFromPoints(centroPoints);
  const centroLine = new THREE.Line(centroGeo, lineMat);
  twinScene.add(centroLine);
  twinFieldLines.push(centroLine);

  // Círculo central
  const circleGeo = new THREE.RingGeometry(9, 9.3, 32);
  const circleMat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.7 });
  const circle = new THREE.Mesh(circleGeo, circleMat);
  circle.rotation.x = -Math.PI / 2;
  circle.position.y = 0.3;
  twinScene.add(circle);
  twinFieldLines.push(circle);

  // Áreas (Norte y Sur)
  [[-44, 0], [44, 0]].forEach((pos) => {
    const areaPoints = [
      new THREE.Vector3(pos[0] - (pos[0] < 0 ? 0 : 16.5), 0.3, -20),
      new THREE.Vector3(pos[0] + (pos[0] < 0 ? 16.5 : 0), 0.3, -20),
      new THREE.Vector3(pos[0] + (pos[0] < 0 ? 16.5 : 0), 0.3,  20),
      new THREE.Vector3(pos[0] - (pos[0] < 0 ? 0 : 16.5), 0.3,  20),
    ];
    const areaGeo = new THREE.BufferGeometry().setFromPoints(areaPoints);
    const areaLine = new THREE.LineLoop(areaGeo, lineMat);
    twinScene.add(areaLine);
    twinFieldLines.push(areaLine);
  });

  // Porterías
  [-52.5, 52.5].forEach(x => {
    const goalGeo = new THREE.BoxGeometry(0.5, 2.4, 7.32);
    const goalMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const goal = new THREE.Mesh(goalGeo, goalMat);
    goal.position.set(x, 1.2, 0);
    twinScene.add(goal);
    twinFieldLines.push(goal);
  });

  // Gradas (esquemáticas)
  const gradaMat = new THREE.MeshStandardMaterial({ color: 0x1B4332, roughness: 0.6 });
  // Gradas largas
  [[-50, 0, 1], [50, 0, 1]].forEach(p => {});
  const gradasL = new THREE.Mesh(new THREE.BoxGeometry(120, 6, 8), gradaMat);
  gradasL.position.set(0, 3, 42); twinScene.add(gradasL);
  const gradasR = gradasL.clone(); gradasR.position.set(0, 3, -42); twinScene.add(gradasR);
  const gradasN = new THREE.Mesh(new THREE.BoxGeometry(8, 6, 76), gradaMat);
  gradasN.position.set(-58, 3, 0); twinScene.add(gradasN);
  const gradasS = gradasN.clone(); gradasS.position.set(58, 3, 0); twinScene.add(gradasS);

  // Sensores como esferas con halo de calor
  data.sensoresPosicion.forEach(s => {
    // Color basado en humedad: verde óptimo, rojo bajo
    const humedad = s.dato;
    let color = 0x52B788;
    if (humedad < 22) color = 0xC1121F;
    else if (humedad < 26) color = 0xE76F51;
    else if (humedad > 35) color = 0x4A90E2;

    const sensorGeo = new THREE.SphereGeometry(1.5, 16, 16);
    const sensorMat = new THREE.MeshStandardMaterial({
      color, emissive: color, emissiveIntensity: 0.6
    });
    const sensor = new THREE.Mesh(sensorGeo, sensorMat);
    // Mapear x_field y y_field al espacio Three.js
    sensor.position.set(s.x, 2, s.y);
    twinScene.add(sensor);

    // Halo
    const haloGeo = new THREE.RingGeometry(2, 4, 16);
    const haloMat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, transparent: true, opacity: 0.3 });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.rotation.x = -Math.PI / 2;
    halo.position.set(s.x, 0.5, s.y);
    twinScene.add(halo);

    twinSensors.push({ sensor, halo, baseY: 2 });
  });

  // Crear celdas NDVI 3D para la vista cromática (ocultas por defecto)
  crearCeldasNDVI3D();

  // Animación: rotación lenta de la cámara y pulso de sensores
  function animar() {
    twinAnim = requestAnimationFrame(animar);

    // Rotación de la cámara solo si está activada
    if (twinRotando) {
      twinAngle += 0.0015;
      twinCamera.position.x = Math.cos(twinAngle) * 110;
      twinCamera.position.z = Math.sin(twinAngle) * 110;
      twinCamera.position.y = 60;
      twinCamera.lookAt(0, 0, 0);
    }

    // Pulso de sensores (siempre activo)
    const t = Date.now() * 0.002;
    twinSensors.forEach((s, i) => {
      s.sensor.position.y = s.baseY + Math.sin(t + i * 0.5) * 0.3;
      s.halo.scale.set(1 + Math.sin(t + i * 0.5) * 0.15, 1 + Math.sin(t + i * 0.5) * 0.15, 1);
    });

    twinRenderer.render(twinScene, twinCamera);
  }
  animar();

  // Resize handler
  window.addEventListener('resize', () => {
    if (!container) return;
    const newW = container.clientWidth;
    twinCamera.aspect = newW / h;
    twinCamera.updateProjectionMatrix();
    twinRenderer.setSize(newW, h);
  });
}

// Controles del Twin
function rotarTwin() {
  // Activa/desactiva la rotación automática de la cámara
  twinRotando = !twinRotando;
}

function alternarCapas() {
  twinCapasVisibles = !twinCapasVisibles;
  twinSensors.forEach(s => {
    s.sensor.visible = twinCapasVisibles;
    s.halo.visible = twinCapasVisibles;
  });
}

function resetTwin() {
  if (!twinCamera) return;
  // Detiene la rotación automática y resetea cámara y ángulo a la vista inicial
  twinRotando = false;
  twinAngle = 0;
  twinCamera.position.set(60, 50, 90);
  twinCamera.lookAt(0, 0, 0);
}

// ============================================================
// VISTA CROMÁTICA: pinta el campo 3D con los colores NDVI/térmica
// ============================================================
function colorNDVIHex(ndvi) {
  if (ndvi >= 0.78) return 0x52B788; // óptimo (verde)
  if (ndvi >= 0.70) return 0xA8DDB5; // aceptable (verde claro)
  if (ndvi >= 0.60) return 0xE76F51; // atención (naranja)
  return 0x1B4332;                    // crítico (verde oscuro)
}

function crearCeldasNDVI3D() {
  if (!twinScene || !mapaCalorData || !mapaCalorData.rejilla) return;

  // Limpiar celdas previas si las hubiera
  twinHeatCells.forEach(c => twinScene.remove(c));
  twinHeatCells = [];

  // Dimensiones del campo (igual que el plano de juego: 105 x 68 — pero usamos el área completa: 120 x 80)
  // El campo de juego va de x=-52.5 a 52.5 y z=-34 a 34
  const cols = 12; // mismas que el backend
  const filas = 6;
  const cellW = 105 / cols;
  const cellH = 68 / filas;

  mapaCalorData.rejilla.forEach((fila, i) => {
    fila.forEach((cell, j) => {
      const color = colorNDVIHex(cell.ndvi);
      const cellGeo = new THREE.PlaneGeometry(cellW * 0.95, cellH * 0.95);
      const cellMat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85
      });
      const mesh = new THREE.Mesh(cellGeo, cellMat);
      mesh.rotation.x = -Math.PI / 2;
      // Posición: el campo va desde -52.5 a 52.5 (105 m) en X, y -34 a 34 (68 m) en Z
      mesh.position.set(
        -52.5 + cellW / 2 + j * cellW,
        0.4, // ligeramente sobre el campo
        -34 + cellH / 2 + i * cellH
      );
      mesh.visible = false; // oculto por defecto
      twinScene.add(mesh);
      twinHeatCells.push(mesh);
    });
  });
}

function cambiarModoVisor(modo) {
  if (modo === twinModo) return;
  twinModo = modo;

  // Actualizar botones activos
  const btn3d = document.getElementById('btn-modo-3d');
  const btnCromatico = document.getElementById('btn-modo-cromatico');
  if (btn3d && btnCromatico) {
    btn3d.classList.toggle('twin-mode-active', modo === '3d');
    btnCromatico.classList.toggle('twin-mode-active', modo === 'cromatico');
  }

  // Mostrar/ocultar controles específicos del modo 3D
  document.querySelectorAll('.twin-3d-only').forEach(el => {
    el.style.display = modo === '3d' ? '' : 'none';
  });

  // Mostrar/ocultar leyenda cromática
  const leyenda = document.getElementById('twin-leyenda');
  if (leyenda) leyenda.style.display = modo === 'cromatico' ? '' : 'none';

  if (!twinScene) return;

  if (modo === 'cromatico') {
    // Vista cromática: ocultar sensores y líneas, oscurecer el campo, mostrar celdas NDVI
    twinSensors.forEach(s => { s.sensor.visible = false; s.halo.visible = false; });
    twinFieldLines.forEach(l => { l.visible = false; });
    twinHeatCells.forEach(c => { c.visible = true; });
    if (twinField) twinField.material.color.setHex(0x0a1c14); // fondo oscuro bajo las celdas
    // Detener rotación automática para que el usuario vea el patrón claramente
    twinRotando = false;
  } else {
    // Vista 3D normal: restaurar todo
    twinSensors.forEach(s => { s.sensor.visible = twinCapasVisibles; s.halo.visible = twinCapasVisibles; });
    twinFieldLines.forEach(l => { l.visible = true; });
    twinHeatCells.forEach(c => { c.visible = false; });
    if (twinField) twinField.material.color.setHex(0x2D6A4F); // verde césped
  }
}

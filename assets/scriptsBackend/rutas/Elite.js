// Elite.js — Rutas exclusivas para clientes Elite
// Las 4 funcionalidades premium:
//   1. Mapa de calor de uniformidad cromática en tiempo real
//   2. Asistente conversacional para el greenkeeper
//   3. Predicción de riesgo de lesiones
//   4. Digital Twin 3D del estadio

const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');

// Módulo compartido — lógica de próximo partido (también usada por IA.js)
const { obtenerProximoPartido } = require('../ProximoPartido');

// ============================================================
// MIDDLEWARE DE CONTROL DE PLAN
// Bloquea endpoints Elite si el usuario es Smart
// ============================================================
function verificarToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No autenticado' });
  try {
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function soloElite(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No autenticado' });

  try {
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.plan !== 'elite') {
      return res.status(403).json({
        error: 'plan_insuficiente',
        mensaje: 'Esta funcionalidad solo está disponible en el plan Elite. Contacta con tu KAM para hacer un upgrade.'
      });
    }

    req.usuario = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

// ============================================================
// 1. MAPA DE CALOR DE UNIFORMIDAD CROMÁTICA
// ============================================================
router.get('/mapa-calor', soloElite, (req, res) => {
  // Generamos una rejilla 12x6 con valores NDVI simulados
  // Los valores van de 0 (suelo desnudo) a 1 (vegetación óptima)
  const rejilla = [];
  const filas = 6, cols = 12;

  for (let i = 0; i < filas; i++) {
    const fila = [];
    for (let j = 0; j < cols; j++) {
      // NDVI base alto, con variaciones realistas
      let ndvi = 0.78 + Math.random() * 0.15;

      // Zonas problemáticas (Centro Norte y Área Norte)
      if (i === 0 && j >= 5 && j <= 7) ndvi = 0.55 + Math.random() * 0.1;
      if (i === 4 && j >= 0 && j <= 2) ndvi = 0.48 + Math.random() * 0.08;

      // Zona de calentamiento muy usada
      if (i >= 2 && i <= 3 && j >= 1 && j <= 3) ndvi = 0.62 + Math.random() * 0.12;

      const tempTermica = 18 + Math.random() * 4 + (1 - ndvi) * 5; // zonas estresadas más calientes
      let estado = 'optimo';
      if (ndvi < 0.55) estado = 'critico';
      else if (ndvi < 0.65) estado = 'atencion';
      else if (ndvi < 0.75) estado = 'aceptable';

      fila.push({
        x: j, y: i,
        ndvi: +ndvi.toFixed(3),
        temp: +tempTermica.toFixed(1),
        estado
      });
    }
    rejilla.push(fila);
  }

  // Estadísticas globales
  const allNdvi = rejilla.flat().map(c => c.ndvi);
  const ndviMedio = allNdvi.reduce((a, b) => a + b, 0) / allNdvi.length;
  const ndviMin = Math.min(...allNdvi);
  const ndviMax = Math.max(...allNdvi);
  const uniformidad = +((1 - (ndviMax - ndviMin) / ndviMax) * 100).toFixed(1);

  res.json({
    rejilla,
    estadisticas: {
      ndviMedio: +ndviMedio.toFixed(3),
      ndviMin:   +ndviMin.toFixed(3),
      ndviMax:   +ndviMax.toFixed(3),
      uniformidad,
      zonasOptimas:  rejilla.flat().filter(c => c.estado === 'optimo').length,
      zonasAtencion: rejilla.flat().filter(c => c.estado === 'atencion').length,
      zonasCriticas: rejilla.flat().filter(c => c.estado === 'critico').length,
    },
    fuente:      'Axis Q6225-LE + FLIR FH-Series ID',
    procesado:   'NVIDIA Jetson Orin NX (100 TOPS)',
    latencia:    '320 ms',
    actualizado: 'hace 2 segundos'
  });
});

// ============================================================
// 2. ASISTENTE CONVERSACIONAL
// Simulación de respuestas tipo LLM con RAG sobre datos del cliente
// ============================================================
router.post('/asistente', soloElite, (req, res) => {
  const { pregunta } = req.body;
  if (!pregunta || pregunta.trim().length === 0) {
    return res.status(400).json({ error: 'Pregunta vacía' });
  }

  const p = pregunta.toLowerCase();
  let respuesta;

  // Sistema de respuestas basado en palabras clave (simulación de LLM)
  if (p.includes('centro') && (p.includes('campo') || p.includes('está'))) {
    respuesta = `El centro del campo está en condición óptima ahora mismo. La humedad del sensor S07 marca 28%, dentro del rango ideal (25-32%). La temperatura del suelo es 19°C y la salinidad 1.8 dS/m, ambos parámetros normales. El NDVI de la zona es 0.82, indicando vegetación saludable. Solo un detalle: la batería del sensor S07 está al 31%, te recomiendo programar un cambio en la próxima visita técnica.`;
  } else if (p.includes('regar') || p.includes('riego') || p.includes('agua')) {
    respuesta = `Mi recomendación de riego para esta noche: Centro Norte necesita 18 minutos entre las 02:30 y 02:48 (la humedad caerá a 11% en 48h sin riego). Portería Norte 9 minutos entre 03:00 y 03:09. El Área Norte saltarla — tiene salinidad alta y regar empeoraría el problema. El resto del campo está bien con el ciclo programado actual. Con esta planificación ahorrarás unos 14.500 litros esta semana.`;
  } else if (p.includes('lesion') || p.includes('riesgo') || p.includes('jugador')) {
    respuesta = `Hay riesgo medio-alto de lesión en la zona del Centro Norte para el partido del sábado. La predicción cruza tres factores: dureza del terreno prevista 78g (límite reglamentario 100g pero aumenta con uso), humedad baja (18% actualmente, predicción 14%) y uniformidad cromática del 73% en esa zona (por debajo del 85% recomendado). Te sugiero priorizar el riego nocturno y considerar una resiembra parcial. El resto del campo presenta riesgo bajo.`;
  } else if (p.includes('alerta') || p.includes('crítico') || p.includes('critico')) {
    respuesta = `Tienes una alerta crítica activa: Salinidad alta en Área Norte (sensor S09) con CE = 3.2 dS/m. El umbral crítico está en 2.5 dS/m, llevamos casi 3 horas por encima. Esto puede causar estrés hídrico al césped. Mi recomendación: aplicar un riego de lavado en esa zona específica para reducir la salinidad. También hay una alerta preventiva por humedad baja (18%) en Centro Norte.`;
  } else if (p.includes('partido') || p.includes('próximo') || p.includes('proximo') || p.includes('jornada')) {
    respuesta = `El próximo partido es la J35 el sábado. El campo estará en estado APTO según la predicción. He generado el informe oficial automáticamente — está disponible para descarga. Detalles: altura 24mm, dureza prevista 78g, tracción 52 N·m, uniformidad 91%. Detectada poa annua leve en 2 zonas (tratamiento ya recomendado). Si aplicamos las recomendaciones de riego de esta noche y el tratamiento fitosanitario, tendrás el campo en condiciones óptimas para el partido.`;
  } else if (p.includes('hong') || p.includes('plaga') || p.includes('mala hierba')) {
    respuesta = `Estado fitosanitario: detectada poa annua leve en Centro Norte y Área Norte (confianza 87%). También hay riesgo medio de dollar spot en Lateral Izq. para los próximos 3 días — la humedad y temperatura están en el rango óptimo para que aparezca. Te recomiendo aplicar un fungicida preventivo en esa zona y un herbicida selectivo para la poa. El resto del campo está libre de amenazas detectables.`;
  } else if (p.includes('hola') || p.includes('buen') || p.includes('qué tal') || p.includes('que tal')) {
    respuesta = `¡Hola! Soy tu asistente de SensoSmart. Puedo ayudarte con cualquier consulta sobre el estado del campo, recomendaciones de riego, predicciones de lesiones, alertas activas o el próximo partido. ¿En qué te puedo ayudar?`;
  } else if (p.includes('dur') || p.includes('compact')) {
    respuesta = `La dureza media del terreno ahora mismo es 72g (escala FA), dentro del rango reglamentario (<100g). La predicción para el próximo partido es 78g, sigue siendo segura. La zona más dura es Centro Norte (84g previsto) por la humedad baja. Si sigues mi recomendación de riego nocturno, esa zona bajará a unos 70g para el partido.`;
  } else if (p.includes('humedad')) {
    respuesta = `Humedad media del campo: 27.4% (rango ideal 25-32%). Por zonas: Centro Norte 18% (necesita riego urgente), Centro Campo 28% (óptimo), Área Norte 38% (alta, no regar). El sensor más bajo es S03 en Centro Norte y el más alto S09 en Área Norte. La predicción a 48h indica que sin riego el promedio caería a 22%, por lo que el riego nocturno es importante.`;
  } else if (p.includes('temp')) {
    respuesta = `Temperaturas actuales: aire 21°C, suelo medio 19°C, superficie 21°C. No hay riesgo de helada. La temperatura del suelo está en el rango óptimo para ryegrass (15-22°C). En la próxima semana se mantendrán condiciones similares.`;
  } else if (p.includes('bater') || p.includes('sensor')) {
    respuesta = `Tienes 12 sensores activos, todos transmitiendo. La batería media es 87%. El sensor con menos batería es S07 (31%) en Centro Campo — programa un cambio en la próxima visita. Modelo desplegado: Decentlab DL-PR26 con autonomía estimada de 10 años. Calibración suiza certificada vigente.`;
  } else {
    respuesta = `Entiendo tu pregunta sobre "${pregunta.substring(0, 60)}...". Como asistente de SensoSmart tengo acceso a todos los datos del campo en tiempo real. Puedo ayudarte con: estado de zonas concretas, recomendaciones de riego, riesgo de lesiones, alertas activas, predicciones para partidos, fitosanitario, dureza, humedad, temperaturas y estado de los sensores. ¿Quieres que te detalle alguna de estas áreas?`;
  }

  res.json({
    respuesta,
    modelo:    'Llama 3.2 3B (local Jetson) + RAG',
    latencia:  Math.floor(Math.random() * 200 + 100) + ' ms',
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// 3. PREDICCIÓN DE RIESGO DE LESIONES
// Consulta el próximo partido en tiempo real desde football-data.org
// ============================================================
router.get('/lesiones', soloElite, async (req, res) => {
  // Obtener próximo partido real desde football-data.org (módulo compartido)
  const proximoPartido = await obtenerProximoPartido(req.usuario.club);

  res.json({
    proximoPartido,
    resumenGlobal: { riesgoMedio: 'medio', probGlobal: 0.18 },
    porZona: [
      { zona: 'Portería Norte', riesgo: 'bajo',  prob: 0.08, dureza: 70, humedad: 26, uniformidad: 92 },
      { zona: 'Lateral Izq.',   riesgo: 'medio', prob: 0.16, dureza: 76, humedad: 29, uniformidad: 88 },
      { zona: 'Centro Norte',   riesgo: 'alto',  prob: 0.34, dureza: 84, humedad: 18, uniformidad: 73, alerta: 'Combina dureza alta + humedad muy baja' },
      { zona: 'Lateral Der.',   riesgo: 'bajo',  prob: 0.09, dureza: 71, humedad: 31, uniformidad: 91 },
      { zona: 'Portería Sur',   riesgo: 'bajo',  prob: 0.10, dureza: 72, humedad: 27, uniformidad: 90 },
      { zona: 'Centro Campo',   riesgo: 'bajo',  prob: 0.11, dureza: 73, humedad: 28, uniformidad: 91 },
      { zona: 'Área Norte',     riesgo: 'medio', prob: 0.19, dureza: 68, humedad: 38, uniformidad: 84, alerta: 'Salinidad alta puede provocar resbalones' },
      { zona: 'Centro Sur',     riesgo: 'bajo',  prob: 0.12, dureza: 74, humedad: 29, uniformidad: 89 }
    ],
    historico: [
      { temporada: '2024/25', lesionesCampoTotal: 7, lesionesEvitables: 4 },
      { temporada: '2025/26', lesionesCampoTotal: 3, lesionesEvitables: 1, conSmartTurfAI: true }
    ],
    recomendaciones: [
      'PRIORIDAD ALTA: Aplicar riego intensivo nocturno en Centro Norte para reducir dureza (objetivo: <75g)',
      'Aplicar riego de lavado en Área Norte para bajar salinidad antes del partido',
      'Considerar resiembra puntual en Centro Norte (uniformidad cromática 73%, por debajo del 85% recomendado)',
      'Compartir este informe con el cuerpo técnico para ajustar entrenamientos a zonas más seguras'
    ],
    valorPlantillaProtegido: '€ 62.000.000 (jugadores expuestos a zonas de riesgo medio/alto)',
    modelo:    'XGBoost + correlación histórica de lesiones',
    confianza: 0.83
  });
});

// ============================================================
// 4. DIGITAL TWIN — datos para el modelo 3D
// ============================================================
router.get('/digital-twin', soloElite, (req, res) => {
  res.json({
    estadio:          'Santiago Bernabéu',
    capacidad:        81044,
    coordenadasGPS:   { lat: 40.4530, lon: -3.6883 },
    orientacion:      'NNE-SSO (357°)',
    dimensionesCampo: { largo: 105, ancho: 68, area: 7140 },
    capas: {
      cesped:   { tipo: 'Híbrido (Ryegrass 80% + Bermuda 20%)', altura: 24, color: '#2D6A4F' },
      sustrato: { tipo: 'Arena silícea + materia orgánica', profundidad: 25 },
      drenaje:  { tipo: 'Tubular + capa drenante', profundidad: 50 },
      base:     { tipo: 'Geotextil + grava', profundidad: 80 }
    },
    sensoresPosicion: [
      { id: 'S01', x: -42, y: 0,   z: 25, valor: 'humedad', dato: 26 },
      { id: 'S02', x: -25, y: -10, z: 25, valor: 'humedad', dato: 29 },
      { id: 'S03', x: 0,   y: -15, z: 25, valor: 'humedad', dato: 18 },
      { id: 'S04', x: 25,  y: -10, z: 25, valor: 'humedad', dato: 31 },
      { id: 'S05', x: 42,  y: 0,   z: 25, valor: 'humedad', dato: 27 },
      { id: 'S07', x: 0,   y: 0,   z: 25, valor: 'humedad', dato: 28 },
      { id: 'S09', x: -42, y: 22,  z: 25, valor: 'humedad', dato: 38 }
    ],
    iluminacion:        { potenciaLED: '350 lux', cobertura: '100%', uniformidad: 0.86 },
    riego:              { aspersores: 28, sectores: 12, automatizado: true },
    integracionLuces:   'SGL Concept (8 unidades)',
    sistemasIntegrados: ['Riego automático', 'Luces de crecimiento SGL', 'Cámara TV', 'Sistema GPS jugadores']
  });
});

// ============================================================
// 5. PRÓXIMO PARTIDO — datos en tiempo real desde football-data.org
// ============================================================
router.get('/proximo-partido', verificarToken, soloElite, async (req, res) => {
  try {
    const partido = await obtenerProximoPartido(req.usuario.club);
    res.json(partido);
  } catch (error) {
    console.error('Error al obtener próximo partido:', error.message);
    res.status(500).json({ error: 'Error al obtener el próximo partido' });
  }
});

module.exports = router;
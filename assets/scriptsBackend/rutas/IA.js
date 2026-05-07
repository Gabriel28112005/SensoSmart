// IA.js — Rutas de Inteligencia Artificial (Smart y Elite)
// Las 3 IAs disponibles para todos los planes:
//   1. Detección de amenazas fitosanitarias (malas hierbas + hongos)
//   2. Recomendador inteligente de riego
//   3. Generación automática del informe oficial

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../autentificacionRoles/Middleware');

// ============================================================
// 1. DETECCIÓN VISUAL DE AMENAZAS FITOSANITARIAS
// ============================================================
router.get('/fitosanitario', verificarToken, (req, res) => {
  res.json({
    ultimoAnalisis: 'hace 28 minutos',
    estadoGlobal: 'atencion',
    malasHierbas: {
      trebol: { detectado: false, zonas: [], confianza: 0.96 },
      kikuyu: { detectado: false, zonas: [], confianza: 0.94 },
      poa_annua: { detectado: true, zonas: ['Centro Norte', 'Área Norte'], confianza: 0.87, severidad: 'leve' }
    },
    hongos: {
      fusarium: { detectado: false, riesgo: 'bajo', confianza: 0.91 },
      dollar_spot: { detectado: true, zonas: ['Lateral Izq.'], riesgo: 'medio', confianza: 0.78, prevision_dias: 3 },
      antracnosis: { detectado: false, riesgo: 'bajo', confianza: 0.92 }
    },
    recomendaciones: [
      { prioridad: 'alta', texto: 'Aplicar tratamiento preventivo de poa annua en Centro Norte y Área Norte. Detectada en fase muy temprana.' },
      { prioridad: 'media', texto: 'Vigilar Lateral Izq.: condiciones óptimas para dollar spot en próximos 3 días. Considerar fungicida preventivo.' },
      { prioridad: 'info', texto: 'Resto del campo libre de amenazas detectables. Próximo análisis: en 30 minutos.' }
    ],
    modelo: 'YOLOv8 + análisis multivariable',
    proximoAnalisis: 'en 30 minutos'
  });
});

// ============================================================
// 2. RECOMENDADOR INTELIGENTE DE RIEGO
// ============================================================
router.get('/riego', verificarToken, (req, res) => {
  res.json({
    estadoActual: {
      humedadMediaActual: 27.4,
      humedadObjetivo: 30,
      etEstimadaHoy: 4.2,
      precipitacionPrevista48h: 0
    },
    prediccion48h: [
      { zona: 'Portería Norte',  humedadActual: 26, humedadPrevista24h: 22, humedadPrevista48h: 19 },
      { zona: 'Centro Campo',    humedadActual: 28, humedadPrevista24h: 24, humedadPrevista48h: 21 },
      { zona: 'Centro Norte',    humedadActual: 18, humedadPrevista24h: 14, humedadPrevista48h: 11 },
      { zona: 'Área Norte',      humedadActual: 38, humedadPrevista24h: 35, humedadPrevista48h: 32 }
    ],
    recomendaciones: [
      {
        zona: 'Centro Norte',
        accion: 'Regar 18 minutos esta noche entre 02:30 y 02:48',
        motivo: 'Humedad prevista 11% en 48h, muy por debajo del óptimo 30%',
        prioridad: 'alta',
        ahorroAgua: '12% vs riego programado tradicional'
      },
      {
        zona: 'Portería Norte',
        accion: 'Regar 9 minutos esta noche entre 03:00 y 03:09',
        motivo: 'Humedad prevista 19% en 48h, requiere refresco moderado',
        prioridad: 'media',
        ahorroAgua: '18% vs riego programado tradicional'
      },
      {
        zona: 'Área Norte',
        accion: 'No regar — saltar ciclo programado',
        motivo: 'Humedad alta (38%) + salinidad crítica. Riego empeoraría la salinización',
        prioridad: 'alta',
        ahorroAgua: '100% en esta zona durante 48h'
      },
      {
        zona: 'Resto del campo',
        accion: 'Mantener ciclo de riego programado actual',
        motivo: 'Humedad dentro del rango óptimo',
        prioridad: 'info',
        ahorroAgua: '—'
      }
    ],
    ahorroEstimadoSemanal: { litros: 14500, euros: 87 },
    ahorroEstimadoAnual:   { litros: 754000, euros: 4524 },
    modelo: 'LSTM + Penman-Monteith ET₀',
    ultimaActualizacion: 'hace 4 minutos'
  });
});

// ============================================================
// 3. GENERACIÓN AUTOMÁTICA DEL INFORME OFICIAL
// ============================================================
router.get('/informe-oficial', verificarToken, (req, res) => {
  res.json({
    estadio: 'Generado automáticamente',
    jornada: 'Próximo partido (J35)',
    fecha: '3 de mayo, 2026',
    parametros: {
      altura_cesped:     { valor: 24, unidad: 'mm', rango_reglamento: '20-30 mm', cumple: true },
      temperatura_suelo: { valor: 19.2, unidad: '°C', rango_reglamento: '5-30 °C', cumple: true },
      dureza:            { valor: 72, unidad: 'g', rango_reglamento: '<100 g', cumple: true, prediccion_partido: 78 },
      traccion:          { valor: 52, unidad: 'N·m', rango_reglamento: '40-60 N·m', cumple: true },
      uniformidad:       { valor: 91, unidad: '%', rango_reglamento: '>85%', cumple: true, observacion: 'Revisar S03 (Centro Norte)' },
      malas_hierbas:     { valor: 'Poa annua leve (2 zonas)', cumple: false, gravedad: 'menor', observacion: 'Tratamiento preventivo aplicado' }
    },
    veredicto: {
      estado: 'apto',
      observaciones: 'Campo apto para la disputa del partido. Tratar foco de poa annua antes del próximo partido.',
      firmaDigital: 'STA-' + Date.now() + '-AI'
    },
    pdfDisponible: true,
    generadoPorIA: true,
    tiempoAhorrado: '1h 45min vs cumplimentación manual'
  });
});

// ============================================================
// HISTORIAL DE PREDICCIONES (todas las IAs)
// ============================================================
router.get('/historial', verificarToken, (req, res) => {
  res.json([
    { fecha: 'Hoy 09:12', tipo: 'fitosanitaria', resumen: 'Detección poa annua en Centro Norte', confianza: 0.87, ejecutada: true },
    { fecha: 'Hoy 08:30', tipo: 'riego',         resumen: 'Recomendado riego nocturno Centro Norte 18 min', confianza: 0.94, ejecutada: false },
    { fecha: 'Ayer 23:45', tipo: 'informe',      resumen: 'Informe pre-partido J34 generado: APTO', confianza: 1.00, ejecutada: true },
    { fecha: 'Ayer 18:22', tipo: 'fitosanitaria', resumen: 'Riesgo dollar spot Lateral Izq. en 3 días', confianza: 0.78, ejecutada: false },
    { fecha: 'Ayer 09:00', tipo: 'riego',         resumen: 'Riego pospuesto por viento >25 km/h', confianza: 0.99, ejecutada: true }
  ]);
});

module.exports = router;

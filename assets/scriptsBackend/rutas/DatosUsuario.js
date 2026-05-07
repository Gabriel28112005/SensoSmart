const express = require('express');
const router = express.Router();
const { verificarToken } = require('../autentificacionRoles/Middleware');

const SENSORES = [
  { id:'S01', zona:'Portería Norte', capa:'tierra', humedad:26, temp:18, salinidad:1.6, bateria:92, estado:'ok', x:80, y:80 },
  { id:'S02', zona:'Lateral Izq.', capa:'tierra', humedad:29, temp:19, salinidad:1.7, bateria:88, estado:'ok', x:180, y:60 },
  { id:'S03', zona:'Centro Norte', capa:'tierra', humedad:18, temp:22, salinidad:1.9, bateria:85, estado:'alerta', x:300, y:50 },
  { id:'S04', zona:'Lateral Der.', capa:'tierra', humedad:31, temp:19, salinidad:1.7, bateria:91, estado:'ok', x:420, y:60 },
  { id:'S05', zona:'Portería Sur', capa:'tierra', humedad:27, temp:18, salinidad:1.8, bateria:87, estado:'ok', x:520, y:80 },
  { id:'S06', zona:'Centro Izq.', capa:'tierra', humedad:30, temp:19, salinidad:1.6, bateria:90, estado:'ok', x:140, y:150 },
  { id:'S07', zona:'Centro Campo', capa:'tierra', humedad:28, temp:19, salinidad:1.8, bateria:31, estado:'ok', x:300, y:150 },
  { id:'S08', zona:'Centro Der.', capa:'tierra', humedad:32, temp:20, salinidad:1.7, bateria:89, estado:'ok', x:460, y:150 },
  { id:'S09', zona:'Área Norte', capa:'tierra', humedad:38, temp:19, salinidad:3.2, bateria:84, estado:'critico', x:80, y:220 },
  { id:'S10', zona:'Lateral Izq. S', capa:'tierra', humedad:27, temp:18, salinidad:1.7, bateria:93, estado:'ok', x:180, y:240 },
  { id:'S11', zona:'Centro Sur', capa:'tierra', humedad:29, temp:18, salinidad:1.8, bateria:86, estado:'ok', x:300, y:250 },
  { id:'S12', zona:'Lateral Der. S', capa:'tierra', humedad:26, temp:19, salinidad:1.9, bateria:88, estado:'ok', x:420, y:240 },
];

const SUPERFICIE_AIRE = {
  tempSuperficial: 21, tempAire: 21, humedadRelativa: 62,
  velocidadViento: 18, horasSol: 6.5, et: 4.2
};

const ALERTAS = [
  { id:1, sensor:'S09', zona:'Área Norte', tipo:'salinidad_alta', severidad:'critica', titulo:'Salinidad crítica — Sensor S09', descripcion:'CE = 3.2 dS/m · Supera umbral crítico (2.5 dS/m). Riesgo de estrés hídrico.', hora:'09:12', resuelta:false },
  { id:2, sensor:'S03', zona:'Centro Norte', tipo:'humedad_baja', severidad:'preventiva', titulo:'Humedad baja — Sensor S03', descripcion:'VWC = 18% · Por debajo del mínimo recomendado (20%).', hora:'10:45', resuelta:false },
  { id:3, sensor:'general', zona:'Todo el campo', tipo:'viento', severidad:'informativa', titulo:'Viento elevado — Riego pospuesto 45 min', descripcion:'Velocidad del viento: 28 km/h.', hora:'Ayer 18:30', resuelta:true },
];

// GET /api/datos/sensores
router.get('/sensores', verificarToken, (req, res) => res.json(SENSORES));

// GET /api/datos/superficie
router.get('/superficie', verificarToken, (req, res) => res.json(SUPERFICIE_AIRE));

// GET /api/datos/alertas
router.get('/alertas', verificarToken, (req, res) => res.json(ALERTAS));

// GET /api/datos/cumplimiento
router.get('/cumplimiento', verificarToken, (req, res) => res.json({
  altura: { valor: '24mm', ok: true },
  dureza: { valor: '72g', ok: true },
  traccion: { valor: '52 N·m', ok: true },
  uniformidad: { valor: 'Revisar S03', ok: false },
  iluminacion: { valor: '1.850 lux', ok: true }
}));

// GET /api/datos/historico
router.get('/historico', verificarToken, (req, res) => res.json({
  humedad: [
    {mes:'Sep',valor:26},{mes:'Oct',valor:29},{mes:'Nov',valor:32},{mes:'Dic',valor:35},
    {mes:'Ene',valor:34},{mes:'Feb',valor:31},{mes:'Mar',valor:28},{mes:'Abr',valor:28}
  ],
  temperatura: [
    {mes:'Sep',valor:24},{mes:'Oct',valor:21},{mes:'Nov',valor:17},{mes:'Dic',valor:13},
    {mes:'Ene',valor:11},{mes:'Feb',valor:13},{mes:'Mar',valor:17},{mes:'Abr',valor:19}
  ],
  alertas: [
    {mes:'Sep',valor:6},{mes:'Oct',valor:3},{mes:'Nov',valor:2},{mes:'Dic',valor:1},
    {mes:'Ene',valor:2},{mes:'Feb',valor:1},{mes:'Mar',valor:3},{mes:'Abr',valor:2}
  ],
  partidos: [
    {jornada:'J34',fecha:'26 Abr',estado:'apto'},
    {jornada:'J33',fecha:'19 Abr',estado:'apto'},
    {jornada:'J32',fecha:'12 Abr',estado:'condicionado'},
    {jornada:'J31',fecha:'5 Abr',estado:'apto'},
    {jornada:'J30',fecha:'29 Mar',estado:'apto'},
  ]
}));

// GET /api/datos/gestion
router.get('/gestion', verificarToken, (req, res) => res.json({
  mantenimiento: [
    {tarea:'Próxima siega',fecha:'Mañana 07:00',prioridad:'normal'},
    {tarea:'Aireación',fecha:'12 mayo',prioridad:'normal'},
    {tarea:'Resiembra zona S03',fecha:'Urgente',prioridad:'alta'},
    {tarea:'Fertilización',fecha:'20 mayo',prioridad:'normal'},
    {tarea:'Riego de lavado S09',fecha:'Hoy — crítico',prioridad:'critica'},
  ],
  eventos: [
    {tipo:'Partido LaLiga J34',fecha:'26 Abr'},
    {tipo:'Entrenamiento',fecha:'25 Abr'},
    {tipo:'Entrenamiento',fecha:'24 Abr'},
    {tipo:'Partido LaLiga J33',fecha:'19 Abr'},
    {tipo:'Concierto',fecha:'15 Abr'},
  ],
  sistema: { sensoresActivos:12, sensoresTotal:12, bateriaMedia:87, sensorBajaB:'S07 (31%)', ultimaSync:'Hace 8 min', gateway:'Operativo' },
  roles: [
    {usuario:'Carlos Martín',rol:'Greenkeeper',sesion:'Activa'},
    {usuario:'Javier Ruiz',rol:'Dirección',sesion:'Activa'},
    {usuario:'Inspector LaLiga',rol:'Auditoría',sesion:'—'},
  ]
}));

module.exports = router;

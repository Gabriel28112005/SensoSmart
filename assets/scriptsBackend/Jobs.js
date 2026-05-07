const cron = require('node-cron');
const { emitirAlerta, emitirLecturaSensor } = require('./WebSocket');

// Datos simulados para demo
const SENSORES_DEMO = [
  { id: 'S01', zona: 'Portería Norte', humedad: 26, temp: 18, salinidad: 1.6 },
  { id: 'S02', zona: 'Lateral Izq.', humedad: 29, temp: 19, salinidad: 1.7 },
  { id: 'S03', zona: 'Centro Norte', humedad: 18, temp: 22, salinidad: 1.9, alerta: true },
  { id: 'S04', zona: 'Lateral Der.', humedad: 31, temp: 19, salinidad: 1.7 },
  { id: 'S05', zona: 'Portería Sur', humedad: 27, temp: 18, salinidad: 1.8 },
  { id: 'S06', zona: 'Centro Izq.', humedad: 30, temp: 19, salinidad: 1.6 },
  { id: 'S07', zona: 'Centro Campo', humedad: 28, temp: 19, salinidad: 1.8 },
  { id: 'S08', zona: 'Centro Der.', humedad: 32, temp: 20, salinidad: 1.7 },
  { id: 'S09', zona: 'Área Norte', humedad: 38, temp: 19, salinidad: 3.2, critico: true },
  { id: 'S10', zona: 'Lateral Izq. S', humedad: 27, temp: 18, salinidad: 1.7 },
  { id: 'S11', zona: 'Centro Sur', humedad: 29, temp: 18, salinidad: 1.8 },
  { id: 'S12', zona: 'Lateral Der. S', humedad: 26, temp: 19, salinidad: 1.9 },
];

function iniciarJobs() {
  // Emitir lecturas de sensores cada 15 minutos
  cron.schedule('*/15 * * * *', () => {
    console.log('[Job] Emitiendo lecturas de sensores...');
    SENSORES_DEMO.forEach(s => {
      // Pequeña variación aleatoria para simular datos reales
      const lectura = {
        ...s,
        humedad: +(s.humedad + (Math.random() * 2 - 1)).toFixed(1),
        temp: +(s.temp + (Math.random() * 0.6 - 0.3)).toFixed(1),
        timestamp: new Date().toISOString()
      };
      emitirLecturaSensor(lectura);

      // Generar alertas si procede
      if (lectura.humedad < 20) {
        emitirAlerta({
          sensor: s.id, zona: s.zona,
          tipo: 'humedad_baja', severidad: 'preventiva',
          mensaje: `Humedad baja en ${s.zona}: ${lectura.humedad}%`
        });
      }
      if (lectura.salinidad > 2.5) {
        emitirAlerta({
          sensor: s.id, zona: s.zona,
          tipo: 'salinidad_alta', severidad: 'critica',
          mensaje: `Salinidad crítica en ${s.zona}: ${lectura.salinidad} dS/m`
        });
      }
    });
  });

  // Generar informe diario pre-partido a las 8:00
  cron.schedule('0 8 * * *', () => {
    console.log('[Job] Generando informe diario pre-partido...');
  });

  console.log('Jobs programados iniciados');
}

module.exports = { iniciarJobs };

// ProximoPartido.js — Módulo compartido para obtener el próximo partido
// Usado por Elite.js e IA.js para evitar duplicar la lógica
// API: football-data.org (gratuita, temporada actual incluida)

async function obtenerProximoPartido(club) {
  // IDs de football-data.org — LaLiga EA Sports 2025/26
  const EQUIPOS = {
    'Real Madrid CF':        86,
    'FC Barcelona':          81,
    'Atlético de Madrid':    78,
    'Athletic Bilbao':       77,
    'Villarreal CF':         94,
    'Real Betis':            90,
    'Celta de Vigo':         558,
    'Getafe CF':             82,
    'Real Sociedad':         92,
    'Osasuna':               79,
    'Rayo Vallecano':        876,
    'Valencia CF':           95,
    'Espanyol':              80,
    'Girona FC':             298,
    'Sevilla FC':            559,
    'Deportivo Alavés':      263,
    'RCD Mallorca':          89,
    'Levante UD':            97,
    'Elche CF':              745,
    'Real Oviedo':           285,
  };

  const equipoId = EQUIPOS[club];
  if (!equipoId) return { jornada: '—', fecha: '—', diasRestantes: '—', rival: '—' };

  try {
    const response = await fetch(
      `https://api.football-data.org/v4/teams/${equipoId}/matches?status=SCHEDULED&limit=1`,
      {
        headers: {
          'X-Auth-Token': process.env.FOOTBALLDATA_KEY,
          'User-Agent':   'SensoSmart/1.0'
        }
      }
    );
    const data = await response.json();
    const match = data.matches?.[0];

    if (!match) return { jornada: '—', fecha: '—', diasRestantes: '—', rival: '—' };

    const fecha = new Date(match.utcDate);
    const ahora = new Date();

    // Comparar solo fechas de calendario (sin horas) para evitar errores de zona horaria
    const fechaSoloFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
    const ahoraSoloFecha = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    const diffDias = Math.round((fechaSoloFecha - ahoraSoloFecha) / (1000 * 60 * 60 * 24));

    const jornada = match.matchday ? `J${match.matchday}` : '—';
    const esLocal  = match.homeTeam.id === equipoId;
    const rival    = esLocal ? match.awayTeam.name : match.homeTeam.name;

    return {
      jornada,
      fecha:         fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }),
      diasRestantes: diffDias > 0 ? diffDias : 0,
      rival,
      esLocal
    };
  } catch (e) {
    console.error('Error obteniendo próximo partido:', e.message);
    return { jornada: '—', fecha: '—', diasRestantes: '—', rival: '—' };
  }
}

module.exports = { obtenerProximoPartido };
const WebSocket = require('ws');

let wss;
const clientes = new Map();

function iniciarWebSocket(server) {
  wss = new WebSocket.Server({ server });

  wss.on('connection', (ws, req) => {
    const id = Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    clientes.set(id, { ws, estadio: null, plan: 'smart' });
    console.log(`WebSocket: cliente ${id} conectado`);

    ws.send(JSON.stringify({ tipo: 'conexion', mensaje: 'SensoSmart WebSocket activo' }));

    ws.on('message', (msg) => {
      try {
        const datos = JSON.parse(msg);
        if (datos.tipo === 'ping') ws.send(JSON.stringify({ tipo: 'pong' }));

        // El cliente se identifica con su estadio para recibir solo sus datos
        if (datos.tipo === 'identificar') {
          const c = clientes.get(id);
          if (c) {
            c.estadio = datos.estadio || null;
            c.plan = datos.plan || 'smart';
            console.log(`WS: cliente ${id} → estadio="${c.estadio}", plan="${c.plan}"`);
          }
        }
      } catch (e) {}
    });

    ws.on('close', () => {
      clientes.delete(id);
      console.log(`WebSocket: cliente ${id} desconectado`);
    });

    ws.on('error', (err) => console.error('WebSocket error:', err.message));
  });

  console.log('WebSocket iniciado');
}

// Emitir a todos los clientes (compatible con código existente)
function emitirATodos(datos) {
  const payload = JSON.stringify(datos);
  clientes.forEach((c) => {
    if (c.ws.readyState === WebSocket.OPEN) c.ws.send(payload);
  });
}

// Emitir solo a clientes de un estadio concreto
function emitirAEstadio(estadio, datos) {
  const payload = JSON.stringify(datos);
  clientes.forEach((c) => {
    if (c.ws.readyState === WebSocket.OPEN && (c.estadio === estadio || c.plan === 'admin')) {
      c.ws.send(payload);
    }
  });
}

// Emitir solo a clientes Elite
function emitirAElite(datos) {
  const payload = JSON.stringify(datos);
  clientes.forEach((c) => {
    if (c.ws.readyState === WebSocket.OPEN && c.plan === 'elite') {
      c.ws.send(payload);
    }
  });
}

function emitirAlerta(alerta) {
  if (alerta.estadio) emitirAEstadio(alerta.estadio, { tipo: 'alerta', datos: alerta });
  else emitirATodos({ tipo: 'alerta', datos: alerta });
}

function emitirLecturaSensor(lectura) {
  if (lectura.estadio) emitirAEstadio(lectura.estadio, { tipo: 'sensor', datos: lectura });
  else emitirATodos({ tipo: 'sensor', datos: lectura });
}

module.exports = {
  iniciarWebSocket,
  emitirATodos,
  emitirAEstadio,
  emitirAElite,
  emitirAlerta,
  emitirLecturaSensor
};

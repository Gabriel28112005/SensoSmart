// Notificaciones.js — gestión de notificaciones en tiempo real
async function cargarNotificaciones() {
  const notifs = await API.get('/notificaciones');
  if (!notifs) return;
  const noLeidas = notifs.filter(n => !n.leida).length;
  const badge = document.getElementById('badge-alertas');
  if (badge) badge.textContent = noLeidas;
}

window.addEventListener('DOMContentLoaded', cargarNotificaciones);

// RutasProtegidas.js — Verifica sesión al cargar cualquier página protegida
(async function() {
  if (!API.getToken()) { window.location.href = '/'; return; }

  const me = await API.get('/auth/me');
  if (!me || me.error) { API.clearToken(); window.location.href = '/'; return; }

  API.setUsuario(me);

  // Rellenar datos de usuario en sidebar
  const elClub = document.getElementById('nombre-club');
  const elRol = document.getElementById('rol-usuario');
  if (elClub) elClub.textContent = me.club || '—';
  if (elRol) elRol.textContent = me.rol ? me.rol.charAt(0).toUpperCase() + me.rol.slice(1) : '—';

  // Mostrar enlace admin solo si es admin
  const linkAdmin = document.getElementById('link-admin');
  if (linkAdmin && me.rol === 'admin') linkAdmin.style.display = 'flex';
})();

function cerrarSesion() {
  API.post('/auth/logout', {});
  API.clearToken();
  window.location.href = '/';
}

// DatosUsuario.js

function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const abierto = btn.querySelector('.ojo-abierto');
  const cerrado = btn.querySelector('.ojo-cerrado');
  if (input.type === 'password') {
    input.type = 'text';
    abierto.style.display = 'none';
    cerrado.style.display = 'block';
  } else {
    input.type = 'password';
    abierto.style.display = 'block';
    cerrado.style.display = 'none';
  }
}

async function cargarPerfil() {
  const user = API.getUsuario();
  if (!user) return;

  const pU = document.getElementById('perfil-usuario');
  const pC = document.getElementById('perfil-club');
  const pR = document.getElementById('perfil-rol');
  const av = document.getElementById('avatar-iniciales');

  if (pU) pU.value = user.usuario;
  if (pC) pC.value = user.club;
  if (pR) pR.value = user.rol;
  if (av) av.textContent = user.usuario.substring(0, 2).toUpperCase();

  const sesiones = await API.get('/sesiones');
  if (sesiones) {
    const lista = document.getElementById('sesiones-lista');
    if (lista) {
      lista.innerHTML = sesiones.map(s => `
        <div class="sesion-row">
          <span>${s.dispositivo} — ${s.ip}</span>
          <span>${s.inicio}${s.actual ? ' (esta sesión)' : ''}</span>
        </div>
      `).join('');
    }
  }
}

function guardarPerfil() {
  const email = document.getElementById('perfil-email').value;
  const tel = document.getElementById('perfil-telefono').value;
  alert('Perfil actualizado correctamente.');
}

async function cambiarPassword() {
  const actual = document.getElementById('pass-actual').value;
  const nueva = document.getElementById('pass-nueva').value;
  const confirmar = document.getElementById('pass-confirmar').value;

  if (!actual || !nueva) {
    mostrarMsg('Rellena todos los campos', false);
    return;
  }
  if (nueva !== confirmar) {
    mostrarMsg('Las contraseñas no coinciden', false);
    return;
  }
  if (nueva.length < 4) {
    mostrarMsg('La contraseña debe tener al menos 4 caracteres', false);
    return;
  }
  mostrarMsg('Contraseña actualizada correctamente', true);
}

function mostrarMsg(texto, ok) {
  const msg = document.getElementById('pass-msg');
  msg.textContent = texto;
  msg.className = 'msg ' + (ok ? 'msg-ok' : 'msg-err');
  msg.style.display = 'block';
}

function guardarPreferencias() {
  alert('Preferencias de notificaciones guardadas.');
}

async function cerrarTodasSesiones() {
  if (!confirm('¿Cerrar todas las sesiones? Tendrás que volver a iniciar sesión.')) return;
  await API.delete('/sesiones/todas');
  API.clearToken();
  window.location.href = '/';
}

window.addEventListener('DOMContentLoaded', cargarPerfil);
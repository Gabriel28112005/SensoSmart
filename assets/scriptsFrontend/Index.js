// Index.js — Lógica del login

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

async function iniciarSesion() {
  const nombreUsuario = document.getElementById('usuario').value.trim();
  const contrasena = document.getElementById('password').value;
  const errorEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  if (!nombreUsuario || !contrasena) {
    mostrarError('Por favor introduce usuario y contraseña.');
    return;
  }

  btn.textContent = 'Accediendo...';
  btn.disabled = true;
  errorEl.style.display = 'none';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombreUsuario,
        contrasena,
        tipoDispositivo: navigator.userAgent
      })
    });
    const data = await res.json();

    if (data.mensaje && res.status !== 200) {
      mostrarError(data.mensaje);
      btn.textContent = 'Acceder';
      btn.disabled = false;
      return;
    }

    localStorage.setItem('sai_token', data.token);
    localStorage.setItem('sai_user', JSON.stringify({
      usuario: data.nombreUsuario,
      rol:     data.rol,
      plan:    data.plan || 'smart',
      club:    data.club,
      estadio: data.estadio
    }));

    // Redirección según rol y plan
    if (data.rol === 'admin') {
      window.location.href = '/admin';
    } else if (data.plan === 'elite') {
      window.location.href = '/dashboard-elite';
    } else {
      window.location.href = '/dashboard';
    }

  } catch (e) {
    mostrarError('Error de conexión con el servidor.');
    btn.textContent = 'Acceder';
    btn.disabled = false;
  }
}

function mostrarError(msg) {
  const el = document.getElementById('login-error');
  el.textContent = msg;
  el.style.display = 'block';
}

(function () {
  if (localStorage.getItem('sai_token')) {
    try {
      const u = JSON.parse(localStorage.getItem('sai_user') || '{}');
      if (u.rol === 'admin') window.location.href = '/admin';
      else if (u.plan === 'elite') window.location.href = '/dashboard-elite';
      else window.location.href = '/dashboard';
    } catch {
      window.location.href = '/dashboard';
    }
  }
})();
(function () {
  const paginaActual = window.location.pathname;

  const esPerfil = paginaActual === '/perfil';
  const esSensores = paginaActual === '/tecnico';
  const esDashboard = paginaActual === '/dashboard' || paginaActual === '/dashboard-elite';
  const esAdmin = paginaActual === '/admin';
  const dashboardAbierto = esDashboard;

  // Obtener plan del usuario actual (smart o elite)
  let plan = 'smart';
  try {
    const u = JSON.parse(localStorage.getItem('sai_user') || '{}');
    plan = u.plan || 'smart';
  } catch {}

  const dashboardHref = plan === 'elite' ? '/dashboard-elite' : '/dashboard';
  const planBadge = plan === 'elite'
    ? '<span class="plan-badge plan-elite">ELITE</span>'
    : '<span class="plan-badge plan-smart">SMART</span>';

  // Sección IA — disponible en ambos planes
  const navIA = `
    <a href="${dashboardHref}#ia" class="nav-link">
      <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1l1.5 4.5L14 7l-3.5 2L8 13.5 5.5 9 2 7l4.5-1.5z"/>
      </svg>
      Inteligencia Artificial
    </a>
  `;

  // Sección Elite — solo si el plan es elite
  const navElite = plan === 'elite' ? `
    <div class="nav-elite-section">
      <div class="nav-elite-title">EXCLUSIVAS ELITE</div>
      <a href="/dashboard-elite#asistente" class="nav-link nav-elite-link">
        <span class="elite-dot"></span>Asistente IA
      </a>
      <a href="/dashboard-elite#lesiones" class="nav-link nav-elite-link">
        <span class="elite-dot"></span>Riesgo lesiones
      </a>
      <a href="/dashboard-elite#twin" class="nav-link nav-elite-link">
        <span class="elite-dot"></span>Visor 3D / Cromático
      </a>
    </div>
  ` : '';

  const html = esAdmin ? `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#52B788" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="4" fill="#52B788" opacity=".4"/>
            <circle cx="12" cy="12" r="2" fill="#52B788"/>
          </svg>
        </div>
        <div>
          <div class="logo-name">Smart Turf AI <span class="plan-badge plan-admin">ADMIN</span></div>
          <div class="logo-club" id="nombre-club">—</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <a href="/admin" class="nav-link active">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9l-3 1.5.5-3.5L3 4.5 6.5 4z"/>
          </svg>
          Panel de administración
        </a>
      </nav>

      <div class="sidebar-footer">
        <span id="rol-usuario">Administrador</span><br/>
        Acceso interno
        <button class="btn-logout" onclick="cerrarSesion()">Cerrar sesión</button>
      </div>
    </aside>
  ` : `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#52B788" stroke-width="1.5"/>
            <circle cx="12" cy="12" r="4" fill="#52B788" opacity=".4"/>
            <circle cx="12" cy="12" r="2" fill="#52B788"/>
          </svg>
        </div>
        <div>
          <div class="logo-name">Smart Turf AI ${planBadge}</div>
          <div class="logo-club" id="nombre-club">—</div>
        </div>
      </div>

      <nav class="sidebar-nav">

        <a href="/perfil" class="nav-link ${esPerfil ? 'active' : ''}">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 8a3 3 0 100-6 3 3 0 000 6zm-5 6a5 5 0 0110 0H3z"/>
          </svg>
          Mi perfil
        </a>

        <a href="/tecnico" class="nav-link ${esSensores ? 'active' : ''}">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="8" r="2.5"/>
            <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" stroke-width="1.2"/>
            <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" stroke-width="1.2"/>
            <line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" stroke-width="1.2"/>
            <line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          Sensores
        </a>

        <div class="nav-dropdown">
          <button class="nav-dropdown-btn ${dashboardAbierto ? 'active open' : ''}"
                  onclick="toggleDashboard(this)">
            <span class="nav-dropdown-left">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M1 1h6v6H1V1zm8 0h6v6H9V1zM1 9h6v6H1V9zm8 0h6v6H9V9z"/>
              </svg>
              Dashboard
            </span>
            <svg class="nav-arrow" width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M3 2l4 3-4 3V2z"/>
            </svg>
          </button>
          <div class="nav-sub ${dashboardAbierto ? 'open' : ''}" id="dashboard-sub">
            <a href="${dashboardHref}#alertas" class="nav-sub-link" onclick="irSeccion('alertas')">
              <span class="nav-sub-dot"></span>Alertas
              <span class="nav-badge" id="badge-alertas" style="display:none">0</span>
            </a>
            <a href="${dashboardHref}#historial" class="nav-sub-link" onclick="irSeccion('historial')">
              <span class="nav-sub-dot"></span>Historial
            </a>
            <a href="${dashboardHref}#gestion" class="nav-sub-link" onclick="irSeccion('gestion')">
              <span class="nav-sub-dot"></span>Gestión
            </a>
          </div>
        </div>

        ${navIA}

        ${navElite}

        <a href="/admin" class="nav-link nav-admin ${esAdmin ? 'active' : ''}"
           id="link-admin" style="display:none">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 1l1.5 3 3.5.5-2.5 2.5.5 3.5L8 9l-3 1.5.5-3.5L3 4.5 6.5 4z"/>
          </svg>
          Admin
        </a>

      </nav>

      <div class="sidebar-footer">
        <span id="rol-usuario">—</span><br/>
        Plan ${plan === 'elite' ? 'Elite' : 'Smart'} · 2025/26
        <button class="btn-logout" onclick="cerrarSesion()">Cerrar sesión</button>
      </div>
    </aside>
  `;

  const appLayout = document.querySelector('.app-layout');
  if (appLayout) {
    appLayout.insertAdjacentHTML('afterbegin', html);
  }

  window.toggleDashboard = function (btn) {
    btn.classList.toggle('open');
    document.getElementById('dashboard-sub').classList.toggle('open');
  };

  window.irSeccion = function (id) {
    const dashboardPaths = ['/dashboard', '/dashboard-elite'];
    if (dashboardPaths.includes(window.location.pathname)) {
      event.preventDefault();
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  async function actualizarBadgeAlertas() {
    const badge = document.getElementById('badge-alertas');
    if (!badge) return;
    const notifs = await API.get('/notificaciones');
    if (!notifs) return;
    const noLeidas = notifs.filter(n => !n.leida).length;
    badge.textContent = noLeidas;
    badge.style.display = noLeidas > 0 ? 'inline' : 'none';
  }

  function configurarRol() {
    const user = API.getUsuario();
    if (!user) return;
    const elClub   = document.getElementById('nombre-club');
    const elRol    = document.getElementById('rol-usuario');
    const linkAdmin = document.getElementById('link-admin');
    if (elClub)    elClub.textContent = user.club || '—';
    if (elRol)     elRol.textContent  = user.rol
      ? user.rol.charAt(0).toUpperCase() + user.rol.slice(1)
      : '—';
    if (linkAdmin && user.rol === 'admin') linkAdmin.style.display = 'flex';
  }

  configurarRol();
  actualizarBadgeAlertas();
})();

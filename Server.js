require('dotenv').config();

const vars = ['PORT', 'JWT_SECRET', 'SESSION_SECRET'];
vars.forEach(v => {
  if (!process.env[v]) {
    console.error(`ERROR: Variable de entorno ${v} no definida. Revisa el archivo .env`);
    process.exit(1);
  }
});

const express = require('express');
const session = require('express-session');
const cors    = require('cors');
const http    = require('http');
const path    = require('path');

const { iniciarWebSocket } = require('./assets/scriptsBackend/WebSocket');
const { iniciarJobs }      = require('./assets/scriptsBackend/Jobs');

const autentificacionRutas = require('./assets/scriptsBackend/rutas/AutentificacionRutas');
const usuariosRutas        = require('./assets/scriptsBackend/rutas/Usuarios');
const datosUsuarioRutas    = require('./assets/scriptsBackend/rutas/DatosUsuario');
const sesionesRutas        = require('./assets/scriptsBackend/rutas/Sesiones');
const notificacionesRutas  = require('./assets/scriptsBackend/rutas/Notificaciones');
const iaRutas              = require('./assets/scriptsBackend/rutas/IA');
const eliteRutas           = require('./assets/scriptsBackend/rutas/Elite');

const app    = express();
const server = http.createServer(app);

// CORS — una sola configuración
app.use(cors({
  origin: ['http://localhost:3000', 'https://tu-dominio.pages.dev'],
  credentials: true
}));

// Cabecera de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret:            process.env.SESSION_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 }
}));

// Archivos estáticos
app.use(express.static(path.join(__dirname)));
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/html',   express.static(path.join(__dirname, 'html')));

// Rutas API
app.use('/api/auth',          autentificacionRutas);
app.use('/api/usuarios',      usuariosRutas);
app.use('/api/datos',         datosUsuarioRutas);
app.use('/api/sesiones',      sesionesRutas);
app.use('/api/notificaciones', notificacionesRutas);
app.use('/api/ia',            iaRutas);
app.use('/api/elite',         eliteRutas);

// Rutas HTML
app.get('/',                (req, res) => res.sendFile(path.join(__dirname, 'Index.html')));
app.get('/dashboard',       (req, res) => res.sendFile(path.join(__dirname, 'html', 'Mapa.html')));
app.get('/dashboard-elite', (req, res) => res.sendFile(path.join(__dirname, 'html', 'DashboardElite.html')));
app.get('/tecnico',         (req, res) => res.sendFile(path.join(__dirname, 'html', 'Tecnico.html')));
app.get('/admin',           (req, res) => res.sendFile(path.join(__dirname, 'html', 'Admin.html')));
app.get('/perfil',          (req, res) => res.sendFile(path.join(__dirname, 'html', 'DatosUsuario.html')));
app.get('/upgrade',         (req, res) => res.sendFile(path.join(__dirname, 'html', 'Upgrade.html')));

iniciarWebSocket(server);
iniciarJobs();

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`SensoSmart corriendo en http://localhost:${PORT}`);
  console.log(`Entorno: ${process.env.NODE_ENV}`);
  console.log(`UAX · SENER 2026 — Grupo 15`);
});
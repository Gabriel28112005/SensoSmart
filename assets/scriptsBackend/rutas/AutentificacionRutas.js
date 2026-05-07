require('dotenv').config();
const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../Db');
const { emitirATodos } = require('../WebSocket');

function enviarNotificacion(roles, datos) {
  emitirATodos({ tipo: 'notificacion', roles, datos });
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { nombreUsuario, contrasena, tipoDispositivo } = req.body;

  if (!nombreUsuario || !contrasena) {
    return res.status(400).json({ mensaje: 'El nombre de usuario y la contraseña son obligatorios.' });
  }

  try {
    // Consulta parametrizada — previene SQL Injection
    const [filas] = await pool.execute(
      `SELECT id, usuario AS nombreUsuario, password_hash AS contrasena,
              rol, plan, club, estadio
       FROM usuarios
       WHERE usuario = ? AND activo = 1
       LIMIT 1`,
      [nombreUsuario.toLowerCase().trim()]
    );

    // Respuesta genérica para no revelar si el usuario existe
    if (filas.length === 0) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
    }

    const usuario = filas[0];

    // Verificación de contraseña con bcrypt
    const contrasenaCorrecta = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!contrasenaCorrecta) {
      return res.status(401).json({ mensaje: 'Usuario o contraseña incorrectos.' });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id:            usuario.id,
        nombreUsuario: usuario.nombreUsuario,
        rol:           usuario.rol,
        plan:          usuario.plan || 'smart',
        club:          usuario.club,
        estadio:       usuario.estadio
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Obtener IP real del cliente
    const ipRaw       = req.ip || req.connection.remoteAddress || 'Desconocida';
    const direccionIP = ipRaw.startsWith('::ffff:')
      ? ipRaw.slice(7)
      : ipRaw.replace('::1', '127.0.0.1');
    const dispositivoInfo = tipoDispositivo || 'Desconocido';

    // Registrar sesión en la base de datos
    await pool.execute(
      `INSERT INTO sesiones (idUsuario, nombreUsuario, tipoDispositivo, direccionIP)
       VALUES (?, ?, ?, ?)`,
      [usuario.id, usuario.nombreUsuario, dispositivoInfo, direccionIP]
    );

    // Notificar al admin en tiempo real
    enviarNotificacion(['administrador'], { tipo: 'actualizarSesiones' });

    return res.status(200).json({
      token,
      rol:           usuario.rol,
      plan:          usuario.plan || 'smart',
      nombreUsuario: usuario.nombreUsuario,
      club:          usuario.club,
      estadio:       usuario.estadio
    });

  } catch (error) {
    console.error('Error en /api/auth/login:', error.message);
    return res.status(500).json({ mensaje: 'Error interno del servidor.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({ mensaje: 'Sesión cerrada correctamente' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No autenticado' });
  try {
    const token   = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({
      usuario: decoded.nombreUsuario,
      rol:     decoded.rol,
      plan:    decoded.plan || 'smart',
      club:    decoded.club,
      estadio: decoded.estadio
    });
  } catch {
    res.status(401).json({ error: 'Token inválido o expirado' });
  }
});

module.exports = router;
const express = require('express');
const router  = express.Router();
const { verificarToken, soloAdmin } = require('../autentificacionRoles/Middleware');
const pool = require('../Db');

// GET /api/sesiones — devuelve las sesiones activas
router.get('/', verificarToken, async (req, res) => {
  try {
    const [filas] = await pool.execute(
      `SELECT id, nombreUsuario, tipoDispositivo, direccionIP, inicio, activa
       FROM sesiones
       WHERE activa = 1
       ORDER BY inicio DESC
       LIMIT 10`
    );

    const ahora = new Date();
    const sesiones = filas.map((s, i) => {
      const inicio = new Date(s.inicio);
      const esHoy = inicio.toDateString() === ahora.toDateString();
      const h = inicio.getHours().toString().padStart(2, '0');
      const m = inicio.getMinutes().toString().padStart(2, '0');
      return {
        id:          s.id,
        dispositivo: s.tipoDispositivo || 'Desconocido',
        ip:          s.direccionIP     || 'Desconocida',
        inicio:      `${esHoy ? 'Hoy' : 'Ayer'} ${h}:${m}`,
        actual:      i === 0
      };
    });

    res.json(sesiones);

  } catch (error) {
    console.error('Error al obtener sesiones:', error.message);
    res.status(500).json({ error: 'Error al obtener sesiones' });
  }
});

// GET /api/sesiones/log — log de accesos para el panel admin
router.get('/log', verificarToken, soloAdmin, async (req, res) => {
  try {
    const [filas] = await pool.execute(
      `SELECT nombreUsuario, tipoDispositivo, direccionIP, inicio
       FROM sesiones
       ORDER BY inicio DESC
       LIMIT 20`
    );

    const ahora = new Date();
    const log = filas.map(s => {
      const inicio = new Date(s.inicio);
      const esHoy = inicio.toDateString() === ahora.toDateString();
      const h = inicio.getHours().toString().padStart(2, '0');
      const m = inicio.getMinutes().toString().padStart(2, '0');
      const cuando = `${esHoy ? 'Hoy' : 'Ayer'} ${h}:${m}`;

      // Simplificar el tipoDispositivo (user agent) a algo legible
      const ua = s.tipoDispositivo || '';
      let dispositivo = 'Dispositivo desconocido';
      if (ua.includes('Chrome') && ua.includes('Windows'))   dispositivo = 'Chrome / Windows';
      else if (ua.includes('Chrome') && ua.includes('Mac'))  dispositivo = 'Chrome / Mac';
      else if (ua.includes('Chrome') && ua.includes('Linux')) dispositivo = 'Chrome / Linux';
      else if (ua.includes('Safari') && ua.includes('iPad')) dispositivo = 'Safari / iPad';
      else if (ua.includes('Safari') && ua.includes('iPhone')) dispositivo = 'Safari / iPhone';
      else if (ua.includes('Firefox'))                       dispositivo = 'Firefox';
      else if (ua.includes('Desconocido'))                   dispositivo = 'Desconocido';

      return `${cuando} — ${s.nombreUsuario} inició sesión desde ${dispositivo} (${s.direccionIP || 'IP desconocida'})`;
    });

    res.json(log);

  } catch (error) {
    console.error('Error al obtener log de sesiones:', error.message);
    res.status(500).json({ error: 'Error al obtener log' });
  }
});

// DELETE /api/sesiones/todas — cierra todas las sesiones activas
router.delete('/todas', verificarToken, async (req, res) => {
  try {
    await pool.execute(
      `UPDATE sesiones SET activa = 0, fin = NOW() WHERE activa = 1`
    );
    res.json({ mensaje: 'Todas las sesiones cerradas correctamente' });
  } catch (error) {
    console.error('Error al cerrar sesiones:', error.message);
    res.status(500).json({ error: 'Error al cerrar sesiones' });
  }
});

module.exports = router;
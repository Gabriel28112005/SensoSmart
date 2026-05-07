const express = require('express');
const router  = express.Router();
const { verificarToken } = require('../autentificacionRoles/Middleware');
const pool = require('../Db');

// GET /api/sesiones — devuelve las sesiones activas desde la base de datos
router.get('/', verificarToken, async (req, res) => {
  try {
    const [filas] = await pool.execute(
      `SELECT id, nombreUsuario, tipoDispositivo, direccionIP, inicio, activa
       FROM sesiones
       WHERE activa = 1
       ORDER BY inicio DESC
       LIMIT 10`
    );

    // Formatear la hora de inicio para mostrarlo de forma legible
    const sesiones = filas.map((s, i) => {
      const inicio = new Date(s.inicio);
      const h = inicio.getHours().toString().padStart(2, '0');
      const m = inicio.getMinutes().toString().padStart(2, '0');
      return {
        id:              s.id,
        dispositivo:     s.tipoDispositivo || 'Desconocido',
        ip:              s.direccionIP     || 'Desconocida',
        inicio:          `Hoy ${h}:${m}`,
        actual:          i === 0
      };
    });

    res.json(sesiones);

  } catch (error) {
    console.error('Error al obtener sesiones:', error.message);
    res.status(500).json({ error: 'Error al obtener sesiones' });
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
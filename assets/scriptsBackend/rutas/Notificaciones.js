// Notificaciones.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../autentificacionRoles/Middleware');

router.get('/', verificarToken, (req, res) => {
  res.json([
    { id:1, tipo:'critica', mensaje:'Salinidad crítica en Área Norte (S09)', leida:false, hora:'09:12' },
    { id:2, tipo:'preventiva', mensaje:'Humedad baja en Centro Norte (S03)', leida:false, hora:'10:45' },
    { id:3, tipo:'informativa', mensaje:'Riego pospuesto por viento elevado', leida:true, hora:'Ayer 18:30' },
  ]);
});

router.patch('/:id/leer', verificarToken, (req, res) => {
  res.json({ mensaje: `Notificación ${req.params.id} marcada como leída` });
});

module.exports = router;

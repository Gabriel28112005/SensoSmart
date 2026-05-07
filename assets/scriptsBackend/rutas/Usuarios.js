// Usuarios.js
const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../autentificacionRoles/Middleware');

const usuarios = [
  { id:1, usuario:'greenkeeper', club:'Real Madrid CF', rol:'greenkeeper', activo:true },
  { id:2, usuario:'director', club:'Real Madrid CF', rol:'director', activo:true },
  { id:3, usuario:'auditor', club:'LaLiga', rol:'auditor', activo:true },
  { id:4, usuario:'admin', club:'Smart Turf AI', rol:'admin', activo:true },
  { id:5, usuario:'barcelona', club:'FC Barcelona', rol:'greenkeeper', activo:true },
  { id:6, usuario:'atletico', club:'Atlético de Madrid', rol:'greenkeeper', activo:true },
];

router.get('/', verificarToken, soloAdmin, (req, res) => res.json(usuarios));
router.post('/', verificarToken, soloAdmin, (req, res) => {
  const { usuario, club, rol } = req.body;
  if (!usuario || !club || !rol) return res.status(400).json({ error: 'Datos incompletos' });
  const nuevo = { id: Date.now(), usuario, club, rol, activo: true };
  usuarios.push(nuevo);
  res.status(201).json(nuevo);
});
router.delete('/:id', verificarToken, soloAdmin, (req, res) => {
  const idx = usuarios.findIndex(u => u.id == req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Usuario no encontrado' });
  usuarios.splice(idx, 1);
  res.json({ mensaje: 'Usuario eliminado' });
});

module.exports = router;

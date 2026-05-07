const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'smartturfai_jwt_2026';

function verificarToken(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'Token requerido' });
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
  try {
    req.usuario = jwt.verify(token, SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function soloAdmin(req, res, next) {
  if (!req.usuario || req.usuario.rol !== 'admin')
    return res.status(403).json({ error: 'Acceso denegado. Solo administradores.' });
  next();
}

function soloGreenkeeper(req, res, next) {
  const rolesPermitidos = ['greenkeeper', 'admin'];
  if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol))
    return res.status(403).json({ error: 'Acceso denegado.' });
  next();
}

module.exports = { verificarToken, soloAdmin, soloGreenkeeper };

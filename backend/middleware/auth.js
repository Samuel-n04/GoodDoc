// backend/middleware/auth.js — Vérification du token JWT
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ erreur: 'Token manquant' });

  const token = auth.split(' ')[1]; // Bearer <token>
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(403).json({ erreur: 'Token invalide ou expiré' });
  }
};

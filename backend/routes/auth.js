// backend/routes/auth.js — Authentification JWT
const router = require('express').Router();
const pool   = require('../db');
const bcrypt = require('bcrypt');
const jwt    = require('jsonwebtoken');

// POST /api/auth/token — Vérifie email+mdp et retourne un JWT
router.post('/token', async (req, res) => {
  try {
    const { email, mot_de_passe } = req.body;
    if (!email || !mot_de_passe) {
      return res.status(400).json({ erreur: 'Email et mot de passe requis' });
    }

    const r = await pool.query(
      `SELECT u.*, p.id AS patient_id, m.id AS medecin_id
       FROM utilisateur u
       LEFT JOIN patient p ON p.utilisateur_id = u.id
       LEFT JOIN medecin m ON m.utilisateur_id = u.id
       WHERE u.email = $1`,
      [email]
    );
    const user = r.rows[0];
    if (!user) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
    }

    const valide = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
    if (!valide) {
      return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
    }

    const payload = {
      user_id:    user.id,
      role:       user.role,
      patient_id: user.patient_id || null,
      medecin_id: user.medecin_id || null,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    });

    res.json({ token });
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

// POST /api/auth/mint — Génère un JWT pour un user_id déjà authentifié par PHP
// Appelé uniquement depuis le backend PHP (pas exposé au navigateur)
router.post('/mint', async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ erreur: 'user_id requis' });

    const r = await pool.query(
      `SELECT u.role, p.id AS patient_id, m.id AS medecin_id
       FROM utilisateur u
       LEFT JOIN patient p ON p.utilisateur_id = u.id
       LEFT JOIN medecin m ON m.utilisateur_id = u.id
       WHERE u.id = $1`,
      [user_id]
    );
    const user = r.rows[0];
    if (!user) return res.status(404).json({ erreur: 'Utilisateur introuvable' });

    const token = jwt.sign(
      { user_id, role: user.role, patient_id: user.patient_id || null, medecin_id: user.medecin_id || null },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
    res.json({ token });
  } catch (e) {
    res.status(500).json({ erreur: e.message });
  }
});

module.exports = router;

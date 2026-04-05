// backend/routes/patient.js
const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// GET — Infos complètes d'un patient
router.get('/:id', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT p.*, u.nom, u.prenom, u.email, u.telephone
       FROM patient p
       JOIN utilisateur u ON p.utilisateur_id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!r.rows[0]) return res.status(404).json({ erreur: 'Patient introuvable' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// PATCH — Mettre à jour les infos patient
router.patch('/:id', auth, async (req, res) => {
  try {
    const { date_naissance, adresse, numero_ss, groupe_sanguin } = req.body;
    const r = await pool.query(
      `UPDATE patient SET
         date_naissance = COALESCE($1, date_naissance),
         adresse        = COALESCE($2, adresse),
         numero_ss      = COALESCE($3, numero_ss),
         groupe_sanguin = COALESCE($4, groupe_sanguin)
       WHERE id = $5 RETURNING *`,
      [date_naissance, adresse, numero_ss, groupe_sanguin, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

module.exports = router;

// backend/routes/medecin.js
const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

// GET — Liste de tous les médecins
router.get('/', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT m.id, u.nom, u.prenom, u.email, u.telephone,
              m.specialite, m.cabinet, m.tarif_consultation
       FROM medecin m JOIN utilisateur u ON m.utilisateur_id = u.id
       ORDER BY u.nom`
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// GET — Créneaux disponibles d'un médecin (pour les patients)
// Retourne les créneaux récurrents + les créneaux ponctuels à venir
router.get('/:id/creneaux', async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM creneau
       WHERE medecin_id=$1 AND disponible=true AND date >= CURRENT_DATE
       ORDER BY date, heure_debut`,
      [req.params.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// GET — Tous les créneaux d'un médecin (pour le médecin lui-même)
router.get('/:id/creneaux/tous', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT * FROM creneau WHERE medecin_id=$1
       ORDER BY date, heure_debut`,
      [req.params.id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// POST — Ajouter un créneau (récurrent ou ponctuel)
router.post('/:id/creneaux', auth, async (req, res) => {
  try {
    const { heure_debut, heure_fin, date } = req.body;
    const r = await pool.query(
      'INSERT INTO creneau (medecin_id, heure_debut, heure_fin, date) VALUES ($1,$2,$3,$4) RETURNING *',
      [req.params.id, heure_debut, heure_fin, date || null]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// PATCH — Bloquer/débloquer un créneau
router.patch('/creneaux/:id', auth, async (req, res) => {
  try {
    const { disponible } = req.body;
    const r = await pool.query(
      'UPDATE creneau SET disponible=$1 WHERE id=$2 RETURNING *',
      [disponible, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

module.exports = router;
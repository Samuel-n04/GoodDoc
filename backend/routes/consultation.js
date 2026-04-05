// backend/routes/consultation.js
const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

// Génère un identifiant de salon unique
const genererSalon = (rdvId) => `goodoc-rdv-${rdvId}-${Date.now()}`;

// POST — Créer une consultation vidéo pour un RDV
router.post('/', auth, async (req, res) => {
  try {
    const { rendez_vous_id } = req.body;
    const salon    = genererSalon(rendez_vous_id);
    const url_video = `https://meet.jit.si/${salon}`;

    const r = await pool.query(
      `INSERT INTO consultation_video (rendez_vous_id, url_video)
       VALUES ($1,$2) RETURNING *`,
      [rendez_vous_id, url_video]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// GET — Récupérer la consultation d'un RDV
router.get('/rdv/:rdvId', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM consultation_video WHERE rendez_vous_id=$1',
      [req.params.rdvId]
    );
    res.json(r.rows[0] || null);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// PATCH — Démarrer / terminer une consultation
router.patch('/:id/statut', auth, async (req, res) => {
  try {
    const { statut } = req.body;
    const champ = statut === 'EN_COURS' ? ', started_at=NOW()' :
                  statut === 'TERMINEE'  ? ', ended_at=NOW()'   : '';
    const r = await pool.query(
      `UPDATE consultation_video SET statut=$1${champ} WHERE id=$2 RETURNING *`,
      [statut, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

module.exports = router;

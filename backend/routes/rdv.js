// backend/routes/rdv.js
const router  = require('express').Router();
const pool    = require('../db');
const auth    = require('../middleware/auth');

// Mise à jour automatique des statuts expirés
async function majStatutsExpires() {
  await pool.query(`
    UPDATE rendez_vous SET statut='TERMINE'
    WHERE date < CURRENT_DATE AND statut='CONFIRME'
  `);
  await pool.query(`
    UPDATE rendez_vous SET statut='ANNULE'
    WHERE date < CURRENT_DATE AND statut='EN_ATTENTE'
  `);
}

// GET — Tous les RDV d'un patient
router.get('/patient/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await majStatutsExpires();
    const r = await pool.query(
      `SELECT rv.*, u.nom AS medecin_nom, u.prenom AS medecin_prenom, m.specialite,
              c.heure_debut, c.heure_fin
       FROM rendez_vous rv
       JOIN medecin m ON rv.medecin_id = m.id
       JOIN utilisateur u ON m.utilisateur_id = u.id
       LEFT JOIN creneau c ON rv.creneau_id = c.id
       WHERE rv.patient_id = $1 AND rv.date >= CURRENT_DATE
         AND rv.statut NOT IN ('ANNULE', 'TERMINE')
       ORDER BY rv.date ASC, c.heure_debut ASC`,
      [id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// GET — Tous les RDV d'un médecin
router.get('/medecin/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await majStatutsExpires();
    const r = await pool.query(
      `SELECT rv.*, u.nom AS patient_nom, u.prenom AS patient_prenom,
              c.heure_debut, c.heure_fin
       FROM rendez_vous rv
       JOIN patient p ON rv.patient_id = p.id
       JOIN utilisateur u ON p.utilisateur_id = u.id
       LEFT JOIN creneau c ON rv.creneau_id = c.id
       WHERE rv.medecin_id = $1 AND rv.date >= CURRENT_DATE
         AND rv.statut NOT IN ('ANNULE', 'TERMINE')
       ORDER BY rv.date ASC, c.heure_debut ASC`,
      [id]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// POST — Créer un RDV
router.post('/', auth, async (req, res) => {
  try {
    const { patient_id, medecin_id, creneau_id, date, motif } = req.body;
    const r = await pool.query(
      `INSERT INTO rendez_vous (patient_id, medecin_id, creneau_id, date, motif)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [patient_id, medecin_id, creneau_id, date, motif]
    );
    // Marquer le créneau comme indisponible
    await pool.query('UPDATE creneau SET disponible=false WHERE id=$1', [creneau_id]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// PATCH — Changer le statut d'un RDV
router.patch('/:id/statut', auth, async (req, res) => {
  try {
    const { statut } = req.body;
    const r = await pool.query(
      'UPDATE rendez_vous SET statut=$1 WHERE id=$2 RETURNING *',
      [statut, req.params.id]
    );
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// DELETE — Annuler un RDV
router.delete('/:id', auth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE rendez_vous SET statut='ANNULE' WHERE id=$1",
      [req.params.id]
    );
    res.json({ message: 'RDV annulé' });
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

module.exports = router;

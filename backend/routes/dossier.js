// backend/routes/dossier.js
const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');
const PDFDocument = require('pdfkit');

// POST — Créer une ordonnance  ← doit être AVANT /:patientId
router.post('/ordonnance', auth, async (req, res) => {
  try {
    const { dossier_id, medecin_id, rdv_id, medicaments, instructions } = req.body;
    const r = await pool.query(
      `INSERT INTO ordonnance (dossier_id, medecin_id, rdv_id, medicaments, instructions)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [dossier_id, medecin_id, rdv_id, medicaments, instructions]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// GET — Générer PDF d'une ordonnance  ← doit être AVANT /:patientId
router.get('/ordonnance/:id/pdf', auth, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT o.*, u.nom AS medecin_nom, u.prenom AS medecin_prenom,
              up.nom AS patient_nom, up.prenom AS patient_prenom
       FROM ordonnance o
       JOIN medecin m ON o.medecin_id = m.id
       JOIN utilisateur u ON m.utilisateur_id = u.id
       JOIN dossier_medical d ON o.dossier_id = d.id
       JOIN patient p ON d.patient_id = p.id
       JOIN utilisateur up ON p.utilisateur_id = up.id
       WHERE o.id=$1`,
      [req.params.id]
    );
    const o = r.rows[0];
    if (!o) return res.status(404).json({ erreur: 'Ordonnance introuvable' });

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ordonnance_${o.id}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).text('GooDoc — Ordonnance Médicale', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Dr. ${o.medecin_prenom} ${o.medecin_nom}`);
    doc.text(`Patient : ${o.patient_prenom} ${o.patient_nom}`);
    doc.text(`Date : ${new Date(o.date_emission).toLocaleDateString('fr-FR')}`);
    doc.moveDown();
    doc.fontSize(14).text('Médicaments prescrits :');
    doc.fontSize(12);
    (o.medicaments || []).forEach(m => doc.text(`  • ${m}`));
    doc.moveDown();
    if (o.instructions) doc.text(`Instructions : ${o.instructions}`);
    doc.end();
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// GET — Dossier médical d'un patient  ← en dernier car route générique
router.get('/:patientId', auth, async (req, res) => {
  try {
    const { patientId } = req.params;
    const dossier = await pool.query(
      'SELECT * FROM dossier_medical WHERE patient_id=$1', [patientId]
    );
    const ordonnances = await pool.query(
      `SELECT o.*, u.nom AS medecin_nom, u.prenom AS medecin_prenom
       FROM ordonnance o
       JOIN medecin m ON o.medecin_id = m.id
       JOIN utilisateur u ON m.utilisateur_id = u.id
       WHERE o.dossier_id=$1 ORDER BY o.date_emission DESC`,
      [dossier.rows[0]?.id]
    );
    res.json({ dossier: dossier.rows[0], ordonnances: ordonnances.rows });
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

module.exports = router;

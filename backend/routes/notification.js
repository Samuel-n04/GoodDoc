// backend/routes/notification.js
const router     = require('express').Router();
const pool       = require('../db');
const auth       = require('../middleware/auth');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
});

// GET — Notifications d'un utilisateur
router.get('/:userId', auth, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT * FROM notification WHERE utilisateur_id=$1 ORDER BY date_envoi DESC',
      [req.params.userId]
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// POST — Créer + envoyer une notification
router.post('/', auth, async (req, res) => {
  try {
    const { utilisateur_id, message, type, email } = req.body;

    // Enregistrer en BDD
    await pool.query(
      'INSERT INTO notification (utilisateur_id, message, type) VALUES ($1,$2,$3)',
      [utilisateur_id, message, type]
    );

    // Envoyer l'email si fourni
    if (email) {
      await transporter.sendMail({
        from:    `"GooDoc" <${process.env.MAIL_USER}>`,
        to:      email,
        subject: `GooDoc — ${type}`,
        text:    message
      });
    }

    res.status(201).json({ message: 'Notification envoyée' });
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

// PATCH — Marquer comme lue
router.patch('/:id/lue', auth, async (req, res) => {
  try {
    await pool.query('UPDATE notification SET lue=true WHERE id=$1', [req.params.id]);
    res.json({ message: 'Notification marquée comme lue' });
  } catch (e) { res.status(500).json({ erreur: e.message }); }
});

module.exports = router;

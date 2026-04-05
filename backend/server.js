// backend/server.js — Point d'entrée GooDoc
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middlewares ──────────────────────────────────────
app.use(cors({ origin: ['http://localhost', 'http://127.0.0.1'] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes API ───────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/rdv',          require('./routes/rdv'));
app.use('/api/patients',     require('./routes/patient'));
app.use('/api/medecins',     require('./routes/medecin'));
app.use('/api/dossier',      require('./routes/dossier'));
app.use('/api/notifications',require('./routes/notification'));
app.use('/api/consultation', require('./routes/consultation'));

// ── Route de test ────────────────────────────────────
app.get('/api', (req, res) => {
  res.json({ message: '✅ GooDoc API opérationnelle', version: '1.0.0' });
});

// ── 404 ──────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ erreur: `Route introuvable : ${req.method} ${req.path}` });
});

// ── Erreur globale ───────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Erreur serveur :', err.message);
  res.status(500).json({ erreur: 'Erreur serveur interne' });
});

// ── Démarrage ────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 GooDoc API démarrée sur http://localhost:${PORT}`);
});

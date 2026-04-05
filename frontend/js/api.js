// frontend/js/api.js — Helper fetch vers le backend Node.js
const API = 'http://localhost:3000/api';

// Récupère le token JWT stocké (transmis par PHP via session ou cookie)
const getToken = () => localStorage.getItem('goodoc_token') || '';

const api = {
  // GET
  get: async (endpoint) => {
    const r = await fetch(`${API}${endpoint}`, {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return r.json();
  },

  // POST
  post: async (endpoint, data) => {
    const r = await fetch(`${API}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return r.json();
  },

  // PATCH
  patch: async (endpoint, data) => {
    const r = await fetch(`${API}${endpoint}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify(data)
    });
    return r.json();
  },

  // DELETE
  delete: async (endpoint) => {
    const r = await fetch(`${API}${endpoint}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    return r.json();
  }
};

// ── Session ──────────────────────────────────────────────────
// Lit la session stockée par login.php dans localStorage,
// redirige vers le login si absente, active le lien nav courant,
// remplit l'avatar et retourne l'objet session.
function initNav(pageCourante) {
  const token   = localStorage.getItem('goodoc_token');
  const raw     = localStorage.getItem('goodoc_session');

  if (!token || !raw) {
    window.location.href = '../login.php';
    return {};
  }

  const session = JSON.parse(raw);

  // Marquer le lien actif dans la navbar
  const lienActif = document.getElementById(`nav-${pageCourante}`);
  if (lienActif) lienActif.classList.add('active');

  // Remplir l'avatar avec les initiales
  const avatar = document.getElementById('user-avatar');
  if (avatar && session.prenom && session.nom) {
    avatar.textContent = (session.prenom[0] + session.nom[0]).toUpperCase();
  }

  return session;
}

// ── Toast ─────────────────────────────────────────────────────
// Affiche une notification temporaire en bas à droite.
// type : 'success' (défaut) | 'error'
function toast(message, type = 'success') {
  // Créer le conteneur si absent
  let conteneur = document.getElementById('toast-conteneur');
  if (!conteneur) {
    conteneur = document.createElement('div');
    conteneur.id = 'toast-conteneur';
    conteneur.style.cssText =
      'position:fixed;bottom:24px;right:24px;display:flex;flex-direction:column;gap:8px;z-index:9999';
    document.body.appendChild(conteneur);
  }

  const el = document.createElement('div');
  el.textContent = message;
  el.style.cssText = [
    'padding:12px 18px',
    'border-radius:8px',
    'font-size:14px',
    'font-weight:500',
    'color:#fff',
    'box-shadow:0 4px 12px rgba(0,0,0,.15)',
    'opacity:1',
    'transition:opacity .3s',
    type === 'error' ? 'background:#e53e3e' : 'background:#38a169',
  ].join(';');

  conteneur.appendChild(el);

  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}

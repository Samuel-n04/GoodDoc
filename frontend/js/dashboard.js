const session = JSON.parse(localStorage.getItem('goodoc_session') || '{}');

if (!session.user_id) window.location.href = '../login.php';

document.getElementById('user-name').textContent = `${session.prenom} ${session.nom}`;
document.getElementById('titre-page').textContent = `Bonjour, ${session.prenom} 👋`;

if (session.role === 'medecin') {
  document.getElementById('lien-medecins').style.display = 'none';
}

const badges = {
  EN_ATTENTE: 'badge-attente',
  CONFIRME: 'badge-confirme',
  ANNULE: 'badge-annule',
  TERMINE: 'badge-termine'
};

async function chargerRDV() {
  const tbody = document.getElementById('tbody-rdv');
  try {
    const endpoint = session.role === 'patient'
      ? `/rdv/patient/${session.patient_id}`
      : `/rdv/medecin/${session.medecin_id}`;

    const rdvs = await api.get(endpoint);

    if (!Array.isArray(rdvs) || !rdvs.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Aucun rendez-vous</td></tr>';
      return;
    }

    tbody.innerHTML = rdvs.slice(0, 5).map(r => `
      <tr>
        <td>${new Date(r.date).toLocaleDateString('fr-FR')}</td>
        <td>${session.role === 'patient'
          ? `Dr. ${r.medecin_prenom} ${r.medecin_nom} — ${r.specialite}`
          : `${r.patient_prenom} ${r.patient_nom}`}</td>
        <td>${r.motif || '—'}</td>
        <td><span class="badge ${badges[r.statut]}">${r.statut}</span></td>
        <td>
          ${r.statut === 'CONFIRME' ? `<button class="btn-primary btn-sm" onclick="rejoindre(${r.id})">Rejoindre</button>` : ''}
          ${r.statut === 'EN_ATTENTE' ? `<button class="btn-danger btn-sm" onclick="annuler(${r.id})">Annuler</button>` : ''}
        </td>
      </tr>
    `).join('');

    document.getElementById('nb-rdv').textContent = rdvs.filter(r => r.statut !== 'ANNULE' && r.statut !== 'TERMINE').length;
    document.getElementById('nb-confirme').textContent = rdvs.filter(r => r.statut === 'CONFIRME').length;
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Erreur de chargement</td></tr>';
  }
}

async function chargerStats() {
  try {
    const notifs = await api.get(`/notifications/${session.user_id}`);
    document.getElementById('nb-notifs').textContent = Array.isArray(notifs)
      ? notifs.filter(n => !n.lue).length : '—';

    if (session.role === 'patient') {
      const dossier = await api.get(`/dossier/${session.patient_id}`);
      document.getElementById('nb-ordonnances').textContent = dossier.ordonnances?.length ?? 0;
    } else {
      document.getElementById('nb-ordonnances').parentElement.style.display = 'none';
    }
  } catch (e) {
    document.getElementById('nb-notifs').textContent = '—';
  }
}

async function annuler(id) {
  if (!confirm('Confirmer l\'annulation ?')) return;
  await api.delete(`/rdv/${id}`);
  chargerRDV();
}

async function rejoindre(rdvId) {
  const consult = await api.get(`/consultation/rdv/${rdvId}`);
  if (consult?.url_video) {
    window.open(consult.url_video, '_blank');
  } else {
    alert('Lien de consultation non disponible.');
  }
}

function deconnexion() {
  window.location.href = '../logout.php';
}

chargerRDV();
chargerStats();
setInterval(() => { chargerRDV(); chargerStats(); }, 30000);

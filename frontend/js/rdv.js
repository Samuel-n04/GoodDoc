const session = JSON.parse(localStorage.getItem('goodoc_session') || '{}');
if (!session.user_id) window.location.href = '../login.php';

document.getElementById('user-name').textContent = `${session.prenom} ${session.nom}`;

const badges = {
  EN_ATTENTE: 'badge-attente', CONFIRME: 'badge-confirme',
  ANNULE: 'badge-annule', TERMINE: 'badge-termine'
};

async function chargerRDV() {
  const tbody = document.getElementById('tbody-rdv');
  try {
    const rdvs = await api.get(`/rdv/patient/${session.patient_id}`);
    if (!Array.isArray(rdvs) || !rdvs.length) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted)">Aucun rendez-vous</td></tr>';
      return;
    }
    tbody.innerHTML = rdvs.map(r => `
      <tr>
        <td>${new Date(r.date).toLocaleDateString('fr-FR')}</td>
        <td>${r.heure_debut ? r.heure_debut.slice(0,5) + ' — ' + r.heure_fin.slice(0,5) : '—'}</td>
        <td>Dr. ${r.medecin_prenom} ${r.medecin_nom}</td>
        <td>${r.specialite || '—'}</td>
        <td>${r.motif || '—'}</td>
        <td><span class="badge ${badges[r.statut]}">${r.statut}</span></td>
        <td style="display:flex;gap:6px">
          ${r.statut === 'CONFIRME' ? `<button class="btn-primary btn-sm" onclick="rejoindre(${r.id})">Rejoindre</button>` : ''}
          ${['EN_ATTENTE', 'CONFIRME'].includes(r.statut) ? `<button class="btn-danger btn-sm" onclick="annuler(${r.id})">Annuler</button>` : ''}
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--muted)">Erreur de chargement</td></tr>';
  }
}

async function ouvrirModal() {
  document.getElementById('modal').classList.add('open');
  const medecins = await api.get('/medecins');
  const sel = document.getElementById('select-medecin');
  sel.innerHTML = '<option value="">-- Choisir un médecin --</option>' +
    medecins.map(m => `<option value="${m.id}">Dr. ${m.prenom} ${m.nom} — ${m.specialite}</option>`).join('');
}

function fermerModal() {
  document.getElementById('modal').classList.remove('open');
}

let creneauxDisponibles = [];

async function chargerCreneaux(medecinId) {
  if (!medecinId) return;
  creneauxDisponibles = await api.get(`/medecins/${medecinId}/creneaux`);
  const sel = document.getElementById('select-creneau');
  sel.innerHTML = creneauxDisponibles.length
    ? creneauxDisponibles.map(c => `<option value="${c.id}">${new Date(c.date).toLocaleDateString('fr-FR')} — ${c.heure_debut.slice(0,5)} à ${c.heure_fin.slice(0,5)}</option>`).join('')
    : '<option value="">Aucun créneau disponible</option>';
}

async function confirmerRDV() {
  const medecinId = parseInt(document.getElementById('select-medecin').value);
  const creneauId = parseInt(document.getElementById('select-creneau').value);
  const creneau = creneauxDisponibles.find(c => c.id === creneauId);
  if (!medecinId || !creneauId || !creneau) return alert('Veuillez sélectionner un médecin et un créneau.');
  await api.post('/rdv', {
    patient_id: session.patient_id,
    medecin_id: medecinId,
    creneau_id: creneauId,
    date: creneau.date,
    motif: document.getElementById('input-motif').value
  });
  fermerModal();
  chargerRDV();
}

async function annuler(id) {
  if (!confirm('Confirmer l\'annulation ?')) return;
  try { await api.delete(`/rdv/${id}`); } catch (_) {}
  chargerRDV();
}

async function rejoindre(rdvId) {
  const c = await api.get(`/consultation/rdv/${rdvId}`);
  if (c?.url_video) window.open(c.url_video, '_blank');
  else alert('Lien non disponible.');
}

function deconnexion() {
  window.location.href = '../logout.php';
}

chargerRDV();
setInterval(chargerRDV, 30000);

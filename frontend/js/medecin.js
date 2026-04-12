const session = JSON.parse(localStorage.getItem('goodoc_session') || '{}');
if (!session.user_id || session.role !== 'medecin') window.location.href = '../login.php';

document.getElementById('user-name').textContent = `Dr. ${session.prenom} ${session.nom}`;
document.getElementById('titre').textContent = `Bonjour, Dr. ${session.nom} 👋`;

const badges = {
  EN_ATTENTE: 'badge-attente', CONFIRME: 'badge-confirme',
  ANNULE: 'badge-annule', TERMINE: 'badge-termine'
};

let medicaments = [];

function switchTab(nom) {
  const tabs = ['rdv', 'creneaux', 'ordonnances'];
  document.querySelectorAll('.tab').forEach((t, i) => t.classList.toggle('active', tabs[i] === nom));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.getElementById(`tab-${nom}`).classList.add('active');
  if (nom === 'creneaux') chargerCreneaux();
  if (nom === 'ordonnances') chargerOrdonnances();
}

async function chargerRDV() {
  const tbody = document.getElementById('tbody-rdv');
  try {
    const rdvs = await api.get(`/rdv/medecin/${session.medecin_id}`);
    if (!Array.isArray(rdvs)) throw new Error('Réponse invalide');
    const auj = new Date().toDateString();

    document.getElementById('nb-attente').textContent = rdvs.filter(r => r.statut === 'EN_ATTENTE').length;
    document.getElementById('nb-aujourdhui').textContent = rdvs.filter(r => new Date(r.date).toDateString() === auj).length;
    document.getElementById('nb-total').textContent = rdvs.length;

    if (!rdvs.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Aucun rendez-vous</td></tr>';
      return;
    }
    tbody.innerHTML = rdvs.map(r => `
      <tr>
        <td>${new Date(r.date).toLocaleDateString('fr-FR')}</td>
        <td>${r.heure_debut ? r.heure_debut.slice(0,5) + ' — ' + r.heure_fin.slice(0,5) : '—'}</td>
        <td>${r.patient_prenom} ${r.patient_nom}</td>
        <td>${r.motif || '—'}</td>
        <td><span class="badge ${badges[r.statut]}">${r.statut}</span></td>
        <td style="display:flex;gap:6px;flex-wrap:wrap">
          ${r.statut === 'EN_ATTENTE' ? `
            <button class="btn-primary btn-sm" onclick="valider(${r.id})">✓ Valider</button>
            <button class="btn-danger btn-sm"  onclick="refuser(${r.id})">✗ Refuser</button>
          ` : ''}
          ${r.statut === 'CONFIRME' ? `
            <button class="btn-primary btn-sm" onclick="demarrer(${r.id})">▶ Démarrer</button>
            <button class="btn-secondary btn-sm" onclick="ouvrirOrdonnance(${r.id}, ${r.patient_id})">📋 Ordonnance</button>
          ` : ''}
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Erreur de chargement</td></tr>';
  }
}

async function chargerCreneaux() {
  const tbody = document.getElementById('tbody-creneaux');
  try {
    const creneaux = await api.get(`/medecins/${session.medecin_id}/creneaux/tous`);
    if (!Array.isArray(creneaux)) throw new Error('Réponse invalide');
    document.getElementById('nb-creneaux').textContent = creneaux.filter(c => c.disponible).length;

    if (!creneaux.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Aucun créneau</td></tr>';
      return;
    }
    tbody.innerHTML = creneaux.map(c => `
      <tr>
        <td>${new Date(c.date).toLocaleDateString('fr-FR')}</td>
        <td>${c.heure_debut}</td>
        <td>${c.heure_fin}</td>
        <td><span class="badge ${c.disponible ? 'badge-confirme' : 'badge-annule'}">${c.disponible ? 'Disponible' : 'Bloqué'}</span></td>
        <td>
          <button class="btn-secondary btn-sm" onclick="toggleCreneau(${c.id}, ${c.disponible})">
            ${c.disponible ? 'Bloquer' : 'Libérer'}
          </button>
        </td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Erreur de chargement</td></tr>';
  }
}

async function valider(id) {
  await api.patch(`/rdv/${id}/statut`, { statut: 'CONFIRME' });
  await api.post('/consultation', { rendez_vous_id: id });
  chargerRDV();
}

async function refuser(id) {
  if (!confirm('Refuser ce rendez-vous ?')) return;
  await api.patch(`/rdv/${id}/statut`, { statut: 'ANNULE' });
  chargerRDV();
}

async function demarrer(rdvId) {
  const c = await api.get(`/consultation/rdv/${rdvId}`);
  if (c?.url_video) {
    await api.patch(`/consultation/${c.id}/statut`, { statut: 'EN_COURS' });
    window.open(c.url_video, '_blank');
  } else {
    alert('Aucune consultation vidéo associée.');
  }
}

async function ouvrirOrdonnance(rdvId, patientId) {
  document.getElementById('ordo-rdv-id').value = rdvId;
  const doss = await api.get(`/dossier/${patientId}`);
  if (!doss.dossier) {
    alert('Ce patient n\'a pas encore de dossier médical.');
    return;
  }
  document.getElementById('ordo-dossier-id').value = doss.dossier.id;
  medicaments = [];
  document.getElementById('medicament-list').innerHTML = '';
  document.getElementById('modal-ordo').classList.add('open');
}

function ajouterMedicament() {
  const val = document.getElementById('input-medicament').value.trim();
  if (!val) return;
  medicaments.push(val);
  document.getElementById('input-medicament').value = '';
  document.getElementById('medicament-list').innerHTML = medicaments.map((m, i) => `
    <span class="medicament-tag">${m}
      <button onclick="retirerMedicament(${i})">×</button>
    </span>
  `).join('');
}

function retirerMedicament(i) {
  medicaments.splice(i, 1);
  document.getElementById('medicament-list').innerHTML = medicaments.map((m, j) => `
    <span class="medicament-tag">${m}
      <button onclick="retirerMedicament(${j})">×</button>
    </span>
  `).join('');
}

async function confirmerOrdonnance() {
  if (!medicaments.length) return alert('Veuillez ajouter au moins un médicament.');
  await api.post('/dossier/ordonnance', {
    dossier_id: parseInt(document.getElementById('ordo-dossier-id').value),
    medecin_id: session.medecin_id,
    rdv_id: parseInt(document.getElementById('ordo-rdv-id').value),
    medicaments,
    instructions: document.getElementById('input-instructions').value
  });
  fermerModals();
  alert('Ordonnance enregistrée avec succès.');
}

function ouvrirModalCreneau() {
  document.getElementById('input-date-creneau').value = '';
  document.getElementById('input-debut').value = '';
  document.getElementById('input-fin').value = '';
  document.getElementById('modal-creneau').classList.add('open');
}

async function confirmerCreneau() {
  const debut = document.getElementById('input-debut').value;
  const fin   = document.getElementById('input-fin').value;
  const date  = document.getElementById('input-date-creneau').value;

  if (!date || !debut || !fin) return alert('Veuillez remplir tous les champs.');

  await api.post(`/medecins/${session.medecin_id}/creneaux`, { heure_debut: debut, heure_fin: fin, date });
  fermerModals();
  chargerCreneaux();
}

async function toggleCreneau(id, disponible) {
  await api.patch(`/medecins/creneaux/${id}`, { disponible: !disponible });
  chargerCreneaux();
}

async function chargerOrdonnances() {
  const tbody = document.getElementById('tbody-ordonnances');
  try {
    const ordonnances = await api.get(`/dossier/medecin/${session.medecin_id}/ordonnances`);
    if (!Array.isArray(ordonnances) || !ordonnances.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Aucune ordonnance</td></tr>';
      return;
    }
    tbody.innerHTML = ordonnances.map(o => `
      <tr>
        <td>${new Date(o.date_emission).toLocaleDateString('fr-FR')}</td>
        <td>${o.patient_prenom} ${o.patient_nom}</td>
        <td>${(o.medicaments || []).join(', ')}</td>
        <td>${o.instructions || '—'}</td>
        <td><button class="btn-danger btn-sm" onclick="supprimerOrdonnance(${o.id})">Supprimer</button></td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted)">Erreur de chargement</td></tr>';
  }
}

async function supprimerOrdonnance(id) {
  if (!confirm('Supprimer cette ordonnance ?')) return;
  try { await api.delete(`/dossier/ordonnance/${id}`); } catch (_) {}
  chargerOrdonnances();
}

function fermerModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('open'));
}

chargerRDV();
chargerCreneaux();
setInterval(chargerRDV, 30000);

const session = initNav('dossier');

async function chargerDossier() {
  const tbody = document.getElementById('tbody-ordonnances');
  if (!session || !session.patient_id) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Session invalide</td></tr>';
    return;
  }
  try {
    const [data, patient] = await Promise.all([
      api.get(`/dossier/${session.patient_id}`),
      api.get(`/patients/${session.patient_id}`)
    ]);

    if (data.dossier) {
      document.getElementById('antecedents').textContent = data.dossier.antecedents || 'Aucun antécédent renseigné';
      document.getElementById('allergies').textContent = data.dossier.allergies || 'Aucune allergie renseignée';
    }

    if (patient && !patient.erreur) {
      document.getElementById('groupe-sanguin').textContent = patient.groupe_sanguin || '—';
      document.getElementById('numero-ss').textContent = patient.numero_ss || '—';
      document.getElementById('date-naissance').textContent = patient.date_naissance
        ? new Date(patient.date_naissance).toLocaleDateString('fr-FR') : '—';
    }

    if (!data.ordonnances?.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Aucune ordonnance</td></tr>';
      return;
    }
    tbody.innerHTML = data.ordonnances.map(o => `
      <tr>
        <td>${new Date(o.date_emission).toLocaleDateString('fr-FR')}</td>
        <td>Dr. ${o.medecin_prenom} ${o.medecin_nom}</td>
        <td>${(o.medicaments || []).join(', ')}</td>
        <td>${o.instructions || '—'}</td>
        <td><button class="btn-secondary btn-sm" onclick="telechargerPDF(${o.id})">⬇ PDF</button></td>
        <td><button class="btn-danger btn-sm" onclick="supprimerOrdonnance(${o.id})">Supprimer</button></td>
      </tr>
    `).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted)">Erreur de chargement</td></tr>';
  }
}

async function supprimerOrdonnance(id) {
  if (!confirm('Supprimer cette ordonnance ?')) return;
  try { await api.delete(`/dossier/ordonnance/${id}`); } catch (_) {}
  chargerDossier();
}

async function telechargerPDF(id) {
  const r = await fetch(`${API}/dossier/ordonnance/${id}/pdf`, {
    headers: { 'Authorization': `Bearer ${getToken()}` }
  });
  if (!r.ok) return alert('Erreur lors de la génération du PDF.');
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ordonnance_${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

chargerDossier();
setInterval(chargerDossier, 30000);

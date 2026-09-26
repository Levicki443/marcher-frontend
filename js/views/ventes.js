/**
 * Vue Historique des Ventes et Réimpression des Tickets.
 */

const VUE_VENTES = {
  ventes: [],

  async rendre(conteneur) {
    conteneur.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700;">Historique des Ventes & Facturation</h2>
          <p style="color: var(--texte-secondaire); font-size: 0.875rem;">Consultez les transactions passées et réimprimez les tickets de caisse</p>
        <div style="display: flex; gap: 0.5rem;">
          <button id="btn-export-ventes" class="btn btn-annuler btn-sm">
            <i class="bi bi-file-earmark-spreadsheet"></i>
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <!-- Filtres de date -->
      <div class="carte" style="margin-bottom: 1.25rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.8125rem; font-weight: 600;">Du :</label>
          <input type="date" id="filtre-vente-debut" class="champ-input" style="width: 170px;" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.8125rem; font-weight: 600;">Au :</label>
          <input type="date" id="filtre-vente-fin" class="champ-input" style="width: 170px;" />
        </div>
        <button id="btn-filtrer-ventes" class="btn btn-primaire btn-sm">
          <i class="bi bi-funnel"></i>
          <span>Filtrer</span>
        </button>
      </div>

      <!-- Tableau des Ventes -->
      <div class="table-conteneur">
        <table class="table-gestion">
          <thead>
            <tr>
              <th>N° Ticket</th>
              <th>Date & Heure</th>
              <th>Caissier</th>
              <th>Client</th>
              <th style="text-align: center;">Articles</th>
              <th>Mode Paiement</th>
              <th style="text-align: right;">Total Net</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="tableau-ventes-corps">
            <tr><td colspan="8" style="text-align: center; color: var(--texte-secondaire); padding: 2rem;">Chargement des ventes...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    document.getElementById('btn-filtrer-ventes')?.addEventListener('click', () => this.chargerDonnees());
    document.getElementById('btn-export-ventes')?.addEventListener('click', () => this.exporterVentesCSV());
    await this.chargerDonnees();
  },

  exporterVentesCSV() {
    const donneesFormatees = this.ventes.map((v) => ({
      numeroTicket: v.numeroTicket,
      date: formaterDate(v.createdAt, true),
      caissier: `${v.caissier?.prenom || ''} ${v.caissier?.nom || ''}`,
      client: v.client ? `${v.client.prenom} ${v.client.nom}` : 'Comptant',
      modePaiement: v.modePaiement,
      totalArticles: v.totalArticles,
      sousTotal: v.sousTotal,
      remise: v.remise,
      totalNet: v.totalNet
    }));

    const colonnes = [
      { cle: 'numeroTicket', label: 'N° Ticket' },
      { cle: 'date', label: 'Date & Heure' },
      { cle: 'caissier', label: 'Caissier' },
      { cle: 'client', label: 'Client' },
      { cle: 'modePaiement', label: 'Mode Règlement' },
      { cle: 'totalArticles', label: 'Articles' },
      { cle: 'sousTotal', label: 'Sous-Total' },
      { cle: 'remise', label: 'Remise' },
      { cle: 'totalNet', label: 'Total Net (FCFA)' }
    ];

    EXPORT_UTIL.exporterCSV(donneesFormatees, colonnes, 'historique_ventes');
  },

  async chargerDonnees() {
    const debut = document.getElementById('filtre-vente-debut')?.value;
    const fin = document.getElementById('filtre-vente-fin')?.value;

    let url = '/ventes?limite=100';
    if (debut) url += `&dateDebut=${debut}`;
    if (fin) url += `&dateFin=${fin}`;

    try {
      const reponse = await API.get(url);
      this.ventes = reponse.donnees || [];

      const corps = document.getElementById('tableau-ventes-corps');
      if (!corps) return;

      if (this.ventes.length === 0) {
        corps.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--texte-secondaire); padding: 2rem;">Aucune vente trouvée pour cette période.</td></tr>`;
        return;
      }

      corps.innerHTML = this.ventes
        .map((v) => `
          <tr>
            <td><strong><code>${v.numeroTicket}</code></strong></td>
            <td style="font-size: 0.8125rem;">${formaterDate(v.createdAt, true)}</td>
            <td>${v.caissier?.prenom || ''} ${v.caissier?.nom || ''}</td>
            <td>${v.client ? `${v.client.prenom || ''} ${v.client.nom}` : '<span style="color: var(--texte-secondaire);">Comptant</span>'}</td>
            <td style="text-align: center;">${v.totalArticles}</td>
            <td><span class="badge badge-info">${v.modePaiement}</span></td>
            <td style="text-align: right; font-weight: 700; color: var(--couleur-principale);">${formaterMontant(v.totalNet)}</td>
            <td style="text-align: right; white-space: nowrap;">
              <button class="btn btn-annuler btn-sm" onclick="VUE_VENTES.afficherFactureA4('${v._id}')" title="Facture A4 Pro">
                <i class="bi bi-file-earmark-text"></i>
              </button>
              <button class="btn btn-primaire btn-sm" onclick="VUE_VENTES.afficherDetailsVente('${v._id}')" title="Voir le ticket">
                <i class="bi bi-eye"></i>
              </button>
            </td>
          </tr>
        `)
        .join('');
    } catch (err) {
      console.error('Erreur chargement ventes:', err);
    }
  },

  afficherDetailsVente(id) {
    const vente = this.ventes.find((v) => v._id === id);
    if (!vente) return;

    APP.ouvrirModale({
      titre: `Détails du Ticket #${vente.numeroTicket}`,
      contenu: `
        <div style="font-size: 0.875rem;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
            <span><strong>Date :</strong> ${formaterDate(vente.createdAt, true)}</span>
            <span><strong>Mode :</strong> ${vente.modePaiement}</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 1rem;">
            <span><strong>Caissier :</strong> ${vente.caissier?.prenom || ''} ${vente.caissier?.nom || ''}</span>
            <span><strong>Client :</strong> ${vente.client ? `${vente.client.prenom} ${vente.client.nom}` : 'Comptant'}</span>
          </div>
          
          <div class="table-conteneur" style="margin-bottom: 1rem;">
            <table class="table-gestion">
              <thead><tr><th>Article</th><th>Prix Unit.</th><th>Qté</th><th style="text-align: right;">Total</th></tr></thead>
              <tbody>
                ${vente.articles.map((a) => `
                  <tr>
                    <td>${a.nomProduit}</td>
                    <td>${formaterMontant(a.prixUnitaire)}</td>
                    <td>${a.quantite}</td>
                    <td style="text-align: right; font-weight: 600;">${formaterMontant(a.sousTotal)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div style="background-color: var(--fond-general); padding: 1rem; border-radius: var(--rayon-sm); display: flex; flex-direction: column; gap: 0.35rem;">
            <div style="display: flex; justify-content: space-between;"><span>Sous-total :</span><strong>${formaterMontant(vente.sousTotal)}</strong></div>
            ${vente.remise > 0 ? `<div style="display: flex; justify-content: space-between; color: var(--couleur-erreur);"><span>Remise accordée :</span><strong>-${formaterMontant(vente.remise)}</strong></div>` : ''}
            <div style="display: flex; justify-content: space-between; font-size: 1.1rem; border-top: var(--bordure-discrete); padding-top: 0.5rem; margin-top: 0.25rem;">
              <span>Total Net :</span><strong style="color: var(--couleur-principale);">${formaterMontant(vente.totalNet)}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;"><span>Montant Reçu :</span><span>${formaterMontant(vente.montantPaye)}</span></div>
            <div style="display: flex; justify-content: space-between;"><span>Monnaie Rendue :</span><span style="color: var(--couleur-succes); font-weight: 600;">${formaterMontant(vente.monnaieRendue)}</span></div>
          </div>
        </div>
      `,
      texteBoutonValider: 'Réimprimer Ticket',
      actionValidation: () => {
        TICKET_UTIL.imprimer(vente);
      }
    });
  },

  afficherFactureA4(id) {
    const vente = this.ventes.find((v) => v._id === id);
    if (vente) {
      INVOICE_UTIL.imprimerFactureA4(vente);
    }
  }
};

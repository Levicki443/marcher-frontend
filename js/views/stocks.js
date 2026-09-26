/**
 * Vue Gestion des Stocks et Mouvements d'Entrées/Sorties.
 */

const VUE_STOCKS = {
  mouvements: [],
  produits: [],
  fournisseurs: [],

  async rendre(conteneur) {
    conteneur.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700;">Mouvements & Suivi des Stocks</h2>
          <p style="color: var(--texte-secondaire); font-size: 0.875rem;">Réceptions fournisseurs, avaries, pertes et valorisation globale</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="btn-export-stocks" class="btn btn-annuler btn-sm">
            <i class="bi bi-file-earmark-spreadsheet"></i>
            <span>Export CSV</span>
          </button>
          <button id="btn-ouvrir-entree-stock" class="btn btn-valider btn-sm">
            <i class="bi bi-box-arrow-in-down"></i>
            <span>Entrée Stock</span>
          </button>
          <button id="btn-ouvrir-sortie-stock" class="btn btn-supprimer btn-sm">
            <i class="bi bi-box-arrow-up"></i>
            <span>Sortie / Perte</span>
          </button>
        </div>
      </div>

      <!-- Cartes de valorisation du stock -->
      <div class="grille-kpi" id="grille-valorisation-stock">
        <div class="carte carte-kpi">
          <span class="kpi-titre">Articles en stock</span>
          <div class="kpi-valeur" id="valeur-total-unites">—</div>
          <span style="font-size: 0.75rem; color: var(--texte-secondaire);" id="valeur-total-refs">— références</span>
        </div>
        <div class="carte carte-kpi">
          <span class="kpi-titre">Valorisation au Coût d'Achat</span>
          <div class="kpi-valeur" id="valeur-cout-achat">—</div>
          <span style="font-size: 0.75rem; color: var(--texte-secondaire);">Capital immobilisé</span>
        </div>
        <div class="carte carte-kpi succes">
          <span class="kpi-titre">Valeur Marchande Estimée</span>
          <div class="kpi-valeur" id="valeur-prix-vente" style="color: var(--couleur-succes);">—</div>
          <span style="font-size: 0.75rem; color: var(--couleur-succes);">Plus-value : <strong id="valeur-plusvalue">—</strong></span>
        </div>
      </div>

      <!-- Historique des mouvements -->
      <div class="carte">
        <h3 style="font-size: 1.1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <i class="bi bi-clock-history" style="color: var(--couleur-principale);"></i>
          <span>Journal d'Audit des Mouvements</span>
        </h3>
        <div class="table-conteneur">
          <table class="table-gestion">
            <thead>
              <tr>
                <th>Date & Heure</th>
                <th>Produit</th>
                <th>Type de Mouvement</th>
                <th style="text-align: center;">Qté</th>
                <th style="text-align: center;">Stock Avant / Après</th>
                <th>Opérateur</th>
                <th>Fournisseur / Motif</th>
              </tr>
            </thead>
            <tbody id="tableau-mouvements-corps">
              <tr><td colspan="7" style="text-align: center; color: var(--texte-secondaire); padding: 2rem;">Chargement de l'historique...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    this.attacherEvenements();
    await this.chargerDonnees();
  },

  attacherEvenements() {
    document.getElementById('btn-ouvrir-entree-stock')?.addEventListener('click', () => this.ouvrirModaleEntree());
    document.getElementById('btn-ouvrir-sortie-stock')?.addEventListener('click', () => this.ouvrirModaleSortie());
    document.getElementById('btn-export-stocks')?.addEventListener('click', () => this.exporterStocksCSV());
  },

  exporterStocksCSV() {
    const donneesFormatees = this.mouvements.map((m) => ({
      date: formaterDate(m.createdAt, true),
      produit: m.produit?.nom || 'Produit supprimé',
      type: m.typeMouvement,
      quantite: m.quantite,
      quantiteAvant: m.quantiteAvant,
      quantiteApres: m.quantiteApres,
      operateur: `${m.utilisateur?.prenom || ''} ${m.utilisateur?.nom || ''}`,
      tiersOuMotif: m.fournisseur?.nomEntreprise || m.motif || m.referenceDocument || '—'
    }));

    const colonnes = [
      { cle: 'date', label: 'Date & Heure' },
      { cle: 'produit', label: 'Produit' },
      { cle: 'type', label: 'Type Mouvement' },
      { cle: 'quantite', label: 'Quantité' },
      { cle: 'quantiteAvant', label: 'Stock Avant' },
      { cle: 'quantiteApres', label: 'Stock Après' },
      { cle: 'operateur', label: 'Opérateur' },
      { cle: 'tiersOuMotif', label: 'Fournisseur / Motif' }
    ];

    EXPORT_UTIL.exporterCSV(donneesFormatees, colonnes, 'audit_mouvements_stock');
  },

  async chargerDonnees() {
    try {
      const [resMouv, resProd, resFourn, resEtat] = await Promise.all([
        API.get('/stocks/mouvements?limite=50'),
        API.get('/produits?limite=200'),
        API.get('/fournisseurs'),
        API.get('/stocks/etat-general')
      ]);

      this.mouvements = resMouv.donnees || [];
      this.produits = resProd.donnees || [];
      this.fournisseurs = resFourn.donnees || [];

      // Valorisation
      if (resEtat.succes && resEtat.donnees) {
        const d = resEtat.donnees;
        document.getElementById('valeur-total-unites').textContent = d.totalUnitesEnStock.toLocaleString('fr-FR');
        document.getElementById('valeur-total-refs').textContent = `${d.totalReferences} références au catalogue`;
        document.getElementById('valeur-cout-achat').textContent = formaterMontant(d.valeurTotaleAchat);
        document.getElementById('valeur-prix-vente').textContent = formaterMontant(d.valeurTotaleVente);
        document.getElementById('valeur-plusvalue').textContent = formaterMontant(d.plusValuePotentielle);
      }

      // Rendu tableau mouvements
      const corps = document.getElementById('tableau-mouvements-corps');
      if (corps) {
        if (this.mouvements.length === 0) {
          corps.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--texte-secondaire); padding: 2rem;">Aucun mouvement de stock enregistré.</td></tr>`;
        } else {
          corps.innerHTML = this.mouvements
            .map((m) => {
              const estEntree = m.typeMouvement.includes('Réception') || m.typeMouvement.includes('Ajustement');
              return `
                <tr>
                  <td style="font-size: 0.8125rem;">${formaterDate(m.createdAt, true)}</td>
                  <td><strong>${m.produit?.nom || 'Produit supprimé'}</strong></td>
                  <td><span class="badge ${estEntree ? 'badge-normal' : 'badge-rupture'}">${m.typeMouvement}</span></td>
                  <td style="text-align: center; font-weight: 700; color: ${estEntree ? 'var(--couleur-succes)' : 'var(--couleur-erreur)'};">${estEntree ? '+' : '-'}${m.quantite}</td>
                  <td style="text-align: center; font-size: 0.8125rem;">${m.quantiteAvant} &rarr; <strong>${m.quantiteApres}</strong></td>
                  <td style="font-size: 0.8125rem;">${m.utilisateur?.prenom || ''} ${m.utilisateur?.nom || ''}</td>
                  <td style="font-size: 0.8125rem; color: var(--texte-secondaire);">${m.fournisseur?.nomEntreprise || m.motif || m.referenceDocument || '—'}</td>
                </tr>
              `;
            })
            .join('');
        }
      }
    } catch (err) {
      console.error('Erreur chargement stocks:', err);
    }
  },

  ouvrirModaleEntree() {
    const optionsProduits = this.produits
      .map((p) => `<option value="${p._id}">${p.nom} (Stock actuel : ${p.quantite})</option>`)
      .join('');

    const optionsFournisseurs = '<option value="">Sélectionner un fournisseur (optionnel)</option>' + this.fournisseurs
      .map((f) => `<option value="${f._id}">${f.nomEntreprise}</option>`)
      .join('');

    APP.ouvrirModale({
      titre: 'Réception de Marchandises (Entrée en Stock)',
      contenu: `
        <form id="form-entree-stock" onsubmit="return false;">
          <div class="champ-groupe">
            <label class="champ-label">Produit réceptionné *</label>
            <select id="entree-prod" class="champ-select" required>${optionsProduits}</select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe">
              <label class="champ-label">Quantité reçue *</label>
              <input type="number" id="entree-qte" class="champ-input" min="1" required />
            </div>
            <div class="champ-groupe">
              <label class="champ-label">Nouveau prix d'achat unitaire (optionnel)</label>
              <input type="number" id="entree-prix" class="champ-input" placeholder="FCFA" min="0" />
            </div>
          </div>
          <div class="champ-groupe">
            <label class="champ-label">Fournisseur</label>
            <select id="entree-fourn" class="champ-select">${optionsFournisseurs}</select>
          </div>
          <div class="champ-groupe">
            <label class="champ-label">Référence du Bon de Livraison / Facture</label>
            <input type="text" id="entree-ref" class="champ-input" placeholder="ex: BL-2026-098" />
          </div>
        </form>
      `,
      texteBoutonValider: 'Valider la réception',
      actionValidation: async () => {
        const produitId = document.getElementById('entree-prod').value;
        const quantite = Number(document.getElementById('entree-qte').value);
        const nouveauPrixAchat = document.getElementById('entree-prix').value;
        const fournisseurId = document.getElementById('entree-fourn').value || null;
        const referenceDocument = document.getElementById('entree-ref').value.trim();

        if (!produitId || isNaN(quantite) || quantite <= 0) {
          API.notifier('Veuillez sélectionner un produit et une quantité positive.', 'alerte');
          return;
        }

        const res = await API.post('/stocks/entree', {
          produitId,
          quantite,
          nouveauPrixAchat: nouveauPrixAchat ? Number(nouveauPrixAchat) : undefined,
          fournisseurId,
          referenceDocument
        });

        API.notifier(res.message || 'Stock mis à jour avec succès.', 'succes');
        APP.fermerModale();
        await this.chargerDonnees();
      }
    });
  },

  ouvrirModaleSortie() {
    const optionsProduits = this.produits
      .map((p) => `<option value="${p._id}">${p.nom} (Stock : ${p.quantite})</option>`)
      .join('');

    APP.ouvrirModale({
      titre: 'Déclarer une Sortie de Stock (Avarie, Perte, Péremption)',
      contenu: `
        <form id="form-sortie-stock" onsubmit="return false;">
          <div class="champ-groupe">
            <label class="champ-label">Produit concerné *</label>
            <select id="sortie-prod" class="champ-select" required>${optionsProduits}</select>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe">
              <label class="champ-label">Quantité sortie *</label>
              <input type="number" id="sortie-qte" class="champ-input" min="1" required />
            </div>
            <div class="champ-groupe">
              <label class="champ-label">Motif de la sortie *</label>
              <select id="sortie-motif-type" class="champ-select">
                <option value="Produit endommagé">Produit endommagé / Casse</option>
                <option value="Produit périmé">Produit périmé</option>
                <option value="Autre sortie">Autre motif / Perte</option>
              </select>
            </div>
          </div>
          <div class="champ-groupe">
            <label class="champ-label">Commentaire / Justification</label>
            <textarea id="sortie-commentaire" class="champ-textarea" rows="2" placeholder="Détails du motif..."></textarea>
          </div>
        </form>
      `,
      texteBoutonValider: 'Enregistrer la sortie',
      actionValidation: async () => {
        const produitId = document.getElementById('sortie-prod').value;
        const quantite = Number(document.getElementById('sortie-qte').value);
        const typeMouvement = document.getElementById('sortie-motif-type').value;
        const motif = document.getElementById('sortie-commentaire').value.trim();

        if (!produitId || isNaN(quantite) || quantite <= 0) {
          API.notifier('Veuillez indiquer une quantité valide.', 'alerte');
          return;
        }

        const res = await API.post('/stocks/sortie', { produitId, quantite, typeMouvement, motif });
        API.notifier(res.message || 'Sortie enregistrée.', 'succes');
        APP.fermerModale();
        await this.chargerDonnees();
      }
    });
  }
};

/**
 * Vue Gestion des Produits et Catégories avec export CSV et impression d'étiquettes.
 */

const VUE_PRODUITS = {
  produits: [],
  categories: [],
  fournisseurs: [],

  async rendre(conteneur) {
    conteneur.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700;">Gestion du Catalogue Produits</h2>
          <p style="color: var(--texte-secondaire); font-size: 0.875rem;">Articles, prix, seuils de stock et étiquetage</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="btn-export-produits" class="btn btn-annuler btn-sm">
            <i class="bi bi-file-earmark-spreadsheet"></i> <span>Export CSV</span>
          </button>
          <button id="btn-ouvrir-modale-categorie" class="btn btn-annuler btn-sm">
            <i class="bi bi-tags"></i> <span>Catégories</span>
          </button>
          <button id="btn-ouvrir-modale-produit" class="btn btn-primaire btn-sm">
            <i class="bi bi-plus-lg"></i> <span>Ajouter un produit</span>
          </button>
        </div>
      </div>

      <div class="carte" style="margin-bottom: 1.25rem; display: flex; gap: 1rem; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 220px;">
          <input type="text" id="filtre-recherche-produits" class="champ-input" placeholder="🔍 Rechercher par nom ou code-barres..." />
        </div>
        <div style="width: 200px;">
          <select id="filtre-categorie-produits" class="champ-select"><option value="">Toutes les catégories</option></select>
        </div>
        <div style="width: 180px;">
          <select id="filtre-statut-produits" class="champ-select">
            <option value="">Tous les statuts</option>
            <option value="RUPTURE">En rupture (0)</option>
            <option value="FAIBLE">Stock faible</option>
            <option value="EXPIRATION_PROCHE">Expiration proche</option>
            <option value="PERIME">Produit périmé</option>
          </select>
        </div>
      </div>

      <div class="table-conteneur">
        <table class="table-gestion">
          <thead>
            <tr>
              <th>Code-barres</th>
              <th>Nom du produit</th>
              <th>Catégorie</th>
              <th style="text-align: right;">Prix Achat</th>
              <th style="text-align: right;">Prix Vente</th>
              <th style="text-align: center;">Stock</th>
              <th>État</th>
              <th>Date Expiration</th>
              <th style="text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody id="tableau-produits-corps">
            <tr><td colspan="9" style="text-align: center; color: var(--texte-secondaire); padding: 2rem;">Chargement du catalogue...</td></tr>
          </tbody>
        </table>
      </div>
    `;

    this.attacherEvenements();
    await this.chargerDonnees();
  },

  attacherEvenements() {
    document.getElementById('filtre-recherche-produits')?.addEventListener('input', () => this.filtrerEtAfficher());
    document.getElementById('filtre-categorie-produits')?.addEventListener('change', () => this.filtrerEtAfficher());
    document.getElementById('filtre-statut-produits')?.addEventListener('change', () => this.filtrerEtAfficher());
    document.getElementById('btn-ouvrir-modale-produit')?.addEventListener('click', () => this.ouvrirModaleProduit());
    document.getElementById('btn-ouvrir-modale-categorie')?.addEventListener('click', () => this.ouvrirModaleCategories());
    document.getElementById('btn-export-produits')?.addEventListener('click', () => this.exporterCatalogueCSV());
  },

  async chargerDonnees() {
    try {
      const [resProd, resCat, resFourn] = await Promise.all([API.get('/produits?limite=300'), API.get('/categories'), API.get('/fournisseurs')]);
      this.produits = resProd.donnees || [];
      this.categories = resCat.donnees || [];
      this.fournisseurs = resFourn.donnees || [];

      const selectCat = document.getElementById('filtre-categorie-produits');
      if (selectCat) {
        selectCat.innerHTML = '<option value="">Toutes les catégories</option>' + this.categories.map((c) => `<option value="${c._id}">${c.nom}</option>`).join('');
      }
      this.filtrerEtAfficher();
    } catch (err) {
      console.error('Erreur chargement:', err);
    }
  },

  filtrerEtAfficher() {
    const terme = document.getElementById('filtre-recherche-produits')?.value.toLowerCase().trim() || '';
    const catId = document.getElementById('filtre-categorie-produits')?.value || '';
    const statut = document.getElementById('filtre-statut-produits')?.value || '';

    const filtres = this.produits.filter((p) => {
      const correspondTexte = !terme || p.nom.toLowerCase().includes(terme) || (p.codeBarres && p.codeBarres.includes(terme));
      const correspondCat = !catId || (p.categorie && (p.categorie._id === catId || p.categorie === catId));
      const correspondStatut = !statut || p.statutStock === statut;
      return correspondTexte && correspondCat && correspondStatut;
    });

    const corps = document.getElementById('tableau-produits-corps');
    if (!corps) return;

    if (filtres.length === 0) {
      corps.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--texte-secondaire); padding: 2rem;">Aucun produit ne correspond aux filtres.</td></tr>`;
      return;
    }

    corps.innerHTML = filtres.map((p) => {
      let badgeCl = 'badge-normal';
      let badgeTxt = 'Normal';
      if (p.statutStock === 'RUPTURE') { badgeCl = 'badge-rupture'; badgeTxt = 'Rupture'; }
      else if (p.statutStock === 'FAIBLE') { badgeCl = 'badge-faible'; badgeTxt = 'Faible'; }
      else if (p.statutStock === 'PERIME') { badgeCl = 'badge-perime'; badgeTxt = 'Périmé'; }
      else if (p.statutStock === 'EXPIRATION_PROCHE') { badgeCl = 'badge-faible'; badgeTxt = 'Bientôt expiré'; }

      return `
        <tr>
          <td><code>${p.codeBarres || '—'}</code></td>
          <td><strong>${p.nom}</strong></td>
          <td>${p.categorie?.nom || '—'}</td>
          <td style="text-align: right; color: var(--texte-secondaire);">${formaterMontant(p.prixAchat)}</td>
          <td style="text-align: right; font-weight: 600; color: var(--couleur-principale);">${formaterMontant(p.prixVente)}</td>
          <td style="text-align: center; font-weight: 700;">${p.quantite} <span style="font-size: 0.75rem; color: var(--texte-secondaire);">${p.uniteMesure || ''}</span></td>
          <td><span class="badge ${badgeCl}">${badgeTxt}</span></td>
          <td style="font-size: 0.8125rem;">${formaterDate(p.dateExpiration)}</td>
          <td style="text-align: right; white-space: nowrap;">
            <button class="btn btn-annuler btn-sm" onclick="VUE_PRODUITS.imprimerEtiquetteRayon('${p._id}')" title="Étiquette Rayon"><i class="bi bi-upc"></i></button>
            <button class="btn btn-modifier btn-sm" onclick="VUE_PRODUITS.ouvrirModaleProduit('${p._id}')" title="Modifier"><i class="bi bi-pencil-square"></i></button>
            <button class="btn btn-supprimer btn-sm" onclick="VUE_PRODUITS.supprimerProduit('${p._id}', '${p.nom}')" title="Supprimer"><i class="bi bi-trash"></i></button>
          </td>
        </tr>
      `;
    }).join('');
  },

  ouvrirModaleProduit(produitId = null) {
    const prod = produitId ? this.produits.find((p) => p._id === produitId) : null;
    const catOpts = this.categories.map((c) => `<option value="${c._id}" ${prod && prod.categorie?._id === c._id ? 'selected' : ''}>${c.nom}</option>`).join('');
    const fournOpts = '<option value="">Aucun fournisseur lié</option>' + this.fournisseurs.map((f) => `<option value="${f._id}" ${prod && prod.fournisseur?._id === f._id ? 'selected' : ''}>${f.nomEntreprise}</option>`).join('');
    const dateExp = prod?.dateExpiration ? new Date(prod.dateExpiration).toISOString().split('T')[0] : '';

    APP.ouvrirModale({
      titre: prod ? 'Modifier le Produit' : 'Nouveau Produit',
      contenu: `
        <form id="form-prod-modale" onsubmit="return false;">
          <div class="champ-groupe"><label class="champ-label">Nom du produit *</label><input type="text" id="prod-nom" class="champ-input" value="${prod?.nom || ''}" required /></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Code-barres</label><input type="text" id="prod-code" class="champ-input" value="${prod?.codeBarres || ''}" /></div>
            <div class="champ-groupe"><label class="champ-label">Catégorie *</label><select id="prod-cat" class="champ-select" required>${catOpts}</select></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Prix Achat (FCFA) *</label><input type="number" id="prod-prix-achat" class="champ-input" value="${prod?.prixAchat ?? ''}" required min="0" /></div>
            <div class="champ-groupe"><label class="champ-label">Prix Vente (FCFA) *</label><input type="number" id="prod-prix-vente" class="champ-input" value="${prod?.prixVente ?? ''}" required min="0" /></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Quantité *</label><input type="number" id="prod-quantite" class="champ-input" value="${prod?.quantite ?? 0}" required min="0" /></div>
            <div class="champ-groupe"><label class="champ-label">Seuil alerte *</label><input type="number" id="prod-seuil" class="champ-input" value="${prod?.seuilMinimum ?? 5}" required min="0" /></div>
            <div class="champ-groupe"><label class="champ-label">Unité</label><input type="text" id="prod-unite" class="champ-input" value="${prod?.uniteMesure || 'unité'}" /></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Fournisseur</label><select id="prod-fourn" class="champ-select">${fournOpts}</select></div>
            <div class="champ-groupe"><label class="champ-label">Péremption</label><input type="date" id="prod-date-exp" class="champ-input" value="${dateExp}" /></div>
          </div>
        </form>
      `,
      actionValidation: async () => {
        const nom = document.getElementById('prod-nom').value.trim();
        const codeBarres = document.getElementById('prod-code').value.trim();
        const categorie = document.getElementById('prod-cat').value;
        const prixAchat = Number(document.getElementById('prod-prix-achat').value);
        const prixVente = Number(document.getElementById('prod-prix-vente').value);
        const quantite = Number(document.getElementById('prod-quantite').value);
        const seuilMinimum = Number(document.getElementById('prod-seuil').value);
        const uniteMesure = document.getElementById('prod-unite').value.trim();
        const fournisseur = document.getElementById('prod-fourn').value || null;
        const dateExpiration = document.getElementById('prod-date-exp').value || null;

        if (!nom || !categorie) return API.notifier('Champs obligatoires manquants.', 'alerte');
        const payload = { nom, codeBarres, categorie, prixAchat, prixVente, quantite, seuilMinimum, uniteMesure, fournisseur, dateExpiration };

        if (prod) await API.put(`/produits/${prod._id}`, payload);
        else await API.post('/produits', payload);
        API.notifier('Produit enregistré.', 'succes');
        APP.fermerModale();
        await this.chargerDonnees();
      }
    });
  },

  imprimerEtiquetteRayon(id) {
    const prod = this.produits.find((p) => p._id === id);
    if (!prod) return;

    APP.ouvrirModale({
      titre: `Étiquette Rayon — ${prod.nom}`,
      contenu: `
        <div style="border: 2px solid #000; padding: 1.5rem; text-align: center; border-radius: var(--rayon-md); background: #fff;">
          <h3 style="font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem;">${prod.nom}</h3>
          <p style="font-size: 0.8125rem; color: var(--texte-secondaire); margin-bottom: 0.75rem;">Rayon : ${prod.categorie?.nom || 'Général'}</p>
          <div style="font-size: 2.25rem; font-weight: 800; color: var(--couleur-principale); margin-bottom: 0.5rem;">${formaterMontant(prod.prixVente)}</div>
          <div style="font-family: monospace; font-size: 1.1rem; letter-spacing: 4px; padding: 0.5rem; background: #f1f5f9; display: inline-block;">
            * ${prod.codeBarres || 'SANS-CODE'} *
          </div>
        </div>
      `,
      texteBoutonValider: 'Imprimer Étiquette',
      actionValidation: () => window.print()
    });
  },

  exporterCatalogueCSV() {
    const colonnes = [
      { cle: 'codeBarres', label: 'Code-Barres' },
      { cle: 'nom', label: 'Nom du Produit' },
      { cle: 'prixAchat', label: 'Prix Achat (FCFA)' },
      { cle: 'prixVente', label: 'Prix Vente (FCFA)' },
      { cle: 'quantite', label: 'Stock Disponible' },
      { cle: 'seuilMinimum', label: 'Seuil Minimum' },
      { cle: 'uniteMesure', label: 'Unité' },
      { cle: 'statutStock', label: 'Statut' }
    ];
    EXPORT_UTIL.exporterCSV(this.produits, colonnes, 'catalogue_produits');
  },

  ouvrirModaleCategories() {
    APP.ouvrirModale({
      titre: 'Gestion des Catégories',
      contenu: `
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1.25rem;">
          <input type="text" id="nouvelle-cat-nom" class="champ-input" placeholder="Nouvelle catégorie..." />
          <button id="btn-ajouter-categorie" class="btn btn-primaire" style="white-space: nowrap;">Ajouter</button>
        </div>
        <div class="table-conteneur">
          <table class="table-gestion">
            <thead><tr><th>Catégorie</th><th>Produits</th><th style="text-align: right;">Action</th></tr></thead>
            <tbody>
              ${this.categories.map((c) => `
                <tr>
                  <td><strong>${c.nom}</strong></td>
                  <td>${c.nombreProduits || 0}</td>
                  <td style="text-align: right;"><button class="btn btn-supprimer btn-sm" onclick="VUE_PRODUITS.supprimerCategorie('${c._id}')"><i class="bi bi-trash"></i></button></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `,
      afficherBoutonValider: false
    });

    document.getElementById('btn-ajouter-categorie')?.addEventListener('click', async () => {
      const nom = document.getElementById('nouvelle-cat-nom').value.trim();
      if (!nom) return;
      await API.post('/categories', { nom });
      API.notifier('Catégorie ajoutée.', 'succes');
      APP.fermerModale();
      await this.chargerDonnees();
    });
  },

  async supprimerCategorie(id) {
    if (confirm('Voulez-vous supprimer cette catégorie ?')) {
      await API.delete(`/categories/${id}`);
      API.notifier('Catégorie supprimée.', 'succes');
      APP.fermerModale();
      await this.chargerDonnees();
    }
  },

  async supprimerProduit(id, nom) {
    if (confirm(`Confirmez-vous le retrait du produit "${nom}" ?`)) {
      await API.delete(`/produits/${id}`);
      API.notifier('Produit retiré.', 'succes');
      await this.chargerDonnees();
    }
  }
};

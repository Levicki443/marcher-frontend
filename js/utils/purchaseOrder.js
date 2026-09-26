/**
 * Module de génération et impression des Bons de Commande Fournisseurs (Approvisionnement).
 */

const PURCHASE_ORDER_UTIL = {
  /**
   * Ouvre la modale de création d'un Bon de Commande d'Approvisionnement.
   * @param {Array<object>} fournisseurs Liste des fournisseurs
   * @param {Array<object>} produits Liste des produits
   */
  ouvrirModale(fournisseurs, produits) {
    const fournOpts = fournisseurs.map((f) => `<option value="${f._id}">${f.nomEntreprise} (${f.nomResponsable || 'Contact'})</option>`).join('');
    const prodOpts = produits.map((p) => `<option value="${p._id}" data-prix="${p.prixAchat}" data-nom="${p.nom}">${p.nom} (Prix achat: ${p.prixAchat} FCFA)</option>`).join('');

    APP.ouvrirModale({
      titre: 'Créer un Bon de Commande Fournisseur',
      contenu: `
        <form id="form-bc-fourn" onsubmit="return false;">
          <div class="champ-groupe">
            <label class="champ-label">Fournisseur Destinataire *</label>
            <select id="bc-fourn-select" class="champ-select" required>${fournOpts}</select>
          </div>
          <div style="display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 0.5rem; align-items: flex-end; margin-bottom: 0.75rem;">
            <div class="champ-groupe" style="margin-bottom: 0;">
              <label class="champ-label">Article à commander</label>
              <select id="bc-prod-select" class="champ-select">${prodOpts}</select>
            </div>
            <div class="champ-groupe" style="margin-bottom: 0;">
              <label class="champ-label">Quantité</label>
              <input type="number" id="bc-qte-input" class="champ-input" value="10" min="1" />
            </div>
            <button type="button" id="btn-ajouter-ligne-bc" class="btn btn-primaire btn-sm" style="height: 38px;">
              <i class="bi bi-plus"></i> Ajouter
            </button>
          </div>
          <div class="table-conteneur" style="max-height: 180px; overflow-y: auto; margin-bottom: 1rem;">
            <table class="table-gestion" id="table-bc-lignes">
              <thead><tr><th>Article</th><th>Qté</th><th>Prix Estimé</th><th>Total</th><th></th></tr></thead>
              <tbody id="corps-bc-lignes">
                <tr><td colspan="5" style="text-align: center; color: var(--texte-secondaire);">Aucun article ajouté</td></tr>
              </tbody>
            </table>
          </div>
          <div class="champ-groupe">
            <label class="champ-label">Conditions de livraison / Remarques</label>
            <input type="text" id="bc-remarques" class="champ-input" placeholder="ex: Livraison urgente sous 48h..." />
          </div>
        </form>
      `,
      texteBoutonValider: 'Générer & Imprimer Bon de Commande',
      actionValidation: () => {
        if (this.lignesCommande.length === 0) {
          API.notifier('Veuillez ajouter au moins un article.', 'alerte');
          return;
        }
        const fournId = document.getElementById('bc-fourn-select')?.value;
        const fourn = fournisseurs.find((f) => f._id === fournId) || { nomEntreprise: 'Fournisseur' };
        const remarques = document.getElementById('bc-remarques')?.value.trim();
        this.imprimerBonA4(fourn, this.lignesCommande, remarques);
      }
    });

    this.lignesCommande = [];
    document.getElementById('btn-ajouter-ligne-bc')?.addEventListener('click', () => {
      const selectProd = document.getElementById('bc-prod-select');
      const qte = Number(document.getElementById('bc-qte-input')?.value) || 1;
      const opt = selectProd.options[selectProd.selectedIndex];
      const prodId = opt.value;
      const nom = opt.dataset.nom;
      const prix = Number(opt.dataset.prix) || 0;

      this.lignesCommande.push({ prodId, nom, qte, prix, total: qte * prix });
      this.actualiserTableauLignes();
    });
  },

  actualiserTableauLignes() {
    const corps = document.getElementById('corps-bc-lignes');
    if (!corps) return;
    if (this.lignesCommande.length === 0) {
      corps.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--texte-secondaire);">Aucun article ajouté</td></tr>`;
      return;
    }
    corps.innerHTML = this.lignesCommande.map((l, idx) => `
      <tr>
        <td><strong>${l.nom}</strong></td>
        <td>${l.qte}</td>
        <td>${formaterMontant(l.prix)}</td>
        <td style="font-weight: 600;">${formaterMontant(l.total)}</td>
        <td style="text-align: right;"><button type="button" class="btn btn-supprimer btn-sm" onclick="PURCHASE_ORDER_UTIL.supprimerLigne(${idx})"><i class="bi bi-x"></i></button></td>
      </tr>
    `).join('');
  },

  supprimerLigne(idx) {
    this.lignesCommande.splice(idx, 1);
    this.actualiserTableauLignes();
  },

  imprimerBonA4(fournisseur, lignes, remarques) {
    const dateBC = formaterDate(new Date(), false);
    const numBC = `BC-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const totalGlobal = lignes.reduce((sum, l) => sum + l.total, 0);

    APP.ouvrirModale({
      titre: `Bon de Commande #${numBC}`,
      contenu: `
        <div style="background: #fff; padding: 2rem; border-radius: var(--rayon-md); border: 1px solid #e2e8f0; font-family: var(--police-texte); font-size: 13px;">
          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 1rem; margin-bottom: 1.5rem;">
            <div>
              <h2 style="font-size: 1.5rem; color: var(--couleur-principale); margin: 0;">SUPERMARCHÉ PRO</h2>
              <p style="margin: 2px 0; color: var(--texte-secondaire);">Direction des Approvisionnements & Stocks</p>
              <p style="margin: 2px 0; color: var(--texte-secondaire);">Tél : +221 33 800 00 00 · Email : achats@supermarche.sn</p>
            </div>
            <div style="text-align: right;">
              <h3 style="margin: 0;">BON DE COMMANDE</h3>
              <p style="font-size: 1.1rem; font-weight: 700; color: var(--couleur-principale); margin: 2px 0;">${numBC}</p>
              <p style="margin: 2px 0; color: var(--texte-secondaire);">Date : ${dateBC}</p>
            </div>
          </div>
          <div style="background: var(--fond-general); padding: 1rem; border-radius: var(--rayon-sm); margin-bottom: 1.5rem;">
            <strong>Fournisseur Destinataire :</strong>
            <p style="margin: 2px 0; font-weight: 700; font-size: 1rem;">${fournisseur.nomEntreprise}</p>
            <p style="margin: 2px 0;">Attn : ${fournisseur.nomResponsable || 'Service Commercial'}</p>
            <p style="margin: 2px 0;">Tél : ${fournisseur.telephone} · Email : ${fournisseur.email || '—'}</p>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
            <thead>
              <tr style="background: #0f172a; color: #fff; text-align: left;">
                <th style="padding: 8px 12px;">Désignation Produit</th>
                <th style="padding: 8px 12px; text-align: center;">Qté Commandée</th>
                <th style="padding: 8px 12px; text-align: right;">Prix Unit. HT</th>
                <th style="padding: 8px 12px; text-align: right;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${lignes.map((l) => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 8px 12px;"><strong>${l.nom}</strong></td>
                  <td style="padding: 8px 12px; text-align: center; font-weight: 700;">${l.qte}</td>
                  <td style="padding: 8px 12px; text-align: right;">${formaterMontant(l.prix)}</td>
                  <td style="padding: 8px 12px; text-align: right; font-weight: 600;">${formaterMontant(l.total)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="display: flex; justify-content: flex-end; margin-bottom: 1.5rem;">
            <div style="width: 250px; border-top: 2px solid #0f172a; padding-top: 6px; display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700;">
              <span>TOTAL ESTIMÉ :</span><span style="color: var(--couleur-principale);">${formaterMontant(totalGlobal)}</span>
            </div>
          </div>
          ${remarques ? `<p style="font-size: 12px; margin-bottom: 1.5rem;"><strong>Remarques :</strong> ${remarques}</p>` : ''}
          <div style="display: flex; justify-content: space-between; margin-top: 2rem; border-top: 1px dashed #cbd5e1; padding-top: 1rem; font-size: 11px;">
            <div><span>Signature & Cachet Supermarché</span><br /><br /><br />_________________________</div>
            <div style="text-align: right;"><span>Accusé de réception Fournisseur</span><br /><br /><br />_________________________</div>
          </div>
        </div>
      `,
      texteBoutonValider: 'Imprimer Bon de Commande',
      actionValidation: () => window.print()
    });
  }
};

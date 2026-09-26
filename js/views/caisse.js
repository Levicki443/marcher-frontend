/**
 * Vue Caisse & Point de Vente (POS) avec gestion des sessions, clôture Z et scanner webcam.
 */

const VUE_CAISSE = {
  panier: [],
  produitsCatalogue: [],
  clients: [],
  sessionActive: null,
  modePaiementChoisi: 'Espèces',

  async rendre(conteneur) {
    this.panier = [];
    conteneur.innerHTML = `
      <div class="pos-grille">
        <!-- Catalogue & Recherche -->
        <div class="pos-catalogue">
          <div class="carte" style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 200px;">
              <input type="text" id="pos-recherche" class="champ-input" placeholder="🔍 Code-barres ou nom [Entrée]..." autocomplete="off" />
            </div>
            <button id="btn-scan-camera" class="btn btn-primaire btn-sm" title="Scanner avec caméra"><i class="bi bi-camera"></i> <span>Caméra</span></button>
            <button id="btn-z-caisse" class="btn btn-modifier btn-sm" title="Clôture et réconciliation"><i class="bi bi-safe2"></i> <span>Session / Z</span></button>
            <button id="btn-vider-panier" class="btn btn-annuler btn-sm"><i class="bi bi-trash"></i></button>
          </div>
          <div class="carte" style="flex: 1; overflow-y: auto; max-height: calc(100vh - 210px);">
            <div id="pos-grille-produits" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 0.75rem;">
              <div style="text-align: center; color: var(--texte-secondaire); padding: 2rem;">Chargement du catalogue...</div>
            </div>
          </div>
        </div>
        <!-- Panier & Encaissement -->
        <div class="pos-panier">
          <div style="padding: 0.875rem 1.25rem; border-bottom: var(--bordure-discrete); display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-size: 1.05rem; display: flex; align-items: center; gap: 0.5rem;"><i class="bi bi-cart3" style="color: var(--couleur-principale);"></i> <span>Ticket Caisse</span></h3>
            <span class="badge badge-info" id="pos-badge-total-articles">0 article</span>
          </div>
          <div style="padding: 0.5rem 1.25rem; border-bottom: var(--bordure-discrete);">
            <select id="pos-client-select" class="champ-select"><option value="">Client occasionnel (Comptant)</option></select>
          </div>
          <div class="panier-articles" id="pos-articles-panier">
            <div style="text-align: center; color: var(--texte-secondaire); padding: 2.5rem 1rem;">
              <i class="bi bi-basket" style="font-size: 2.5rem; opacity: 0.3;"></i>
              <p style="margin-top: 0.5rem; font-size: 0.875rem; font-weight: 600;">Le ticket est vide</p>
              <p style="font-size: 0.75rem; color: var(--texte-secondaire); margin-top: 0.25rem;">
                👈 Cliquez sur un produit à gauche pour l'ajouter au panier.
              </p>
            </div>
          </div>
          <div class="panier-totaux">
            <div class="total-ligne"><span>Sous-total</span><strong id="pos-sous-total">0 FCFA</strong></div>
            <div class="total-ligne"><span>Remise (FCFA)</span><input type="number" id="pos-remise-input" class="champ-input" style="width: 90px; padding: 0.2rem 0.4rem; text-align: right;" value="0" min="0" /></div>
            <div class="total-ligne grand-total"><span>TOTAL NET</span><span id="pos-total-net" style="color: var(--couleur-principale);">0 FCFA</span></div>
            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 0.375rem; margin-top: 0.35rem;">
              <button type="button" class="btn btn-sm btn-primaire btn-mode-paiement" data-mode="Espèces">Espèces</button>
              <button type="button" class="btn btn-sm btn-annuler btn-mode-paiement" data-mode="Carte bancaire">Carte</button>
              <button type="button" class="btn btn-sm btn-annuler btn-mode-paiement" data-mode="Mobile Money">Mobile</button>
            </div>
            <div style="display: flex; gap: 0.5rem; margin-top: 0.35rem; align-items: center;">
              <div style="flex: 1;">
                <label style="font-size: 0.75rem; color: var(--texte-secondaire);">Montant Reçu [F4]</label>
                <input type="number" id="pos-montant-recu" class="champ-input" placeholder="Montant exact..." min="0" />
              </div>
              <div style="flex: 1; text-align: right;">
                <label style="font-size: 0.75rem; color: var(--texte-secondaire);">Monnaie</label>
                <div id="pos-monnaie-rendue" style="font-family: var(--police-titres); font-weight: 700; font-size: 1.05rem; color: var(--couleur-succes);">0 FCFA</div>
              </div>
            </div>
            <!-- Coupures et raccourcis espèces -->
            <div style="display: flex; gap: 0.25rem; margin-top: 0.25rem; flex-wrap: wrap;">
              <button type="button" class="btn btn-sm btn-annuler" style="font-size: 0.7rem; padding: 2px 6px;" onclick="VUE_CAISSE.reglerMontantExact()">Montant Exact</button>
              <button type="button" class="btn btn-sm btn-annuler" style="font-size: 0.7rem; padding: 2px 6px;" onclick="VUE_CAISSE.ajouterCoupure(1000)">+1 000</button>
              <button type="button" class="btn btn-sm btn-annuler" style="font-size: 0.7rem; padding: 2px 6px;" onclick="VUE_CAISSE.ajouterCoupure(2000)">+2 000</button>
              <button type="button" class="btn btn-sm btn-annuler" style="font-size: 0.7rem; padding: 2px 6px;" onclick="VUE_CAISSE.ajouterCoupure(5000)">+5 000</button>
              <button type="button" class="btn btn-sm btn-annuler" style="font-size: 0.7rem; padding: 2px 6px;" onclick="VUE_CAISSE.ajouterCoupure(10000)">+10 000</button>
            </div>
            <button id="btn-valider-vente" class="btn btn-valider" style="width: 100%; padding: 0.65rem; margin-top: 0.5rem;" disabled><i class="bi bi-check2-circle"></i> <span>Valider & Imprimer</span></button>
          </div>
        </div>
      </div>
    `;

    this.modePaiementChoisi = 'Espèces';
    this.attacherEvenements();
    await this.chargerDonnees();
  },

  attacherEvenements() {
    const inputRecherche = document.getElementById('pos-recherche');
    inputRecherche?.addEventListener('input', (e) => this.filtrerCatalogue(e.target.value));
    inputRecherche?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const t = e.target.value.toLowerCase().trim();
        const p = this.produitsCatalogue.find((x) => (x.codeBarres && x.codeBarres.toLowerCase() === t) || x.nom.toLowerCase().includes(t));
        if (p) { this.ajouterAuPanier(p); e.target.value = ''; this.filtrerCatalogue(''); }
      }
    });

    document.getElementById('btn-scan-camera')?.addEventListener('click', () => {
      SCANNER_UTIL.ouvrirScannerCamera((code) => {
        const input = document.getElementById('pos-recherche');
        if (input) { input.value = code; this.filtrerCatalogue(code); }
        const p = this.produitsCatalogue.find((x) => x.codeBarres === code);
        if (p) this.ajouterAuPanier(p);
      });
    });

    document.getElementById('btn-vider-panier')?.addEventListener('click', () => {
      this.panier = [];
      this.mettreAJourAffichagePanier();
    });

    document.getElementById('btn-z-caisse')?.addEventListener('click', () => this.gererSessionCaisse());
    document.getElementById('pos-remise-input')?.addEventListener('input', () => this.calculerTotaux());
    document.getElementById('pos-montant-recu')?.addEventListener('input', () => this.calculerTotaux());

    document.querySelectorAll('.btn-mode-paiement').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.btn-mode-paiement').forEach((b) => (b.className = 'btn btn-sm btn-annuler btn-mode-paiement'));
        e.currentTarget.className = 'btn btn-sm btn-primaire btn-mode-paiement';
        this.modePaiementChoisi = e.currentTarget.dataset.mode;
        this.calculerTotaux();
      });
    });

    document.getElementById('btn-valider-vente')?.addEventListener('click', () => this.finaliserVente());
  },

  async chargerDonnees() {
    try {
      const [resProd, resClients] = await Promise.all([API.get('/produits?limite=200'), API.get('/clients')]);
      this.produitsCatalogue = resProd.donnees || [];
      this.clients = resClients.donnees || [];

      const selectClient = document.getElementById('pos-client-select');
      if (selectClient) {
        selectClient.innerHTML = '<option value="">Client occasionnel (Comptant)</option>' +
          this.clients.map((c) => `<option value="${c._id}">${c.prenom} ${c.nom}</option>`).join('');
      }
      this.filtrerCatalogue('');
    } catch (err) {
      console.error('Erreur POS:', err);
    }
  },

  filtrerCatalogue(terme) {
    const grille = document.getElementById('pos-grille-produits');
    if (!grille) return;
    const t = terme.toLowerCase().trim();
    const filtre = this.produitsCatalogue.filter((p) => p.nom.toLowerCase().includes(t) || (p.codeBarres && p.codeBarres.includes(t)));

    if (filtre.length === 0) {
      grille.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: var(--texte-secondaire); padding: 2rem;">Aucun produit trouvé.</div>`;
      return;
    }

    grille.innerHTML = filtre.map((p) => {
      const estRupture = p.quantite <= 0;
      return `
        <div class="carte" style="cursor: ${estRupture ? 'not-allowed' : 'pointer'}; opacity: ${estRupture ? 0.5 : 1}; padding: 0.65rem; display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--bordure-discrete);" onclick="${estRupture ? '' : `VUE_CAISSE.ajouterAuPanierParId('${p._id}')`}">
          <div>
            <div style="font-size: 0.75rem; color: var(--texte-secondaire);">${p.categorie?.nom || 'Rayon'}</div>
            <strong style="font-size: 0.8125rem; display: block; margin: 0.2rem 0;">${p.nom}</strong>
          </div>
          <div style="margin-top: 0.35rem; display: flex; justify-content: space-between; align-items: baseline;">
            <span style="font-weight: 700; color: var(--couleur-principale); font-size: 0.875rem;">${formaterMontant(p.prixVente)}</span>
            <span class="badge ${estRupture ? 'badge-rupture' : p.quantite <= p.seuilMinimum ? 'badge-faible' : 'badge-normal'}">${p.quantite}</span>
          </div>
        </div>
      `;
    }).join('');
  },

  ajouterAuPanierParId(id) {
    const prod = this.produitsCatalogue.find((p) => p._id === id);
    if (prod) this.ajouterAuPanier(prod);
  },

  ajouterAuPanier(produit) {
    const existant = this.panier.find((item) => item.produitId === produit._id);
    if (existant) {
      if (existant.quantite + 1 > produit.quantite) return API.notifier(`Stock insuffisant (${produit.quantite} dispo)`, 'alerte');
      existant.quantite += 1;
      existant.sousTotal = existant.quantite * existant.prixUnitaire;
    } else {
      if (produit.quantite < 1) return API.notifier(`Produit en rupture`, 'alerte');
      this.panier.push({ produitId: produit._id, nom: produit.nom, prixUnitaire: produit.prixVente, quantite: 1, sousTotal: produit.prixVente, stockMax: produit.quantite });
    }
    this.mettreAJourAffichagePanier();
  },

  modifierQuantiteArticle(index, delta) {
    const item = this.panier[index];
    if (!item) return;
    const nouvelleQte = item.quantite + delta;
    if (nouvelleQte <= 0) this.panier.splice(index, 1);
    else if (nouvelleQte > item.stockMax) return API.notifier(`Stock max atteint (${item.stockMax})`, 'alerte');
    else { item.quantite = nouvelleQte; item.sousTotal = item.quantite * item.prixUnitaire; }
    this.mettreAJourAffichagePanier();
  },

  mettreAJourAffichagePanier() {
    const conteneur = document.getElementById('pos-articles-panier');
    const badgeArticles = document.getElementById('pos-badge-total-articles');
    if (!conteneur) return;

    const totalArticles = this.panier.reduce((sum, i) => sum + i.quantite, 0);
    if (badgeArticles) badgeArticles.textContent = `${totalArticles} article(s)`;

    if (this.panier.length === 0) {
      conteneur.innerHTML = `<div style="text-align: center; color: var(--texte-secondaire); padding: 3rem 1rem;"><i class="bi bi-basket" style="font-size: 2.5rem; opacity: 0.3;"></i><p style="margin-top: 0.5rem; font-size: 0.875rem;">Le panier est vide</p></div>`;
    } else {
      conteneur.innerHTML = this.panier.map((item, idx) => `
        <div class="panier-article-item">
          <div style="flex: 1;">
            <strong style="font-size: 0.8125rem; display: block;">${item.nom}</strong>
            <span style="font-size: 0.75rem; color: var(--texte-secondaire);">${formaterMontant(item.prixUnitaire)} x ${item.quantite}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 0.4rem;">
            <button class="btn btn-annuler btn-sm" style="padding: 0.1rem 0.4rem;" onclick="VUE_CAISSE.modifierQuantiteArticle(${idx}, -1)">-</button>
            <strong style="font-size: 0.8125rem; min-width: 1.2rem; text-align: center;">${item.quantite}</strong>
            <button class="btn btn-annuler btn-sm" style="padding: 0.1rem 0.4rem;" onclick="VUE_CAISSE.modifierQuantiteArticle(${idx}, 1)">+</button>
            <span style="font-weight: 700; font-size: 0.8125rem; min-width: 65px; text-align: right;">${formaterMontant(item.sousTotal)}</span>
          </div>
        </div>
      `).join('');
    }
    this.calculerTotaux();
  },

  calculerTotaux() {
    const sousTotal = this.panier.reduce((sum, i) => sum + i.sousTotal, 0);
    const remise = Number(document.getElementById('pos-remise-input')?.value) || 0;
    const totalNet = Math.max(0, sousTotal - remise);
    const montantRecuInput = document.getElementById('pos-montant-recu');
    const btnValider = document.getElementById('btn-valider-vente');

    document.getElementById('pos-sous-total').textContent = formaterMontant(sousTotal);
    document.getElementById('pos-total-net').textContent = formaterMontant(totalNet);

    if (this.modePaiementChoisi !== 'Espèces' && montantRecuInput) {
      montantRecuInput.value = totalNet > 0 ? totalNet : '';
    }

    const valeurSaisie = montantRecuInput?.value.trim() || '';
    const montantRecu = valeurSaisie !== '' && !isNaN(valeurSaisie) ? Number(valeurSaisie) : (totalNet > 0 ? totalNet : 0);
    const monnaie = Math.max(0, (valeurSaisie !== '' ? Number(valeurSaisie) : totalNet) - totalNet);

    document.getElementById('pos-monnaie-rendue').textContent = formaterMontant(valeurSaisie !== '' ? monnaie : 0);

    if (btnValider) {
      // Actif dès qu'il y a des articles et que le montant versé n'est pas inférieur au total
      const estMontantSuffisant = valeurSaisie === '' || Number(valeurSaisie) >= totalNet;
      btnValider.disabled = !(this.panier.length > 0 && totalNet >= 0 && estMontantSuffisant);
    }
  },

  reglerMontantExact() {
    const sousTotal = this.panier.reduce((sum, i) => sum + i.sousTotal, 0);
    const remise = Number(document.getElementById('pos-remise-input')?.value) || 0;
    const totalNet = Math.max(0, sousTotal - remise);
    const input = document.getElementById('pos-montant-recu');
    if (input) {
      input.value = totalNet > 0 ? totalNet : '';
      this.calculerTotaux();
    }
  },

  ajouterCoupure(montant) {
    const input = document.getElementById('pos-montant-recu');
    if (input) {
      const actuel = Number(input.value) || 0;
      input.value = actuel + montant;
      this.calculerTotaux();
    }
  },

  async finaliserVente() {
    if (this.panier.length === 0) {
      return API.notifier('Veuillez ajouter au moins un produit au ticket.', 'alerte');
    }

    const sousTotal = this.panier.reduce((sum, i) => sum + i.sousTotal, 0);
    const remise = Number(document.getElementById('pos-remise-input')?.value) || 0;
    const totalNet = Math.max(0, sousTotal - remise);
    const montantRecuInput = document.getElementById('pos-montant-recu');
    const valeurSaisie = montantRecuInput?.value.trim() || '';
    const montantPaye = (valeurSaisie !== '' && !isNaN(valeurSaisie)) ? Number(valeurSaisie) : totalNet;

    if (montantPaye < totalNet) {
      return API.notifier(`Montant versé insuffisant (${formaterMontant(montantPaye)} reçu pour ${formaterMontant(totalNet)} dû).`, 'alerte');
    }

    const clientId = document.getElementById('pos-client-select')?.value || null;

    try {
      const payload = {
        articles: this.panier.map((i) => ({ produitId: i.produitId, quantite: i.quantite })),
        modePaiement: this.modePaiementChoisi,
        montantPaye,
        remise,
        clientId
      };
      const reponse = await API.post('/ventes', payload);
      if (reponse.succes) {
        API.notifier(`Vente #${reponse.donnees.numeroTicket} validée avec succès !`, 'succes');
        TICKET_UTIL.imprimer(reponse.donnees);
        this.panier = [];
        if (montantRecuInput) montantRecuInput.value = '';
        const remiseInput = document.getElementById('pos-remise-input');
        if (remiseInput) remiseInput.value = '0';
        this.mettreAJourAffichagePanier();
        await this.chargerDonnees();
      }
    } catch (err) {
      console.error('Erreur vente:', err);
    }
  },

  async gererSessionCaisse() {
    const res = await API.get('/caisse-sessions/active');
    const active = res.aSessionActive ? res.donnees : null;

    if (!active) {
      APP.ouvrirModale({
        titre: 'Ouverture Session Caisse',
        contenu: `
          <form id="form-ouvrir-session" onsubmit="return false;">
            <div class="champ-groupe">
              <label class="champ-label">Fond de caisse initial (Espèces) *</label>
              <input type="number" id="session-fond-initial" class="champ-input" value="50000" min="0" required />
            </div>
          </form>
        `,
        texteBoutonValider: 'Ouvrir session',
        actionValidation: async () => {
          const fondDeCaisseInitial = document.getElementById('session-fond-initial').value;
          await API.post('/caisse-sessions/ouvrir', { fondDeCaisseInitial });
          API.notifier('Session ouverte.', 'succes');
          APP.fermerModale();
        }
      });
    } else {
      const b = active.bilanDirect;
      APP.ouvrirModale({
        titre: 'Clôture Journalière (Z de Caisse)',
        contenu: `
          <div style="font-size: 0.875rem; margin-bottom: 1rem; background-color: var(--fond-general); padding: 1rem; border-radius: var(--rayon-md);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;"><span>Fond initial :</span><strong>${formaterMontant(active.session.fondDeCaisseInitial)}</strong></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.3rem;"><span>Espèces encaissées :</span><strong>${formaterMontant(b.totalEspeces)}</strong></div>
            <div style="display: flex; justify-content: space-between; border-top: var(--bordure-discrete); padding-top: 0.4rem; margin-top: 0.3rem;">
              <span>Espèces attendues :</span><strong style="color: var(--couleur-principale);">${formaterMontant(b.especesTheoriquesEnCaisse)}</strong>
            </div>
          </div>
          <div class="champ-groupe">
            <label class="champ-label">Espèces physiques comptées *</label>
            <input type="number" id="cloture-especes-comptees" class="champ-input" placeholder="Montant compté..." required />
          </div>
        `,
        texteBoutonValider: 'Valider Clôture Z',
        actionValidation: async () => {
          const especesComptees = document.getElementById('cloture-especes-comptees').value;
          if (!especesComptees) return;
          await API.post('/caisse-sessions/cloturer', { especesComptees });
          API.notifier('Session clôturée avec succès.', 'succes');
          APP.fermerModale();
        }
      });
    }
  }
};

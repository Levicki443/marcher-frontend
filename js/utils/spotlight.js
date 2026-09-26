/**
 * Recherche globale instantanée (Spotlight / Raccourci Ctrl+K).
 */

const SPOTLIGHT_UTIL = {
  donneesIndexees: { produits: [], clients: [], ventes: [] },

  initialiser() {
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        this.ouvrir();
      }
    });
  },

  async indexer() {
    try {
      const [resProd, resCli, resVte] = await Promise.all([
        API.get('/produits?limite=150'),
        API.get('/clients'),
        API.get('/ventes?limite=50')
      ]);
      this.donneesIndexees.produits = resProd.donnees || [];
      this.donneesIndexees.clients = resCli.donnees || [];
      this.donneesIndexees.ventes = resVte.donnees || [];
    } catch {
      // Indexation silencieuse
    }
  },

  ouvrir() {
    this.indexer();
    APP.ouvrirModale({
      titre: 'Recherche Rapide Globale [Ctrl + K]',
      contenu: `
        <div>
          <input type="text" id="spotlight-input" class="champ-input" placeholder="Chercher un produit, client, ticket..." autocomplete="off" autofocus />
          <div id="spotlight-resultats" style="margin-top: 1rem; max-height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 0.5rem;">
            <p style="font-size: 0.8125rem; color: var(--texte-secondaire); text-align: center; padding: 1.5rem;">
              Tapez au moins 2 caractères pour rechercher dans toute l'application.
            </p>
          </div>
        </div>
      `,
      afficherBoutonValider: false
    });

    const input = document.getElementById('spotlight-input');
    input?.focus();
    input?.addEventListener('input', (e) => this.rechercher(e.target.value));
  },

  rechercher(terme) {
    const conteneur = document.getElementById('spotlight-resultats');
    if (!conteneur) return;

    const t = terme.toLowerCase().trim();
    if (t.length < 2) {
      conteneur.innerHTML = `<p style="font-size: 0.8125rem; color: var(--texte-secondaire); text-align: center; padding: 1.5rem;">Tapez au moins 2 caractères...</p>`;
      return;
    }

    const prods = this.donneesIndexees.produits.filter((p) => p.nom.toLowerCase().includes(t) || (p.codeBarres && p.codeBarres.includes(t))).slice(0, 4);
    const clients = this.donneesIndexees.clients.filter((c) => c.nom.toLowerCase().includes(t) || (c.telephone && c.telephone.includes(t))).slice(0, 3);
    const tickets = this.donneesIndexees.ventes.filter((v) => v.numeroTicket.toLowerCase().includes(t)).slice(0, 3);

    let html = '';

    if (prods.length > 0) {
      html += `<strong style="font-size: 0.75rem; color: var(--texte-secondaire); text-transform: uppercase;">Produits</strong>`;
      prods.forEach((p) => {
        html += `
          <div class="carte" style="padding: 0.5rem 0.75rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="APP.fermerModale(); APP.naviguerVers('produits');">
            <div><strong>${p.nom}</strong> <code style="font-size: 0.75rem;">${p.codeBarres || ''}</code></div>
            <strong style="color: var(--couleur-principale);">${formaterMontant(p.prixVente)}</strong>
          </div>
        `;
      });
    }

    if (clients.length > 0) {
      html += `<strong style="font-size: 0.75rem; color: var(--texte-secondaire); text-transform: uppercase; margin-top: 0.5rem;">Clients</strong>`;
      clients.forEach((c) => {
        html += `
          <div class="carte" style="padding: 0.5rem 0.75rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="APP.fermerModale(); APP.naviguerVers('clients');">
            <div><strong>${c.prenom} ${c.nom}</strong> <span style="font-size: 0.75rem; color: var(--texte-secondaire);">${c.telephone || ''}</span></div>
            <span class="badge badge-normal">${formaterMontant(c.totalAchats)}</span>
          </div>
        `;
      });
    }

    if (tickets.length > 0) {
      html += `<strong style="font-size: 0.75rem; color: var(--texte-secondaire); text-transform: uppercase; margin-top: 0.5rem;">Tickets Vente</strong>`;
      tickets.forEach((v) => {
        html += `
          <div class="carte" style="padding: 0.5rem 0.75rem; display: flex; justify-content: space-between; align-items: center; cursor: pointer;" onclick="APP.fermerModale(); VUE_VENTES.afficherDetailsVente('${v._id}');">
            <div><code>${v.numeroTicket}</code> <span style="font-size: 0.75rem; color: var(--texte-secondaire);">${formaterDate(v.createdAt)}</span></div>
            <strong style="color: var(--couleur-succes);">${formaterMontant(v.totalNet)}</strong>
          </div>
        `;
      });
    }

    if (!html) {
      html = `<p style="font-size: 0.8125rem; color: var(--texte-secondaire); text-align: center; padding: 1.5rem;">Aucun résultat pour "${terme}".</p>`;
    }

    conteneur.innerHTML = html;
  }
};

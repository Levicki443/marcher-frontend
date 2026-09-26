/**
 * Vue Rapports, Bilan Financier et Statistiques d'Exploitation.
 */

const VUE_RAPPORTS = {
  async rendre(conteneur) {
    conteneur.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700;">Rapports d'Activité & Bilan Financier</h2>
          <p style="color: var(--texte-secondaire); font-size: 0.875rem;">Synthèse comptable, marges commerciales et valorisation</p>
        </div>
        <button id="btn-imprimer-rapport" class="btn btn-primaire">
          <i class="bi bi-printer"></i>
          <span>Imprimer le Rapport</span>
        </button>
      </div>

      <!-- Filtre de Période -->
      <div class="carte" style="margin-bottom: 1.25rem; display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.8125rem; font-weight: 600;">Période du :</label>
          <input type="date" id="rapport-debut" class="champ-input" style="width: 170px;" />
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label style="font-size: 0.8125rem; font-weight: 600;">Au :</label>
          <input type="date" id="rapport-fin" class="champ-input" style="width: 170px;" />
        </div>
        <button id="btn-generer-rapport" class="btn btn-primaire btn-sm">
          <i class="bi bi-calculator"></i>
          <span>Générer Bilan</span>
        </button>
      </div>

      <!-- Zone imprimable du rapport -->
      <div id="zone-contenu-rapport" class="carte" style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div style="text-align: center; color: var(--texte-secondaire); padding: 2rem;">Génération du rapport en cours...</div>
      </div>
    `;

    document.getElementById('btn-generer-rapport')?.addEventListener('click', () => this.chargerDonnees());
    document.getElementById('btn-imprimer-rapport')?.addEventListener('click', () => window.print());

    await this.chargerDonnees();
  },

  async chargerDonnees() {
    const debut = document.getElementById('rapport-debut')?.value;
    const fin = document.getElementById('rapport-fin')?.value;

    let url = '/rapports/synthese';
    if (debut && fin) url += `?dateDebut=${debut}&dateFin=${fin}`;

    try {
      const res = await API.get(url);
      const conteneur = document.getElementById('zone-contenu-rapport');
      if (!conteneur || !res.succes) return;

      const { finances, repartitionPaiements, repartitionDepenses, stocks } = res.donnees;

      conteneur.innerHTML = `
        <div style="border-bottom: var(--bordure-discrete); padding-bottom: 1rem; display: flex; justify-content: space-between; align-items: flex-start;">
          <div>
            <h2 style="color: var(--couleur-principale); font-size: 1.5rem;">SUPERMARCHÉ PRO</h2>
            <p style="font-size: 0.875rem; color: var(--texte-secondaire);">Bilan Financier & Rapport d'Exploitation</p>
          </div>
          <div style="text-align: right; font-size: 0.8125rem;">
            <strong>Période analysée :</strong><br />
            <span>Du ${formaterDate(res.periode.dateDebut)} au ${formaterDate(res.periode.dateFin)}</span>
          </div>
        </div>

        <!-- Synthèse financière sous forme de tableau de bord -->
        <div>
          <h3 style="font-size: 1.1rem; margin-bottom: 1rem;">1. Compte de Résultat d'Exploitation</h3>
          <div class="grille-kpi">
            <div class="carte carte-kpi">
              <span class="kpi-titre">Chiffre d'Affaires Brut</span>
              <div class="kpi-valeur" style="color: var(--couleur-principale);">${formaterMontant(finances.chiffreAffaires)}</div>
              <span style="font-size: 0.75rem; color: var(--texte-secondaire);">${finances.totalVentes} ventes réalisées</span>
            </div>
            <div class="carte carte-kpi">
              <span class="kpi-titre">Coût d'Achat des Marchandises</span>
              <div class="kpi-valeur">${formaterMontant(finances.totalCoutAchat)}</div>
              <span style="font-size: 0.75rem; color: var(--texte-secondaire);">Valeur de revient</span>
            </div>
            <div class="carte carte-kpi succes">
              <span class="kpi-titre">Marge Commerciale Brute</span>
              <div class="kpi-valeur" style="color: var(--couleur-succes);">${formaterMontant(finances.margeBrute)}</div>
              <span style="font-size: 0.75rem; color: var(--couleur-succes);">Taux de marge : ${finances.margePourcentage}%</span>
            </div>
            <div class="carte carte-kpi alerte">
              <span class="kpi-titre">Charges & Dépenses Totales</span>
              <div class="kpi-valeur" style="color: var(--couleur-erreur);">${formaterMontant(finances.totalDepenses)}</div>
              <span style="font-size: 0.75rem; color: var(--texte-secondaire);">Charges opérationnelles</span>
            </div>
            <div class="carte carte-kpi ${finances.beneficeNet >= 0 ? 'succes' : 'erreur'}">
              <span class="kpi-titre">Bénéfice Net d'Exploitation</span>
              <div class="kpi-valeur" style="color: ${finances.beneficeNet >= 0 ? 'var(--couleur-succes)' : 'var(--couleur-erreur)'};">
                ${formaterMontant(finances.beneficeNet)}
              </div>
              <span style="font-size: 0.75rem; color: var(--texte-secondaire);">Résultat net estimé</span>
            </div>
          </div>
        </div>

        <!-- Détails Dépenses & Modes de règlement -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
          <div>
            <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">2. Répartition des Encaissements</h3>
            <div class="table-conteneur">
              <table class="table-gestion">
                <thead><tr><th>Mode de Règlement</th><th style="text-align: right;">Montant Total</th></tr></thead>
                <tbody>
                  ${Object.entries(repartitionPaiements).length > 0 ? Object.entries(repartitionPaiements).map(([mode, mt]) => `
                    <tr><td><strong>${mode}</strong></td><td style="text-align: right; font-weight: 600;">${formaterMontant(mt)}</td></tr>
                  `).join('') : `<tr><td colspan="2" style="text-align: center; color: var(--texte-secondaire);">Aucun encaissement</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">3. Répartition des Dépenses</h3>
            <div class="table-conteneur">
              <table class="table-gestion">
                <thead><tr><th>Catégorie de Dépense</th><th style="text-align: right;">Montant</th></tr></thead>
                <tbody>
                  ${Object.entries(repartitionDepenses).length > 0 ? Object.entries(repartitionDepenses).map(([cat, mt]) => `
                    <tr><td><strong>${cat}</strong></td><td style="text-align: right; font-weight: 600; color: var(--couleur-erreur);">${formaterMontant(mt)}</td></tr>
                  `).join('') : `<tr><td colspan="2" style="text-align: center; color: var(--texte-secondaire);">Aucune dépense</td></tr>`}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <!-- Situation du Stock -->
        <div>
          <h3 style="font-size: 1rem; margin-bottom: 0.75rem;">4. Situation et Valorisation de l'Inventaire</h3>
          <div style="background-color: var(--fond-general); padding: 1.25rem; border-radius: var(--rayon-md); display: flex; justify-content: space-around; flex-wrap: wrap; gap: 1rem;">
            <div><span style="font-size: 0.8125rem; color: var(--texte-secondaire);">Articles en stock :</span><br /><strong style="font-size: 1.25rem;">${stocks.totalArticles} unités</strong></div>
            <div><span style="font-size: 0.8125rem; color: var(--texte-secondaire);">Références actives :</span><br /><strong style="font-size: 1.25rem;">${stocks.totalReferences} produits</strong></div>
            <div><span style="font-size: 0.8125rem; color: var(--texte-secondaire);">Valeur d'Achat globale :</span><br /><strong style="font-size: 1.25rem;">${formaterMontant(stocks.valeurStockAchat)}</strong></div>
            <div><span style="font-size: 0.8125rem; color: var(--texte-secondaire);">Valeur Vente potentielle :</span><br /><strong style="font-size: 1.25rem; color: var(--couleur-principale);">${formaterMontant(stocks.valeurStockVente)}</strong></div>
          </div>
        </div>
      `;
    } catch (err) {
      console.error('Erreur rapport:', err);
    }
  }
};

/**
 * Vue Tableau de Bord (Dashboard).
 * Présentation visuelle des indicateurs de performance, alertes et graphiques.
 */

const VUE_DASHBOARD = {
  async rendre(conteneur) {
    conteneur.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700;">Aperçu Général des Activités</h2>
          <p style="color: var(--texte-secondaire); font-size: 0.875rem;">Indicateurs financiers et suivi du supermarché en temps réel</p>
        </div>
        <button id="btn-rafraichir-dashboard" class="btn btn-primaire btn-sm">
          <i class="bi bi-arrow-clockwise"></i>
          <span>Actualiser</span>
        </button>
      </div>

      <!-- Zone des alertes prioritaires -->
      <div id="zone-alertes-dashboard" style="margin-bottom: 1.5rem;"></div>

      <!-- Grille des cartes de KPIs -->
      <div class="grille-kpi" id="grille-kpis-dashboard">
        <div class="carte carte-kpi">
          <span class="kpi-titre">Ventes du jour</span>
          <div class="kpi-valeur" id="kpi-ventes-jour">—</div>
          <span style="font-size: 0.75rem; color: var(--texte-secondaire);" id="kpi-nb-ventes-jour">0 transaction</span>
        </div>

        <div class="carte carte-kpi succes">
          <span class="kpi-titre">Chiffre d'affaires (Mois)</span>
          <div class="kpi-valeur" id="kpi-ca-mois">—</div>
          <span style="font-size: 0.75rem; color: var(--couleur-succes);">Bénéfice estimé : <strong id="kpi-benefice-mois">—</strong></span>
        </div>

        <div class="carte carte-kpi alerte">
          <span class="kpi-titre">Dépenses du mois</span>
          <div class="kpi-valeur" id="kpi-depenses-mois">—</div>
          <span style="font-size: 0.75rem; color: var(--texte-secondaire);">Charges d'exploitation</span>
        </div>

        <div class="carte carte-kpi erreur">
          <span class="kpi-titre">Alertes de Stock</span>
          <div class="kpi-valeur" id="kpi-total-alertes" style="color: var(--couleur-erreur);">0</div>
          <span style="font-size: 0.75rem; color: var(--texte-secondaire);" id="kpi-detail-alertes">0 rupture · 0 faible</span>
        </div>
      </div>

      <!-- Graphique d'évolution et Top Produits -->
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 1.5rem;">
        
        <!-- Historique des 7 derniers jours -->
        <div class="carte">
          <h3 style="font-size: 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="bi bi-bar-chart-line" style="color: var(--couleur-principale);"></i>
            <span>Activité des 7 derniers jours</span>
          </h3>
          <div id="barres-historique-7j" style="display: flex; flex-direction: column; gap: 0.75rem; padding-top: 0.5rem;">
            <div style="text-align: center; color: var(--texte-secondaire); padding: 2rem;">Chargement des données...</div>
          </div>
        </div>

        <!-- Top 5 des meilleures ventes -->
        <div class="carte">
          <h3 style="font-size: 1rem; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
            <i class="bi bi-trophy" style="color: var(--couleur-alerte);"></i>
            <span>Top 5 des produits les plus vendus</span>
          </h3>
          <div class="table-conteneur">
            <table class="table-gestion">
              <thead>
                <tr>
                  <th>Produit</th>
                  <th style="text-align: right;">Qté vendue</th>
                  <th style="text-align: right;">Total généré</th>
                </tr>
              </thead>
              <tbody id="top-produits-corps">
                <tr><td colspan="3" style="text-align: center; color: var(--texte-secondaire);">Aucune vente enregistrée.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>
    `;

    document.getElementById('btn-rafraichir-dashboard')?.addEventListener('click', () => this.chargerDonnees());
    await this.chargerDonnees();
  },

  async chargerDonnees() {
    try {
      const reponse = await API.get('/dashboard/statistiques');
      if (!reponse.succes) return;

      const { kpis, historique7Jours, topProduits } = reponse.donnees;

      // 1. Remplissage des KPIs
      document.getElementById('kpi-ventes-jour').textContent = formaterMontant(kpis.chiffreAffairesJour);
      document.getElementById('kpi-nb-ventes-jour').textContent = `${kpis.nombreVentesJour} vente(s) enregistrée(s)`;
      document.getElementById('kpi-ca-mois').textContent = formaterMontant(kpis.chiffreAffairesMois);
      document.getElementById('kpi-benefice-mois').textContent = formaterMontant(kpis.beneficeNetMois);
      document.getElementById('kpi-depenses-mois').textContent = formaterMontant(kpis.totalDepensesMois);

      const totalAlertes = kpis.produitsRupture + kpis.produitsStockFaible + kpis.produitsPerimes + kpis.produitsBientotExpires;
      document.getElementById('kpi-total-alertes').textContent = totalAlertes;
      document.getElementById('kpi-detail-alertes').textContent = `${kpis.produitsRupture} rupture(s) · ${kpis.produitsStockFaible} stock(s) faible(s)`;

      // 2. Bannière d'alerte si nécessaire
      const zoneAlertes = document.getElementById('zone-alertes-dashboard');
      if (zoneAlertes) {
        if (totalAlertes > 0) {
          zoneAlertes.innerHTML = `
            <div style="background-color: rgba(220, 38, 38, 0.08); border-left: 4px solid var(--couleur-erreur); padding: 1rem 1.25rem; border-radius: var(--rayon-sm); display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 0.75rem;">
                <i class="bi bi-exclamation-triangle-fill" style="color: var(--couleur-erreur); font-size: 1.25rem;"></i>
                <span style="font-weight: 600; font-size: 0.875rem;">Attention : ${kpis.produitsRupture} produit(s) en rupture et ${kpis.produitsStockFaible} sous le seuil minimum !</span>
              </div>
              <button class="btn btn-supprimer btn-sm" onclick="APP.naviguerVers('stocks')">Gérer les stocks</button>
            </div>
          `;
        } else {
          zoneAlertes.innerHTML = '';
        }
      }

      // 3. Rendu des barres d'historique 7 jours
      const conteneur7j = document.getElementById('barres-historique-7j');
      if (conteneur7j && historique7Jours.length > 0) {
        const caMax = Math.max(...historique7Jours.map((j) => j.chiffreAffaires), 1000);
        conteneur7j.innerHTML = historique7Jours
          .map((jour) => {
            const pourcentage = Math.min(100, Math.round((jour.chiffreAffaires / caMax) * 100));
            return `
              <div>
                <div style="display: flex; justify-content: space-between; font-size: 0.8125rem; margin-bottom: 0.25rem;">
                  <span style="font-weight: 500;">${jour.label}</span>
                  <span style="font-weight: 600; color: var(--couleur-principale);">${formaterMontant(jour.chiffreAffaires)} (${jour.nombreVentes} vte)</span>
                </div>
                <div style="height: 10px; background-color: var(--fond-general); border-radius: var(--rayon-plein); overflow: hidden;">
                  <div style="height: 100%; width: ${Math.max(5, pourcentage)}%; background-color: var(--couleur-principale); border-radius: var(--rayon-plein);"></div>
                </div>
              </div>
            `;
          })
          .join('');
      }

      // 4. Rendu du Top 5 Produits
      const topCorps = document.getElementById('top-produits-corps');
      if (topCorps) {
        if (topProduits && topProduits.length > 0) {
          topCorps.innerHTML = topProduits
            .map(
              (p, index) => `
              <tr>
                <td><strong>#${index + 1}</strong> ${p.nom}</td>
                <td style="text-align: right; font-weight: 600;">${p.totalVendu}</td>
                <td style="text-align: right; font-weight: 600; color: var(--couleur-succes);">${formaterMontant(p.chiffreAffairesGenere)}</td>
              </tr>
            `
            )
            .join('');
        } else {
          topCorps.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--texte-secondaire); padding: 1.5rem;">Aucune vente enregistrée pour le moment.</td></tr>`;
        }
      }
    } catch (erreur) {
      console.error('Erreur chargement dashboard:', erreur);
    }
  }
};

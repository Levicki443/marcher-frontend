/**
 * Module d'édition et d'impression de factures professionnelles format A4.
 */

const INVOICE_UTIL = {
  /**
   * Génère et ouvre une facture commerciale complète format A4.
   * @param {object} vente Données de la vente
   */
  imprimerFactureA4(vente) {
    const client = vente.client || { nom: 'Client Comptant', prenom: '', adresse: 'Vente directe magasin', telephone: '—' };
    const dateFacture = formaterDate(vente.createdAt, false);

    APP.ouvrirModale({
      titre: `Facture A4 #${vente.numeroTicket}`,
      contenu: `
        <div id="zone-facture-a4" style="background: #fff; padding: 2rem; border-radius: var(--rayon-md); border: 1px solid #e2e8f0; font-family: var(--police-texte); font-size: 13px; line-height: 1.6;">
          
          <!-- En-tête Facture -->
          <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid var(--couleur-principale); padding-bottom: 1.25rem; margin-bottom: 1.5rem;">
            <div>
              <h2 style="font-size: 1.5rem; color: var(--couleur-principale); margin: 0;">SUPERMARCHÉ PRO</h2>
              <p style="margin: 2px 0; color: var(--texte-secondaire);">Grande Distribution & Commerce Général</p>
              <p style="margin: 2px 0; color: var(--texte-secondaire);">NINEA : 009876543 / RC : SN.DKR.2026.B.123</p>
              <p style="margin: 2px 0; color: var(--texte-secondaire);">Tél : +221 33 800 00 00 · Email : facturation@supermarche.sn</p>
            </div>
            <div style="text-align: right;">
              <h3 style="font-size: 1.25rem; margin: 0; color: var(--texte-principal);">FACTURE N°</h3>
              <p style="font-size: 1.1rem; font-weight: 700; color: var(--couleur-principale); margin: 2px 0;">${vente.numeroTicket}</p>
              <p style="margin: 2px 0; color: var(--texte-secondaire);">Date : ${dateFacture}</p>
            </div>
          </div>

          <!-- Coordonnées Client & Facturation -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 1.5rem; background: var(--fond-general); padding: 1rem; border-radius: var(--rayon-sm);">
            <div>
              <strong style="color: var(--texte-secondaire); font-size: 11px; text-transform: uppercase;">Émis par :</strong>
              <p style="margin: 2px 0; font-weight: 600;">Supermarché Pro Centrale</p>
              <p style="margin: 2px 0;">Caissier : ${vente.caissier?.prenom || ''} ${vente.caissier?.nom || ''}</p>
            </div>
            <div style="text-align: right;">
              <strong style="color: var(--texte-secondaire); font-size: 11px; text-transform: uppercase;">Facturé à :</strong>
              <p style="margin: 2px 0; font-weight: 700;">${client.prenom} ${client.nom}</p>
              <p style="margin: 2px 0;">${client.adresse || 'Dakar, Sénégal'}</p>
              <p style="margin: 2px 0;">Tél : ${client.telephone || '—'}</p>
            </div>
          </div>

          <!-- Tableau des Articles -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">
            <thead>
              <tr style="background-color: var(--barre-laterale); color: #fff; text-align: left;">
                <th style="padding: 8px 12px;">Désignation</th>
                <th style="padding: 8px 12px; text-align: center;">Qté</th>
                <th style="padding: 8px 12px; text-align: right;">Prix Unitaire</th>
                <th style="padding: 8px 12px; text-align: right;">Total HT</th>
              </tr>
            </thead>
            <tbody>
              ${vente.articles
                .map(
                  (a, idx) => `
                <tr style="border-bottom: 1px solid #e2e8f0; background-color: ${idx % 2 === 0 ? '#fff' : '#f8fafc'};">
                  <td style="padding: 8px 12px;"><strong>${a.nomProduit}</strong></td>
                  <td style="padding: 8px 12px; text-align: center;">${a.quantite}</td>
                  <td style="padding: 8px 12px; text-align: right;">${formaterMontant(a.prixUnitaire)}</td>
                  <td style="padding: 8px 12px; text-align: right; font-weight: 600;">${formaterMontant(a.sousTotal)}</td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>

          <!-- Totaux et Règlements -->
          <div style="display: flex; justify-content: flex-end; margin-bottom: 1.5rem;">
            <div style="width: 280px; display: flex; flex-direction: column; gap: 4px;">
              <div style="display: flex; justify-content: space-between;"><span>Sous-Total :</span><strong>${formaterMontant(vente.sousTotal)}</strong></div>
              ${vente.remise > 0 ? `<div style="display: flex; justify-content: space-between; color: var(--couleur-erreur);"><span>Remise :</span><strong>-${formaterMontant(vente.remise)}</strong></div>` : ''}
              <div style="display: flex; justify-content: space-between; font-size: 1.1rem; font-weight: 700; border-top: 2px solid #0f172a; padding-top: 6px; margin-top: 4px; color: var(--couleur-principale);">
                <span>TOTAL TTC :</span><span>${formaterMontant(vente.totalNet)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--texte-secondaire); margin-top: 4px;">
                <span>Mode : ${vente.modePaiement}</span><span>Montant versé : ${formaterMontant(vente.montantPaye)}</span>
              </div>
            </div>
          </div>

          <!-- Bas de page & Mentions légales -->
          <div style="border-top: 1px solid #e2e8f0; padding-top: 1rem; text-align: center; font-size: 11px; color: var(--texte-secondaire);">
            <p style="margin: 2px 0;">Conditions de règlement : Paiement au comptant. Marchandise ni reprise ni échangée après 48h.</p>
            <p style="margin: 2px 0;">Merci pour votre confiance !</p>
          </div>

        </div>
      `,
      texteBoutonValider: 'Imprimer / Sauvegarder PDF',
      actionValidation: () => {
        window.print();
      }
    });
  }
};

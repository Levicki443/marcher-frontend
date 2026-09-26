/**
 * Module d'impression de ticket thermique de caisse (80mm).
 */

const TICKET_UTIL = {
  /**
   * Imprime un ticket thermique officiel conforme pour une vente.
   * @param {object} vente Données de la transaction
   */
  imprimer(vente) {
    const zone = document.getElementById('zone-ticket-imprimable');
    if (!zone) return;

    zone.innerHTML = `
      <div style="font-family: monospace; text-align: center; width: 100%;">
        <h3 style="margin: 0; font-size: 16px;">SUPERMARCHÉ PRO</h3>
        <p style="margin: 2px 0; font-size: 11px;">Plateforme de Vente & Gestion</p>
        <p style="margin: 2px 0; font-size: 11px;">Ticket #${vente.numeroTicket}</p>
        <p style="margin: 2px 0; font-size: 10px;">Date : ${formaterDate(vente.createdAt, true)}</p>
        <p style="margin: 2px 0; font-size: 10px;">Caissier : ${vente.caissier?.prenom || ''} ${vente.caissier?.nom || ''}</p>
        ${vente.client ? `<p style="margin: 2px 0; font-size: 10px;">Client : ${vente.client.prenom || ''} ${vente.client.nom}</p>` : ''}
        <hr style="border: 0.5px dashed #000; margin: 6px 0;" />
        <table style="width: 100%; font-size: 11px; text-align: left;">
          <thead>
            <tr><th>Article</th><th>Qté</th><th style="text-align: right;">Total</th></tr>
          </thead>
          <tbody>
            ${vente.articles
              .map(
                (a) => `
              <tr>
                <td>${a.nomProduit}</td>
                <td>${a.quantite}</td>
                <td style="text-align: right;">${formaterMontant(a.sousTotal)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <hr style="border: 0.5px dashed #000; margin: 6px 0;" />
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Sous-total :</span><span>${formaterMontant(vente.sousTotal)}</span>
        </div>
        ${vente.remise > 0 ? `<div style="display: flex; justify-content: space-between; font-size: 11px;"><span>Remise :</span><span>-${formaterMontant(vente.remise)}</span></div>` : ''}
        <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-top: 4px;">
          <span>TOTAL :</span><span>${formaterMontant(vente.totalNet)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; margin-top: 4px;">
          <span>Mode : ${vente.modePaiement}</span><span>Reçu : ${formaterMontant(vente.montantPaye)}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px;">
          <span>Rendu monnaie :</span><span>${formaterMontant(vente.monnaieRendue)}</span>
        </div>
        <hr style="border: 0.5px dashed #000; margin: 8px 0;" />
        <p style="margin: 0; font-size: 11px;">Merci pour votre visite !</p>
      </div>
    `;

    window.print();
    setTimeout(() => {
      zone.innerHTML = '';
    }, 1500);
  }
};

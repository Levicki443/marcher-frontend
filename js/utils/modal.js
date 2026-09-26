/**
 * Gestionnaire générique des fenêtres modales de l'application.
 */

const MODAL_UTIL = {
  actionEnAttente: null,

  /**
   * Ouvre la modale globale avec contenu et actions configurables.
   * @param {object} options
   */
  ouvrir({ titre, contenu, texteBoutonValider = 'Valider', afficherBoutonValider = true, actionValidation = null }) {
    const modale = document.getElementById('modale-globale');
    const boite = document.getElementById('modale-contenu');
    if (!modale || !boite) return;

    this.actionEnAttente = actionValidation;

    boite.innerHTML = `
      <div class="modale-entete">
        <h3 style="font-size: 1.125rem;">${titre}</h3>
        <button type="button" class="btn btn-annuler btn-sm" onclick="MODAL_UTIL.fermer()">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>
      <div class="modale-corps">${contenu}</div>
      <div class="modale-pied">
        <button type="button" class="btn btn-annuler" onclick="MODAL_UTIL.fermer()">Annuler</button>
        ${afficherBoutonValider ? `
          <button type="button" id="btn-valider-modale" class="btn btn-valider">${texteBoutonValider}</button>
        ` : ''}
      </div>
    `;

    document.getElementById('btn-valider-modale')?.addEventListener('click', async () => {
      if (this.actionEnAttente) {
        try {
          await this.actionEnAttente();
        } catch (err) {
          console.error('Erreur validation modale:', err);
        }
      }
    });

    modale.style.display = 'flex';
    setTimeout(() => modale.classList.add('active'), 10);
  },

  /**
   * Ferme la modale active.
   */
  fermer() {
    const modale = document.getElementById('modale-globale');
    if (!modale) return;
    modale.classList.remove('active');
    setTimeout(() => {
      modale.style.display = 'none';
      this.actionEnAttente = null;
    }, 200);
  }
};

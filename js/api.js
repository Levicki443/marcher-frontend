/**
 * Client HTTP pour communiquer avec l'API Backend.
 * Gère automatiquement l'en-tête Authorization Bearer et les erreurs.
 */

const API = {
  /**
   * Envoie une notification Toast à l'utilisateur.
   * @param {string} message Contenu textuel
   * @param {'succes'|'erreur'|'alerte'} type Type visuel de notification
   */
  notifier(message, type = 'succes') {
    const conteneur = document.getElementById('toast-conteneur');
    if (!conteneur) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icone = 'bi-check-circle-fill';
    if (type === 'erreur') icone = 'bi-x-circle-fill';
    if (type === 'alerte') icone = 'bi-exclamation-triangle-fill';

    toast.innerHTML = `
      <i class="bi ${icone}"></i>
      <span>${message}</span>
    `;

    conteneur.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Exécute une requête HTTP sécurisée vers l'API.
   * @param {string} endpoint Point de terminaison (ex: '/produits')
   * @param {object} options Options de fetch
   * @returns {Promise<any>} Données JSON retournées par l'API
   */
  async requete(endpoint, options = {}) {
    const token = localStorage.getItem(CONFIG.CLES_STOCKAGE.TOKEN);

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    };

    try {
      const url = `${CONFIG.API_BASE_URL}${endpoint}`;
      const reponse = await fetch(url, {
        ...options,
        headers
      });

      const donnees = await reponse.json().catch(() => ({}));

      if (!reponse.ok) {
        // En cas d'expiration du jeton (401), forcer la déconnexion
        if (reponse.status === 401 && !endpoint.includes('/auth/connexion')) {
          API.notifier('Votre session a expiré. Veuillez vous reconnecter.', 'alerte');
          AUTH.deconnexion();
          throw new Error('Session expirée');
        }

        const messageErreur = donnees.message || `Erreur HTTP ${reponse.status}`;
        throw new Error(messageErreur);
      }

      return donnees;
    } catch (erreur) {
      if (erreur.message !== 'Session expirée') {
        let messageAffiche = erreur.message;
        if (erreur.name === 'TypeError' || (erreur.message && erreur.message.toLowerCase().includes('fetch'))) {
          messageAffiche = 'Impossible de contacter le serveur backend (port 5000). Veuillez vérifier qu’il est bien démarré.';
        }
        API.notifier(messageAffiche, 'erreur');
      }
      throw erreur;
    }
  },

  get(endpoint) {
    return this.requete(endpoint, { method: 'GET' });
  },

  post(endpoint, corps) {
    return this.requete(endpoint, {
      method: 'POST',
      body: JSON.stringify(corps)
    });
  },

  put(endpoint, corps) {
    return this.requete(endpoint, {
      method: 'PUT',
      body: JSON.stringify(corps)
    });
  },

  delete(endpoint) {
    return this.requete(endpoint, { method: 'DELETE' });
  }
};

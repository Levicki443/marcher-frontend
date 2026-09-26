/**
 * Configuration globale de l'application frontend.
 */

// URL de l'API Backend Render (ou localStorage / local)
// Si vous avez déployé sur Render, mettez ici votre URL (ex: 'https://votre-app.onrender.com/api')
const URL_BACKEND_RENDER = ''; 

const hoteServeur = (typeof window !== 'undefined' && window.location && window.location.hostname)
  ? window.location.hostname
  : 'localhost';

const urlApiParDefaut = URL_BACKEND_RENDER || `http://${hoteServeur}:5000/api`;

const CONFIG = {
  // Priorité : 1. localStorage (si défini via console ou paramètre), 2. URL Render configurée, 3. localhost:5000
  API_BASE_URL: (typeof localStorage !== 'undefined' && localStorage.getItem('API_BASE_URL')) || urlApiParDefaut,
  DEVISE: 'FCFA',
  CLES_STOCKAGE: {
    TOKEN: 'supermarche_jwt_token',
    UTILISATEUR: 'supermarche_utilisateur_info'
  },
  ROLES: {
    ADMINISTRATEUR: 'Administrateur',
    GERANT: 'Gérant',
    CAISSIER: 'Caissier',
    GESTIONNAIRE_STOCK: 'Gestionnaire de stock'
  }
};

/**
 * Formate un nombre en montant monétaire avec la devise officielle.
 * @param {number} montant Valeur à formater
 * @returns {string} Montant formaté (ex: "125 000 FCFA")
 */
function formaterMontant(montant) {
  if (montant === undefined || montant === null || isNaN(montant)) return `0 ${CONFIG.DEVISE}`;
  return `${Math.round(montant).toLocaleString('fr-FR')} ${CONFIG.DEVISE}`;
}

/**
 * Formate une date ISO en chaîne lisible en français.
 * @param {string|Date} dateValeur Date à formater
 * @param {boolean} inclureHeure Afficher également l'heure
 * @returns {string} Date formatée
 */
function formaterDate(dateValeur, inclureHeure = false) {
  if (!dateValeur) return '—';
  const d = new Date(dateValeur);
  const options = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...(inclureHeure && { hour: '2-digit', minute: '2-digit' })
  };
  return d.toLocaleDateString('fr-FR', options);
}

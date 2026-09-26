/**
 * Gestion de l'authentification, de la session et des droits d'accès.
 */

const AUTH = {
  /**
   * Récupère l'utilisateur actuellement connecté depuis le localStorage.
   * @returns {object|null}
   */
  obtenirUtilisateur() {
    const stocke = localStorage.getItem(CONFIG.CLES_STOCKAGE.UTILISATEUR);
    try {
      return stocke ? JSON.parse(stocke) : null;
    } catch {
      return null;
    }
  },

  /**
   * Vérifie si un utilisateur est actuellement authentifié.
   * @returns {boolean}
   */
  estConnecte() {
    return Boolean(localStorage.getItem(CONFIG.CLES_STOCKAGE.TOKEN) && this.obtenirUtilisateur());
  },

  /**
   * Connecte l'utilisateur et initialise son environnement.
   * @param {string} email
   * @param {string} motDePasse
   */
  async connexion(email, motDePasse) {
    const reponse = await API.post('/auth/connexion', { email, motDePasse });
    if (reponse.succes && reponse.token) {
      localStorage.setItem(CONFIG.CLES_STOCKAGE.TOKEN, reponse.token);
      localStorage.setItem(CONFIG.CLES_STOCKAGE.UTILISATEUR, JSON.stringify(reponse.utilisateur));
      API.notifier(`Bienvenue, ${reponse.utilisateur.prenom} !`, 'succes');
      this.appliquerInterface();
      APP.naviguerVers('dashboard');
    }
  },

  /**
   * Inscrit un nouvel utilisateur et initialise son environnement.
   * @param {object} donnees
   */
  async inscription(donnees) {
    const reponse = await API.post('/auth/inscription', donnees);
    if (reponse.succes && reponse.token) {
      localStorage.setItem(CONFIG.CLES_STOCKAGE.TOKEN, reponse.token);
      localStorage.setItem(CONFIG.CLES_STOCKAGE.UTILISATEUR, JSON.stringify(reponse.utilisateur));
      API.notifier(`Compte créé avec succès ! Bienvenue, ${reponse.utilisateur.prenom} !`, 'succes');
      this.appliquerInterface();
      APP.naviguerVers('dashboard');
    }
  },

  /**
   * Bascule l'affichage entre les formulaires de connexion et d'inscription.
   * @param {'connexion'|'inscription'} type
   */
  basculerOnglet(type) {
    const formConnexion = document.getElementById('formulaire-connexion');
    const formInscription = document.getElementById('formulaire-inscription');
    const ongletConnexion = document.getElementById('onglet-connexion');
    const ongletInscription = document.getElementById('onglet-inscription');

    if (type === 'inscription') {
      if (formConnexion) formConnexion.style.display = 'none';
      if (formInscription) formInscription.style.display = 'block';
      if (ongletConnexion) ongletConnexion.className = 'btn btn-annuler btn-sm';
      if (ongletInscription) ongletInscription.className = 'btn btn-primaire btn-sm';
    } else {
      if (formConnexion) formConnexion.style.display = 'block';
      if (formInscription) formInscription.style.display = 'none';
      if (ongletConnexion) ongletConnexion.className = 'btn btn-primaire btn-sm';
      if (ongletInscription) ongletInscription.className = 'btn btn-annuler btn-sm';
    }
  },

  /**
   * Déconnecte l'utilisateur et réinitialise l'affichage.
   */
  deconnexion() {
    localStorage.removeItem(CONFIG.CLES_STOCKAGE.TOKEN);
    localStorage.removeItem(CONFIG.CLES_STOCKAGE.UTILISATEUR);
    this.appliquerInterface();
  },

  /**
   * Met à jour les éléments de navigation selon les rôles du cahier des charges (Section 11.6).
   */
  appliquerInterface() {
    const ecranConnexion = document.getElementById('ecran-connexion');
    const appPrincipale = document.getElementById('app-principale');

    if (!this.estConnecte()) {
      if (ecranConnexion) ecranConnexion.style.display = 'flex';
      if (appPrincipale) appPrincipale.style.display = 'none';
      return;
    }

    if (ecranConnexion) ecranConnexion.style.display = 'none';
    if (appPrincipale) appPrincipale.style.display = 'flex';

    const utilisateur = this.obtenirUtilisateur();
    const nomElem = document.getElementById('utilisateur-nom');
    const roleElem = document.getElementById('utilisateur-role');
    const avatarElem = document.getElementById('utilisateur-avatar');

    if (nomElem) nomElem.textContent = `${utilisateur.prenom} ${utilisateur.nom}`;
    if (roleElem) roleElem.textContent = utilisateur.role;
    if (avatarElem) avatarElem.textContent = utilisateur.prenom.charAt(0).toUpperCase();

    // Gestion de la visibilité des menus selon le rôle
    const role = utilisateur.role;
    const masquerSiInaccessible = (idMenu, condition) => {
      const el = document.getElementById(idMenu);
      if (el) el.style.display = condition ? 'flex' : 'none';
    };

    const estAdminOuGerant = role === CONFIG.ROLES.ADMINISTRATEUR || role === CONFIG.ROLES.GERANT;
    const estStock = role === CONFIG.ROLES.GESTIONNAIRE_STOCK || estAdminOuGerant;
    const estCaisse = role === CONFIG.ROLES.CAISSIER || estAdminOuGerant;

    masquerSiInaccessible('nav-caisse', estCaisse);
    masquerSiInaccessible('nav-stocks', estStock);
    masquerSiInaccessible('nav-fournisseurs', estStock);
    masquerSiInaccessible('nav-depenses', estAdminOuGerant);
    masquerSiInaccessible('nav-employes', role === CONFIG.ROLES.ADMINISTRATEUR);
    masquerSiInaccessible('nav-rapports', estAdminOuGerant);
  }
};

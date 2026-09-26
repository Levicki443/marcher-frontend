/**
 * Contrôleur principal de l'application frontend.
 * Gère le routage par onglets, l'affichage des vues et les modales globales.
 */

const APP = {
  vueActuelle: 'dashboard',
  modaleActionEnAttente: null,

  /**
   * Initialisation au chargement de la page.
   */
  initialiser() {
    this.attacherEcouteursGlobaux();
    SPOTLIGHT_UTIL.initialiser();
    AUTH.appliquerInterface();

    if (AUTH.estConnecte()) {
      this.naviguerVers('dashboard');
    }
  },

  /**
   * Attache les écouteurs d'événements principaux.
   */
  attacherEcouteursGlobaux() {
    // Bouton de recherche Spotlight dans la topbar
    document.getElementById('btn-trigger-spotlight')?.addEventListener('click', () => {
      SPOTLIGHT_UTIL.ouvrir();
    });

    // Formulaire de connexion
    const formConnexion = document.getElementById('formulaire-connexion');
    formConnexion?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('input-email')?.value.trim();
      const motDePasse = document.getElementById('input-motdepasse')?.value;

      if (!email || !motDePasse) {
        API.notifier('Veuillez saisir votre email et votre mot de passe.', 'alerte');
        return;
      }

      const btn = document.getElementById('btn-se-connecter');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Connexion...';
      }

      try {
        await AUTH.connexion(email, motDePasse);
      } catch (err) {
        // Erreur notifiée automatiquement par API
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> <span>Se connecter</span>';
        }
      }
    });

    // Bascule des onglets Connexion / Inscription
    document.getElementById('onglet-connexion')?.addEventListener('click', () => {
      AUTH.basculerOnglet('connexion');
    });
    document.getElementById('onglet-inscription')?.addEventListener('click', () => {
      AUTH.basculerOnglet('inscription');
    });

    // Formulaire d'inscription
    const formInscription = document.getElementById('formulaire-inscription');
    formInscription?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const prenom = document.getElementById('input-inscr-prenom')?.value.trim();
      const nom = document.getElementById('input-inscr-nom')?.value.trim();
      const email = document.getElementById('input-inscr-email')?.value.trim();
      const telephone = document.getElementById('input-inscr-telephone')?.value.trim();
      const role = document.getElementById('input-inscr-role')?.value;
      const motDePasse = document.getElementById('input-inscr-motdepasse')?.value;

      if (!prenom || !nom || !email || !motDePasse) {
        API.notifier('Veuillez renseigner tous les champs obligatoires.', 'alerte');
        return;
      }

      if (motDePasse.length < 6) {
        API.notifier('Le mot de passe doit comporter au moins 6 caractères.', 'alerte');
        return;
      }

      const btn = document.getElementById('btn-creer-compte');
      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Création en cours...';
      }

      try {
        await AUTH.inscription({ prenom, nom, email, telephone, role, motDePasse });
      } catch (err) {
        // Erreur notifiée automatiquement par API
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="bi bi-person-check-fill"></i> <span>Créer mon compte et accéder</span>';
        }
      }
    });

    // Bouton de déconnexion
    document.getElementById('btn-deconnexion')?.addEventListener('click', () => {
      if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        AUTH.deconnexion();
        API.notifier('Vous avez été déconnecté avec succès.', 'succes');
      }
    });

    // Navigation dans la barre latérale
    document.querySelectorAll('#navigation-principale .nav-lien').forEach((lien) => {
      lien.addEventListener('click', (e) => {
        const vue = e.currentTarget.dataset.vue;
        if (vue) {
          this.naviguerVers(vue);
        }
      });
    });

    // Profil utilisateur dans la barre supérieure
    document.getElementById('zone-profil-utilisateur')?.addEventListener('click', () => {
      this.ouvrirModaleProfil();
    });

    // Raccourcis clavier d'exploitation rapide
    document.addEventListener('keydown', (e) => {
      // Échap pour fermer les modales
      if (e.key === 'Escape') {
        this.fermerModale();
      }
      // F2 pour ouvrir la caisse et réinitialiser
      if (e.key === 'F2') {
        e.preventDefault();
        this.naviguerVers('caisse');
      }
      // F4 pour focaliser le montant reçu en caisse
      if (e.key === 'F4' && this.vueActuelle === 'caisse') {
        e.preventDefault();
        const inputRecu = document.getElementById('pos-montant-recu');
        if (inputRecu) inputRecu.focus();
      }
    });

    // Fermeture de modale en cliquant sur l'arrière-plan
    const modale = document.getElementById('modale-globale');
    modale?.addEventListener('click', (e) => {
      if (e.target === modale) {
        this.fermerModale();
      }
    });
  },

  /**
   * Change la vue active et met à jour les indicateurs visuels.
   * @param {string} nomVue Identifiant de la vue
   */
  async naviguerVers(nomVue) {
    this.vueActuelle = nomVue;

    // Mise à jour de la classe active sur les liens de navigation
    document.querySelectorAll('#navigation-principale .nav-lien').forEach((lien) => {
      lien.classList.toggle('actif', lien.dataset.vue === nomVue);
    });

    const titreElem = document.getElementById('titre-vue-active');
    const titres = {
      dashboard: 'Tableau de bord',
      caisse: 'Point de Vente & Caisse',
      produits: 'Produits & Catégories',
      stocks: 'Mouvements & Stocks',
      ventes: 'Historique des Ventes',
      clients: 'Gestion des Clients',
      fournisseurs: 'Gestion des Fournisseurs',
      depenses: 'Gestion des Dépenses',
      employes: 'Gestion des Employés',
      rapports: 'Rapports & Bilan Financier'
    };

    if (titreElem) titreElem.textContent = titres[nomVue] || 'Supermarché Pro';

    const conteneur = document.getElementById('zone-vue-dynamique');
    if (!conteneur) return;

    // Affichage d'un loader élégant
    conteneur.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; min-height: 50vh; color: var(--texte-secondaire);">
        <div style="text-align: center;">
          <div style="font-size: 2rem; color: var(--couleur-principale); margin-bottom: 0.5rem;"><i class="bi bi-arrow-repeat spin"></i></div>
          <p style="font-size: 0.875rem;">Chargement du module en cours...</p>
        </div>
      </div>
    `;

    // Routage vers le bon contrôleur de vue
    switch (nomVue) {
      case 'dashboard':
        await VUE_DASHBOARD.rendre(conteneur);
        break;
      case 'caisse':
        await VUE_CAISSE.rendre(conteneur);
        break;
      case 'produits':
        await VUE_PRODUITS.rendre(conteneur);
        break;
      case 'stocks':
        await VUE_STOCKS.rendre(conteneur);
        break;
      case 'ventes':
        await VUE_VENTES.rendre(conteneur);
        break;
      case 'clients':
        await VUE_GESTION.rendreClients(conteneur);
        break;
      case 'fournisseurs':
        await VUE_GESTION.rendreFournisseurs(conteneur);
        break;
      case 'depenses':
        await VUE_GESTION.rendreDepenses(conteneur);
        break;
      case 'employes':
        await VUE_GESTION.rendreEmployes(conteneur);
        break;
      case 'rapports':
        await VUE_RAPPORTS.rendre(conteneur);
        break;
      default:
        await VUE_DASHBOARD.rendre(conteneur);
        break;
    }
  },

  /**
   * Ouvre la modale globale avec contenu et actions dynamiques.
   */
  ouvrirModale(options) {
    MODAL_UTIL.ouvrir(options);
  },

  /**
   * Ferme la modale globale.
   */
  fermerModale() {
    MODAL_UTIL.fermer();
  },

  /**
   * Ouvre la modale de profil pour voir les infos et modifier son mot de passe.
   */
  ouvrirModaleProfil() {
    const user = AUTH.obtenirUtilisateur();
    if (!user) return;

    this.ouvrirModale({
      titre: 'Mon Profil & Sécurité',
      contenu: `
        <div style="font-size: 0.875rem; margin-bottom: 1.25rem; background-color: var(--fond-general); padding: 1rem; border-radius: var(--rayon-md);">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
            <span style="color: var(--texte-secondaire);">Nom & Prénom :</span>
            <strong>${user.prenom} ${user.nom}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.35rem;">
            <span style="color: var(--texte-secondaire);">Email professionnel :</span>
            <strong>${user.email}</strong>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: var(--texte-secondaire);">Rôle d'accès :</span>
            <span class="badge badge-info">${user.role}</span>
          </div>
        </div>

        <h4 style="font-size: 0.9375rem; margin-bottom: 0.75rem;">Changer mon mot de passe</h4>
        <form id="form-changer-mdp" onsubmit="return false;">
          <div class="champ-groupe">
            <label class="champ-label">Ancien mot de passe *</label>
            <input type="password" id="mdp-ancien" class="champ-input" placeholder="••••••••" required />
          </div>
          <div class="champ-groupe">
            <label class="champ-label">Nouveau mot de passe (min 6 car.) *</label>
            <input type="password" id="mdp-nouveau" class="champ-input" placeholder="••••••••" required />
          </div>
        </form>
      `,
      texteBoutonValider: 'Mettre à jour le mot de passe',
      actionValidation: async () => {
        const ancienMotDePasse = document.getElementById('mdp-ancien').value;
        const nouveauMotDePasse = document.getElementById('mdp-nouveau').value;

        if (!ancienMotDePasse || !nouveauMotDePasse) {
          API.notifier('Veuillez remplir les deux champs de mot de passe.', 'alerte');
          return;
        }

        if (nouveauMotDePasse.length < 6) {
          API.notifier('Le nouveau mot de passe doit comporter au moins 6 caractères.', 'alerte');
          return;
        }

        await API.put('/auth/changer-mot-de-passe', { ancienMotDePasse, nouveauMotDePasse });
        API.notifier('Votre mot de passe a été modifié avec succès.', 'succes');
        this.fermerModale();
      }
    });
  }
};

// Initialisation globale au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  APP.initialiser();
});

/**
 * Vues de gestion administrative (Clients, Fournisseurs, Dépenses, Personnel & Maintenance).
 * Conforme à la limite stricte de 325 lignes et aux standards UTF-8.
 */

const VUE_GESTION = {
  // 1. CLIENTS
  async rendreClients(conteneur) {
    conteneur.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700;">Portefeuille Clients</h2>
          <p style="color: var(--texte-secondaire); font-size: 0.875rem;">Fidélisation et historique des achats</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button id="btn-vider-clients" class="btn btn-supprimer btn-sm" style="display: none;" onclick="VUE_GESTION.viderTousLesClients()">
            <i class="bi bi-trash3-fill"></i> <span>Vider tous les clients</span>
          </button>
          <button class="btn btn-primaire" onclick="VUE_GESTION.ouvrirModaleClient()">
            <i class="bi bi-person-plus-fill"></i> <span>Ajouter un client</span>
          </button>
        </div>
      </div>
      <div class="table-conteneur">
        <table class="table-gestion">
          <thead><tr><th>Nom & Prénom</th><th>Téléphone</th><th>Email</th><th>Adresse</th><th style="text-align: right;">Total Achats</th><th style="text-align: right;">Actions</th></tr></thead>
          <tbody id="tableau-clients-corps"><tr><td colspan="6" style="text-align: center; padding: 2rem;">Chargement...</td></tr></tbody>
        </table>
      </div>
    `;
    const res = await API.get('/clients');
    const corps = document.getElementById('tableau-clients-corps');
    if (!corps) return;
    const clients = res.donnees || [];
    const btnVider = document.getElementById('btn-vider-clients');
    if (btnVider && clients.length > 0) btnVider.style.display = 'inline-flex';

    corps.innerHTML = clients.length === 0 ? `<tr><td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--texte-secondaire);"><i class="bi bi-people" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.5;"></i>Aucun client enregistré. Le registre est neuf et vierge.</td></tr>` : clients.map((c) => `
      <tr>
        <td><strong>${c.prenom || ''} ${c.nom || ''}</strong></td>
        <td>${c.telephone || '—'}</td>
        <td>${c.email || '—'}</td>
        <td>${c.adresse || '—'}</td>
        <td style="text-align: right; font-weight: 600; color: var(--couleur-succes);">${formaterMontant(c.totalAchats)} (${c.nombreCommandes || 0} vte)</td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-modifier btn-sm" onclick="VUE_GESTION.ouvrirModaleClient('${c._id}')" title="Modifier"><i class="bi bi-pencil-square"></i></button>
          <button class="btn btn-supprimer btn-sm" onclick="VUE_GESTION.supprimerClient('${c._id}', '${((c.prenom || '') + ' ' + (c.nom || '')).trim()}')" title="Supprimer"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },

  async supprimerClient(id, nom) {
    if (!confirm(`Supprimer définitivement le client "${nom}" ?`)) return;
    await API.delete(`/clients/${id}`);
    API.notifier(`Client supprimé.`, 'succes');
    APP.naviguerVers('clients');
  },

  async viderTousLesClients() {
    if (!confirm('ATTENTION : Supprimer TOUS les clients du système ?')) return;
    await API.delete('/clients/tous/vider');
    API.notifier('Registre des clients réinitialisé à neuf.', 'succes');
    APP.naviguerVers('clients');
  },

  ouvrirModaleClient(id = null) {
    APP.ouvrirModale({
      titre: id ? 'Modifier le Client' : 'Nouveau Client',
      contenu: `
        <form id="form-client" onsubmit="return false;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Nom *</label><input type="text" id="cl-nom" class="champ-input" required /></div>
            <div class="champ-groupe"><label class="champ-label">Prénom</label><input type="text" id="cl-prenom" class="champ-input" /></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Téléphone</label><input type="text" id="cl-tel" class="champ-input" /></div>
            <div class="champ-groupe"><label class="champ-label">Email</label><input type="email" id="cl-email" class="champ-input" /></div>
          </div>
          <div class="champ-groupe"><label class="champ-label">Adresse</label><input type="text" id="cl-adresse" class="champ-input" /></div>
        </form>
      `,
      actionValidation: async () => {
        const nom = document.getElementById('cl-nom').value.trim();
        const prenom = document.getElementById('cl-prenom').value.trim();
        const telephone = document.getElementById('cl-tel').value.trim();
        const email = document.getElementById('cl-email').value.trim();
        const adresse = document.getElementById('cl-adresse').value.trim();
        if (!nom) return;
        if (id) await API.put(`/clients/${id}`, { nom, prenom, telephone, email, adresse });
        else await API.post('/clients', { nom, prenom, telephone, email, adresse });
        API.notifier('Client enregistré.', 'succes');
        APP.fermerModale();
        APP.naviguerVers('clients');
      }
    });
  },

  // 2. FOURNISSEURS
  async rendreFournisseurs(conteneur) {
    conteneur.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700;">Gestion des Fournisseurs</h2>
          <p style="color: var(--texte-secondaire); font-size: 0.875rem;">Partenaires et approvisionnements</p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondaire" onclick="VUE_GESTION.ouvrirModaleBonCommande()"><i class="bi bi-file-earmark-text"></i> <span>Bon de commande</span></button>
          <button class="btn btn-primaire" onclick="VUE_GESTION.ouvrirModaleFournisseur()"><i class="bi bi-truck"></i> <span>Nouveau fournisseur</span></button>
        </div>
      </div>
      <div class="table-conteneur">
        <table class="table-gestion">
          <thead><tr><th>Entreprise</th><th>Responsable</th><th>Téléphone</th><th>Email</th><th>Adresse</th><th>Produits fournis</th><th style="text-align: right;">Actions</th></tr></thead>
          <tbody id="tableau-fournisseurs-corps"><tr><td colspan="7" style="text-align: center; padding: 2rem;">Chargement...</td></tr></tbody>
        </table>
      </div>
    `;
    const res = await API.get('/fournisseurs');
    const corps = document.getElementById('tableau-fournisseurs-corps');
    if (!corps) return;
    const fournisseurs = res.donnees || [];
    corps.innerHTML = fournisseurs.length === 0 ? `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--texte-secondaire);"><i class="bi bi-truck" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.5;"></i>Aucun fournisseur enregistré. Répertoire neuf et vierge.</td></tr>` : fournisseurs.map((f) => `
      <tr>
        <td><strong>${f.nomEntreprise}</strong></td>
        <td>${f.nomResponsable || '—'}</td>
        <td>${f.telephone}</td>
        <td>${f.email || '—'}</td>
        <td>${f.adresse || '—'}</td>
        <td><span style="font-size: 0.8125rem; color: var(--texte-secondaire);">${(f.produitsFournis || []).join(', ') || 'Divers'}</span></td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-supprimer btn-sm" onclick="VUE_GESTION.supprimerFournisseur('${f._id}', '${f.nomEntreprise}')" title="Supprimer"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },

  async supprimerFournisseur(id, nom) {
    if (!confirm(`Supprimer le fournisseur "${nom}" ?`)) return;
    await API.delete(`/fournisseurs/${id}`);
    API.notifier(`Fournisseur supprimé.`, 'succes');
    APP.naviguerVers('fournisseurs');
  },

  async ouvrirModaleBonCommande() {
    const [resFourn, resProd] = await Promise.all([API.get('/fournisseurs'), API.get('/produits')]);
    const fournisseurs = resFourn.donnees || [];
    if (fournisseurs.length === 0) return API.notifier('Aucun fournisseur disponible. Veuillez en créer un.', 'alerte');
    PURCHASE_ORDER_UTIL.ouvrirModale(fournisseurs, resProd.donnees || []);
  },

  ouvrirModaleFournisseur() {
    APP.ouvrirModale({
      titre: 'Ajouter un Fournisseur',
      contenu: `
        <form id="form-fourn" onsubmit="return false;">
          <div class="champ-groupe"><label class="champ-label">Nom de l'entreprise *</label><input type="text" id="fn-nom" class="champ-input" required /></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Responsable</label><input type="text" id="fn-resp" class="champ-input" /></div>
            <div class="champ-groupe"><label class="champ-label">Téléphone *</label><input type="text" id="fn-tel" class="champ-input" required /></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Email</label><input type="email" id="fn-email" class="champ-input" /></div>
            <div class="champ-groupe"><label class="champ-label">Adresse</label><input type="text" id="fn-adresse" class="champ-input" /></div>
          </div>
        </form>
      `,
      actionValidation: async () => {
        const nomEntreprise = document.getElementById('fn-nom').value.trim();
        const nomResponsable = document.getElementById('fn-resp').value.trim();
        const telephone = document.getElementById('fn-tel').value.trim();
        const email = document.getElementById('fn-email').value.trim();
        const adresse = document.getElementById('fn-adresse').value.trim();
        if (!nomEntreprise || !telephone) return;
        await API.post('/fournisseurs', { nomEntreprise, nomResponsable, telephone, email, adresse });
        API.notifier('Fournisseur ajouté.', 'succes');
        APP.fermerModale();
        APP.naviguerVers('fournisseurs');
      }
    });
  },

  // 3. DÉPENSES
  async rendreDepenses(conteneur) {
    conteneur.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700;">Gestion des Dépenses</h2>
          <p style="color: var(--texte-secondaire); font-size: 0.875rem;">Suivi des charges d'exploitation</p>
        </div>
        <button class="btn btn-primaire" onclick="VUE_GESTION.ouvrirModaleDepense()"><i class="bi bi-cash-stack"></i> <span>Enregistrer une dépense</span></button>
      </div>
      <div class="table-conteneur">
        <table class="table-gestion">
          <thead><tr><th>Date</th><th>Catégorie</th><th>Libellé / Titre</th><th>Bénéficiaire / Réf</th><th>Enregistré Par</th><th style="text-align: right;">Montant</th><th style="text-align: right;">Actions</th></tr></thead>
          <tbody id="tableau-depenses-corps"><tr><td colspan="7" style="text-align: center; padding: 2rem;">Chargement...</td></tr></tbody>
        </table>
      </div>
    `;
    const res = await API.get('/depenses');
    const corps = document.getElementById('tableau-depenses-corps');
    if (!corps) return;
    const depenses = res.donnees || [];
    corps.innerHTML = depenses.length === 0 ? `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--texte-secondaire);"><i class="bi bi-cash-stack" style="font-size: 2rem; display: block; margin-bottom: 0.5rem; opacity: 0.5;"></i>Aucune dépense enregistrée. Registre neuf.</td></tr>` : depenses.map((d) => `
      <tr>
        <td style="font-size: 0.8125rem;">${formaterDate(d.dateDepense)}</td>
        <td><span class="badge badge-info">${d.categorie}</span></td>
        <td><strong>${d.titre}</strong></td>
        <td>${d.beneficiaire || d.referenceFacture || '—'}</td>
        <td style="font-size: 0.8125rem;">${d.enregistrePar?.prenom || ''} ${d.enregistrePar?.nom || ''}</td>
        <td style="text-align: right; font-weight: 700; color: var(--couleur-erreur);">${formaterMontant(d.montant)}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-supprimer btn-sm" onclick="VUE_GESTION.supprimerDepense('${d._id}', '${d.titre}')" title="Supprimer"><i class="bi bi-trash"></i></button>
        </td>
      </tr>
    `).join('');
  },

  async supprimerDepense(id, titre) {
    if (!confirm(`Supprimer la dépense "${titre}" ?`)) return;
    await API.delete(`/depenses/${id}`);
    API.notifier(`Dépense supprimée.`, 'succes');
    APP.naviguerVers('depenses');
  },

  ouvrirModaleDepense() {
    APP.ouvrirModale({
      titre: 'Enregistrer une Dépense',
      contenu: `
        <form id="form-dep" onsubmit="return false;">
          <div class="champ-groupe"><label class="champ-label">Titre / Libellé *</label><input type="text" id="dp-titre" class="champ-input" required /></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Catégorie *</label><select id="dp-cat" class="champ-select"><option value="Électricité">Électricité</option><option value="Eau">Eau</option><option value="Transport">Transport</option><option value="Salaires">Salaires</option><option value="Entretien">Entretien</option><option value="Achat de matériel">Achat de matériel</option><option value="Autre">Autre</option></select></div>
            <div class="champ-groupe"><label class="champ-label">Montant (FCFA) *</label><input type="number" id="dp-montant" class="champ-input" min="1" required /></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Bénéficiaire</label><input type="text" id="dp-benef" class="champ-input" /></div>
            <div class="champ-groupe"><label class="champ-label">N° Facture / Reçu</label><input type="text" id="dp-ref" class="champ-input" /></div>
          </div>
        </form>
      `,
      actionValidation: async () => {
        const titre = document.getElementById('dp-titre').value.trim();
        const categorie = document.getElementById('dp-cat').value;
        const montant = Number(document.getElementById('dp-montant').value);
        const beneficiaire = document.getElementById('dp-benef').value.trim();
        const referenceFacture = document.getElementById('dp-ref').value.trim();
        if (!titre || !montant) return;
        await API.post('/depenses', { titre, categorie, montant, beneficiaire, referenceFacture });
        API.notifier('Dépense enregistrée.', 'succes');
        APP.fermerModale();
        APP.naviguerVers('depenses');
      }
    });
  },

  // 4. PERSONNEL & MAINTENANCE
  async rendreEmployes(conteneur) {
    conteneur.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <h2 style="font-size: 1.35rem; font-weight: 700;">Personnel & Administration</h2>
          <p style="color: var(--texte-secondaire); font-size: 0.875rem;">Comptes d'accès, sauvegarde et maintenance</p>
        </div>
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <button class="btn btn-supprimer btn-sm" onclick="VUE_GESTION.reinitialiserPlateformeComplet()"><i class="bi bi-arrow-counterclockwise"></i> <span>Remise à neuf</span></button>
          <button class="btn btn-annuler btn-sm" onclick="VUE_GESTION.telechargerBackupBDD()"><i class="bi bi-cloud-arrow-down-fill"></i> <span>Sauvegarde BDD</span></button>
          <button class="btn btn-primaire btn-sm" onclick="VUE_GESTION.ouvrirModaleEmploye()"><i class="bi bi-person-plus-fill"></i> <span>Créer un compte</span></button>
        </div>
      </div>
      <div class="table-conteneur">
        <table class="table-gestion">
          <thead><tr><th>Nom & Prénom</th><th>Email</th><th>Téléphone</th><th>Rôle</th><th>Statut</th><th>Dernière connexion</th><th style="text-align: right;">Actions</th></tr></thead>
          <tbody id="tableau-employes-corps"><tr><td colspan="7" style="text-align: center; padding: 2rem;">Chargement...</td></tr></tbody>
        </table>
      </div>
    `;
    const res = await API.get('/utilisateurs');
    const corps = document.getElementById('tableau-employes-corps');
    if (!corps) return;
    const employes = res.donnees || [];
    const utilisateurActuel = AUTH.obtenirUtilisateur();

    corps.innerHTML = employes.map((e) => {
      const estMemeCompte = utilisateurActuel && (utilisateurActuel.id === e._id || utilisateurActuel._id === e._id);
      return `
      <tr>
        <td><strong>${e.prenom} ${e.nom}</strong></td>
        <td>${e.email}</td>
        <td>${e.telephone || '—'}</td>
        <td><span class="badge badge-info">${e.role}</span></td>
        <td><span class="badge ${e.actif ? 'badge-normal' : 'badge-rupture'}">${e.actif ? 'Actif' : 'Désactivé'}</span></td>
        <td style="font-size: 0.8125rem;">${formaterDate(e.derniereConnexion, true)}</td>
        <td style="text-align: right; white-space: nowrap;">
          ${!estMemeCompte ? `<button class="btn btn-supprimer btn-sm" onclick="VUE_GESTION.supprimerEmploye('${e._id}', '${e.prenom} ${e.nom}')" title="Supprimer"><i class="bi bi-trash"></i></button>` : `<span style="font-size: 0.75rem; color: var(--texte-secondaire);">Vous</span>`}
        </td>
      </tr>
    `;
    }).join('');
  },

  async supprimerEmploye(id, nom) {
    if (!confirm(`Supprimer définitivement le compte de "${nom}" ?`)) return;
    await API.delete(`/utilisateurs/${id}`);
    API.notifier(`Compte supprimé avec succès.`, 'succes');
    APP.naviguerVers('employes');
  },

  ouvrirModaleEmploye() {
    APP.ouvrirModale({
      titre: 'Créer un Compte Employé',
      contenu: `
        <form id="form-emp" onsubmit="return false;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Nom *</label><input type="text" id="emp-nom" class="champ-input" required /></div>
            <div class="champ-groupe"><label class="champ-label">Prénom *</label><input type="text" id="emp-prenom" class="champ-input" required /></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Email professionnel *</label><input type="email" id="emp-email" class="champ-input" required /></div>
            <div class="champ-groupe"><label class="champ-label">Téléphone</label><input type="text" id="emp-tel" class="champ-input" /></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <div class="champ-groupe"><label class="champ-label">Rôle d'accès *</label><select id="emp-role" class="champ-select"><option value="Caissier">Caissier</option><option value="Gestionnaire de stock">Gestionnaire de stock</option><option value="Gérant">Gérant</option><option value="Administrateur">Administrateur</option></select></div>
            <div class="champ-groupe"><label class="champ-label">Mot de passe temporaire *</label><input type="password" id="emp-pass" class="champ-input" value="Password123!" required /></div>
          </div>
        </form>
      `,
      actionValidation: async () => {
        const nom = document.getElementById('emp-nom').value.trim();
        const prenom = document.getElementById('emp-prenom').value.trim();
        const email = document.getElementById('emp-email').value.trim();
        const telephone = document.getElementById('emp-tel').value.trim();
        const role = document.getElementById('emp-role').value;
        const motDePasse = document.getElementById('emp-pass').value;
        if (!nom || !prenom || !email) return;
        await API.post('/utilisateurs', { nom, prenom, email, telephone, role, motDePasse });
        API.notifier('Employé créé.', 'succes');
        APP.fermerModale();
        APP.naviguerVers('employes');
      }
    });
  },

  async telechargerBackupBDD() {
    API.notifier('Génération de la sauvegarde...', 'succes');
    const donnees = await API.get('/backup/export');
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' });
    const lien = document.createElement('a');
    lien.href = URL.createObjectURL(blob);
    lien.download = `backup_supermarche_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);
  },

  async reinitialiserPlateformeComplet() {
    if (!confirm('ATTENTION : Voulez-vous RÉINITIALISER TOTALEMENT la plateforme à neuf ? Toutes les ventes, stocks, produits, catégories, clients et dépenses seront purgés.')) return;
    try {
      const res = await API.post('/backup/reinitialiser-a-neuf', {});
      if (res.succes) {
        API.notifier('Plateforme réinitialisée à neuf avec succès !', 'succes');
        APP.naviguerVers('dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  }
};

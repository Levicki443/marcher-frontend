/**
 * Utilitaire d'exportation de données en format CSV compatible Excel / UTF-8.
 */

const EXPORT_UTIL = {
  /**
   * Exporte un tableau d'objets en fichier CSV avec téléchargement automatique.
   * @param {Array<object>} donnees Liste des objets à exporter
   * @param {Array<{cle: string, label: string}>} colonnes Définition des colonnes
   * @param {string} nomFichier Nom du fichier téléchargé (sans extension)
   */
  exporterCSV(donnees, colonnes, nomFichier = 'export_donnees') {
    if (!donnees || donnees.length === 0) {
      API.notifier('Aucune donnée à exporter.', 'alerte');
      return;
    }

    const separateur = ';';
    const enTetes = colonnes.map((c) => `"${c.label.replace(/"/g, '""')}"`).join(separateur);

    const lignes = donnees.map((ligne) => {
      return colonnes
        .map((col) => {
          let valeur = ligne[col.cle];
          if (valeur === null || valeur === undefined) valeur = '';
          if (typeof valeur === 'object') valeur = JSON.stringify(valeur);
          return `"${String(valeur).replace(/"/g, '""')}"`;
        })
        .join(separateur);
    });

    // Ajout du BOM UTF-8 (\uFEFF) pour assurer la bonne ouverture des accents dans Microsoft Excel
    const contenuCSV = '\uFEFF' + [enTetes, ...lignes].join('\r\n');
    const blob = new Blob([contenuCSV], { type: 'text/csv;charset=utf-8;' });

    const lien = document.createElement('a');
    const url = URL.createObjectURL(blob);
    lien.setAttribute('href', url);
    lien.setAttribute('download', `${nomFichier}_${new Date().toISOString().split('T')[0]}.csv`);
    lien.style.visibility = 'hidden';
    document.body.appendChild(lien);
    lien.click();
    document.body.removeChild(lien);

    API.notifier('Export CSV téléchargé avec succès.', 'succes');
  }
};

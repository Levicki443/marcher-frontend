/**
 * Utilitaire de scan de code-barres par flux caméra / webcam.
 */

const SCANNER_UTIL = {
  fluxVideo: null,
  enCoursDeScan: false,

  /**
   * Ouvre la caméra et démarre la détection automatique du code-barres.
   * @param {function(string): void} callbackSucces Fonction rappel appelée avec la valeur du code scanné
   */
  async ouvrirScannerCamera(callbackSucces) {
    APP.ouvrirModale({
      titre: 'Scanner un Code-Barres par Caméra',
      contenu: `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem;">
          <div style="position: relative; width: 100%; max-width: 400px; height: 260px; background: #000; border-radius: var(--rayon-md); overflow: hidden; display: flex; align-items: center; justify-content: center;">
            <video id="video-flux-scanner" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
            <div style="position: absolute; width: 70%; height: 50%; border: 2px dashed #2563EB; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.4); border-radius: 8px; pointer-events: none;"></div>
          </div>
          <p style="font-size: 0.8125rem; color: var(--texte-secondaire); text-align: center;">
            Positionnez le code-barres de l'article dans le rectangle bleu.
          </p>
          <div style="width: 100%;">
            <input type="text" id="saisie-manuelle-scanner" class="champ-input" placeholder="Ou saisir le code manuellement..." />
          </div>
        </div>
      `,
      texteBoutonValider: 'Valider le code',
      actionValidation: () => {
        const codeManuel = document.getElementById('saisie-manuelle-scanner')?.value.trim();
        if (codeManuel) {
          this.arreterScanner();
          callbackSucces(codeManuel);
          APP.fermerModale();
        }
      }
    });

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      this.fluxVideo = stream;
      const videoElem = document.getElementById('video-flux-scanner');
      if (videoElem) {
        videoElem.srcObject = stream;
        this.enCoursDeScan = true;
        this.detecterEnContinu(videoElem, callbackSucces);
      }
    } catch (err) {
      console.warn('Accès caméra non disponible ou refusé:', err);
      API.notifier('Caméra non accessible. Veuillez utiliser la saisie manuelle.', 'alerte');
    }

    // Arrêt de la caméra si la modale est fermée
    const boutonAnnuler = document.querySelector('#modale-globale .btn-annuler');
    boutonAnnuler?.addEventListener('click', () => this.arreterScanner());
  },

  /**
   * Analyse en continu les images du flux vidéo pour détecter les codes-barres.
   */
  async detecterEnContinu(videoElem, callbackSucces) {
    if (!('BarcodeDetector' in window)) {
      return; // BarcodeDetector non supporté nativement par ce navigateur, saisie manuelle active
    }

    const detecteur = new window.BarcodeDetector({
      formats: ['ean_13', 'ean_8', 'code_128', 'qr_code', 'upc_a']
    });

    const boucleScan = async () => {
      if (!this.enCoursDeScan) return;

      try {
        const barcodes = await detecteur.detect(videoElem);
        if (barcodes.length > 0) {
          const codeDetecte = barcodes[0].rawValue;
          this.arreterScanner();
          API.notifier(`Code-barres détecté : ${codeDetecte}`, 'succes');
          callbackSucces(codeDetecte);
          APP.fermerModale();
          return;
        }
      } catch {
        // Ignorer les erreurs frame par frame
      }

      if (this.enCoursDeScan) {
        requestAnimationFrame(boucleScan);
      }
    };

    requestAnimationFrame(boucleScan);
  },

  /**
   * Coupe le flux caméra et libère le matériel.
   */
  arreterScanner() {
    this.enCoursDeScan = false;
    if (this.fluxVideo) {
      this.fluxVideo.getTracks().forEach((track) => track.stop());
      this.fluxVideo = null;
    }
  }
};

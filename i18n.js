const i18n = require('i18next');
const i18nextBackend = require('i18next-fs-backend'); // Utilisation du backend fichier pour Node.js
const i18nextMiddleware = require('i18next-http-middleware');
const path = require('path');

i18n
  .use(i18nextBackend) // Utilisation du backend pour charger les fichiers de traduction depuis le système de fichiers
  .use(i18nextMiddleware.LanguageDetector) // Utilisation du middleware pour détecter la langue
  .init({
    fallbackLng: 'en', // Langue de secours
    backend: {
      loadPath: path.join(__dirname, 'locales', '{{lng}}', '{{ns}}.json'), // Chemin vers les fichiers de traduction
    },
    detection: {
      order: ['querystring', 'cookie', 'header'], // Ordre de détection de la langue
    },
    preload: ['en', 'fr'], // Langues préchargées
    saveMissing: true, // Enregistrer les clés manquantes dans les fichiers de traduction (facultatif)
  });

module.exports = i18n;

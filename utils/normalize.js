// utils/normalize.js

/**
 * Normalize the language format to xx-XX.
 * @param {string} language - The language code (e.g., 'en', 'fr', 'en-US').
 * @returns {string} - The normalized language code in the format xx-XX.
 */
const normalizeLanguage = (language) => {
  // Vérifier si la langue est déjà au format xx-XX
  if (/^[a-z]{2}-[A-Z]{2}$/.test(language)) {
    return language;
  }

  // Convertir le format xx en xx-XX
  if (/^[a-z]{2}$/.test(language)) {
    return `${language}-${language.toUpperCase()}`;
  }

  // Retourner une valeur par défaut si la langue est invalide
  return 'en-US'; // Valeur par défaut
};

/**
 * Normalize the region format to XX.
 * @param {string} region - The region code (e.g., 'us', 'fr').
 * @returns {string} - The normalized region code in the format XX.
 */
const normalizeRegion = (region) => {
  // Convertir la région au format XX
  if (/^[a-z]{2}$/.test(region)) {
    return region.toUpperCase();
  }

  if (/^[a-z]{2}-[A-Z]{2}$/.test(region)) {
    return region.split('-')[1];
  }

  // Retourner une valeur par défaut si la région est invalide
  return 'US'; // Valeur par défaut
};

module.exports = { normalizeLanguage, normalizeRegion };

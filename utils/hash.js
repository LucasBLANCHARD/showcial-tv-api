const bcrypt = require('bcrypt');
const logger = require('./logger');
const saltRounds = 10; // C'est le coût du traitement, qui affecte le temps nécessaire pour hacher le mot de passe.

// Fonction pour hacher un mot de passe
async function hashPassword(password) {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  } catch (error) {
    logger.error('Erreur lors du hachage du mot de passe:', error);
    throw error; // Propager l'erreur pour un traitement ultérieur.
  }
}

// Fonction pour vérifier un mot de passe avec un haché
async function verifyPassword(password, hash) {
  try {
    const isMatch = await bcrypt.compare(password, hash);
    return isMatch; // Retourne true si les mots de passe correspondent, false sinon.
  } catch (error) {
    logger.error('Erreur lors de la vérification du mot de passe:', error);
    throw error; // Propager l'erreur pour un traitement ultérieur.
  }
}

module.exports = { hashPassword, verifyPassword };

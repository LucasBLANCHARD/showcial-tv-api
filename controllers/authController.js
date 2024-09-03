const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/hash');
const logger = require('../utils/logger');
const prisma = new PrismaClient();
require('dotenv').config();

//Fonction de création de compte
async function signup(req, res) {
  const { email, username, password } = req.body;
  try {
    // Vérifier si l'utilisateur existe déjà
    const existingUsers = await prisma.user.findMany({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existingUsers.length > 0) {
      // Déterminer le type de conflit pour fournir un message d'erreur approprié
      const isEmailTaken = existingUsers.some((user) => user.email === email);
      const isUsernameTaken = existingUsers.some(
        (user) => user.username === username
      );

      let message = 'Un compte utilisant cet ';
      message += isEmailTaken ? 'email' : '';
      message += isEmailTaken && isUsernameTaken ? ' et ce ' : '';
      message += isUsernameTaken ? "nom d'utilisateur" : '';
      message += ' existe déjà.';

      return res.status(400).json({ message });
    }

    // Hacher le mot de passe de l'utilisateur
    const hashedPassword = await hashPassword(password);

    // Créer le nouvel utilisateur dans la base de données
    const newUser = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
      },
    });

    // Préparer la réponse en excluant le mot de passe haché
    const { password: _, ...userWithoutPassword } = newUser;

    // creer une list pour le nouvel utilisateur
    await prisma.list.create({
      data: {
        userId: userWithoutPassword.id,
        name: req.t('list.watchlist'),
        isDefault: true,
        isPublic: false,
        description: req.t('list.watchlistDescription'),
      },
    });

    // Renvoyer l'utilisateur créé sans le mot de passe
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    logger.error('Erreur lors de la création de l’utilisateur :', error);
    res
      .status(500)
      .json({ message: "Une erreur est survenue lors de l'inscription." });
  }
}

// Fonction login
async function login(req, res) {
  const { email, password, rememberMe } = req.body;
  try {
    // Rechercher l'utilisateur par email
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res.status(404).json({ message: req.t('auth.wrong-mail') });
    }

    // Vérifier le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: req.t('auth.wrong-password') });
    }

    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined.');
    }

    // Générer un token JWT
    try {
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        jwtSecret,
        {
          expiresIn: rememberMe ? '30d' : '1d',
        }
      );
      res.json({ token });
    } catch (error) {
      console.error('Error generating JWT:', error);
      res.status(500).json({ message: 'Failed to generate token' });
    }

    // Retourner le token
    res.status(201).json();
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: 'Erreur lors de la connexion.' });
  }
}

async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.userId;

  try {
    // Récupérer l'utilisateur
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    // Vérifier le mot de passe actuel
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: req.t('auth.wrong-password') });
    }
    // Vérifier si le nouveau mot de passe est identique à l'ancien
    if (currentPassword === newPassword) {
      return res.status(400).json({
        message: req.t('auth.same-passwords'),
      });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await hashPassword(newPassword);

    // Mettre à jour le mot de passe de l'utilisateur
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        password: hashedPassword,
      },
    });

    res.json({ message: 'Mot de passe modifié avec succès.' });
  } catch (error) {
    logger.error('Erreur lors de la modification du mot de passe :', error);
    res
      .status(500)
      .json({ message: 'Erreur lors de la modification du mot de passe.' });
  }
}

module.exports = { signup, login, changePassword };

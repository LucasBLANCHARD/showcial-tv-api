const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getUserById, getFollowedUsers } = require('../models/users.js');
const { getActivitiesForUsers } = require('../models/activity.js');
const logger = require('../utils/logger.js');

async function getActivities(req, res) {
  const userId = req.user.userId;
  const { limit = 10, page = 0 } = req.query;

  try {
    //get followed users
    const followedUsersIds = await Promise.all([getFollowedUsers(userId)]);

    //get activities for each followed user
    const activities = await Promise.all([
      getActivitiesForUsers(followedUsersIds, limit, page),
    ]);

    if (activities) {
      res.json({ activities });
    } else {
      // Si l'un des deux est indéfini, on considère que c'est une erreur
      res.status(204).json();
    }
  } catch (error) {
    // Log l'erreur pour le débogage
    logger.error(
      "Erreur lors de la récupération de l'utilisateur et de ses activités :",
      error
    );
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function addFollow(req, res) {
  const userId = req.user.userId;
  const { userFollowingId } = req.body;

  try {
    // Vérifier si l'utilisateur actuel existe
    const currentUser = await getUserById(userId);

    if (!currentUser) {
      return res.status(404).json({ error: 'Utilisateur actuel non trouvé' });
    }

    // Vérifier si l'utilisateur à suivre existe
    const userToFollow = await getUserById(userFollowingId);

    if (!userToFollow) {
      return res.status(404).json({ error: 'Utilisateur à suivre non trouvé' });
    }

    // Ajouter la relation de suivi
    const follow = await prisma.follow.create({
      data: {
        followerId: userId,
        followingId: userFollowingId,
      },
    });

    return res.json(follow);
  } catch (error) {
    logger.error("Erreur lors de l'ajout d'un suivi :", error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function removeFollow(req, res) {
  const userId = req.user.userId;
  const { userFollowingId } = req.body;

  try {
    const follow = await prisma.follow.deleteMany({
      where: {
        followerId: userId,
        followingId: userFollowingId,
      },
    });
    res.json(follow);
  } catch {
    logger.error("Erreur lors de la suppression d'un suivi :", error);
    return res.status(404).json({ error: 'Erreur interne du serveur' });
  }
}

module.exports = { getActivities, addFollow, removeFollow };

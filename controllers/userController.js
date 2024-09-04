const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getUserById } = require('../models/users.js');
const {
  getListsForConnectedUserProfile,
  getListsForUserProfile,
} = require('../models/list.js');
const logger = require('../utils/logger.js');
const { get } = require('http');

async function getUserLists(req, res) {
  const language = req.detectedLanguage;
  const { userId } = req.params;

  try {
    if (userId) {
      const { userId } = req.params;
      const [user, lists] = await Promise.all([
        getUserById(userId),
        getListsForUserProfile(userId, language),
      ]);

      // Contrôle si l'utilisateur connecté est abonné à l'utilisateur courant et vice-versa
      if (req.user) {
        const connectedUserId = req.user.userId;

        const isFollowingUserConnected = await prisma.follow.findFirst({
          where: {
            followerId: connectedUserId,
            followingId: userId,
          },
        });

        const isFollowedUserConnected = await prisma.follow.findFirst({
          where: {
            followerId: userId,
            followingId: connectedUserId,
          },
        });

        if (user && lists) {
          return res.json({
            user,
            lists,
            isFollowingUserConnected: !!isFollowingUserConnected,
            isFollowedUserConnected: !!isFollowedUserConnected,
          });
        } else {
          return res
            .status(404)
            .json({ message: 'Utilisateur ou listes non trouvés.' });
        }
      } else {
        return res
          .status(401)
          .json({ message: 'Utilisateur non authentifié.' });
      }
    } else {
      const connectedUserId = req.user.userId;
      const [user, lists] = await Promise.all([
        getUserById(connectedUserId),
        getListsForConnectedUserProfile(connectedUserId, language),
      ]);

      if (user && lists) {
        res.json({ user, lists });
      } else {
        // Si l'un des deux est indéfini, on considère que c'est une erreur
        res.status(404).json({ error: 'Utilisateur ou listes non trouvés' });
      }
    }
  } catch (error) {
    // Log l'erreur pour le débogage
    logger.error(
      "Erreur lors de la récupération de l'utilisateur et de ses listes :",
      error
    );
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function getUsersByUsername(req, res) {
  const { username } = req.params;
  const { limit = 10, offset = 0 } = req.query;
  const userId = req.user.userId;

  try {
    // Récupération des utilisateurs dont le nom contient 'username'
    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: username,
          mode: 'insensitive',
        },
      },
      skip: parseInt(offset),
      take: parseInt(limit),
    });

    const usersWithFollow = await Promise.all(
      users.map(async (user) => {
        // Vérifie si l'utilisateur connecté suit cet utilisateur
        const isFollowing = await prisma.follow.findFirst({
          where: {
            followerId: userId,
            followingId: user.id,
          },
        });

        // Vérifie si cet utilisateur suit l'utilisateur connecté
        const isFollowed = await prisma.follow.findFirst({
          where: {
            followerId: user.id,
            followingId: userId,
          },
        });

        // Retourne l'utilisateur sans le mot de passe
        const { password, ...userWithoutPassword } = user;

        return {
          ...userWithoutPassword,
          isFollowing: !!isFollowing, // Convertit en booléen
          isFollowed: !!isFollowed, // Convertit en booléen
          you: userId === user.id, // Vérifie si c'est l'utilisateur connecté
        };
      })
    );
    // Retourne une liste vide si aucun utilisateur n'est trouvé
    return res.json({ users: usersWithFollow });
  } catch (error) {
    logger.error('Erreur lors de la récupération des utilisateurs :', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function getFollowers(req, res) {
  const { userId } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  if (req.user) {
    const connectedUserId = req.user.userId;

    const followersItems = await prisma.follow.findMany({
      where: {
        followingId: connectedUserId,
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      skip: parseInt(offset),
      take: parseInt(limit),
    });

    //keep only each following.following
    const followers = followersItems.map((follower) => follower.follower);

    const usersWithFollow = await Promise.all(
      followers.map(async (user) => {
        // Vérifie si l'utilisateur connecté suit cet utilisateur
        const isFollowing = await prisma.follow.findFirst({
          where: {
            followerId: connectedUserId,
            followingId: user.id,
          },
        });

        // Vérifie si cet utilisateur suit l'utilisateur connecté
        const isFollowed = await prisma.follow.findFirst({
          where: {
            followerId: user.id,
            followingId: connectedUserId,
          },
        });

        return {
          ...user,
          isFollowing: !!isFollowing, // Convertit en booléen
          isFollowed: !!isFollowed, // Convertit en booléen
        };
      })
    );

    if (usersWithFollow.length > 0) {
      return res.json(usersWithFollow);
    } else {
      // Si l'un des deux est indéfini, on considère que c'est une erreur
      return res.status(204).json();
    }
  } else {
    const { userId } = req.params;

    const followersItems = await prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      skip: parseInt(offset),
      take: parseInt(limit),
    });

    //keep only each following.following
    const followers = followersItems.map((follower) => follower.follower);

    const usersWithFollow = await Promise.all(
      followers.map(async (user) => {
        // Vérifie si l'utilisateur connecté suit cet utilisateur
        const isFollowing = await prisma.follow.findFirst({
          where: {
            followerId: userId,
            followingId: user.id,
          },
        });

        // Vérifie si cet utilisateur suit l'utilisateur connecté
        const isFollowed = await prisma.follow.findFirst({
          where: {
            followerId: user.id,
            followingId: userId,
          },
        });

        return {
          ...user,
          isFollowing: !!isFollowing, // Convertit en booléen
          isFollowed: !!isFollowed, // Convertit en booléen
        };
      })
    );

    if (usersWithFollow.length > 0) {
      return res.json(usersWithFollow);
    } else {
      return res.status(204).json();
    }
  }
}

async function getFollowings(req, res) {
  const { userId } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  if (req.user) {
    const connectedUserId = req.user.userId;

    const followingsItems = await prisma.follow.findMany({
      where: {
        followerId: connectedUserId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      skip: parseInt(offset),
      take: parseInt(limit),
    });

    //keep only each following.following
    const followings = followingsItems.map((following) => following.following);

    const usersWithFollow = await Promise.all(
      followings.map(async (user) => {
        // Vérifie si l'utilisateur connecté suit cet utilisateur
        const isFollowing = await prisma.follow.findFirst({
          where: {
            followerId: connectedUserId,
            followingId: user.id,
          },
        });

        // Vérifie si cet utilisateur suit l'utilisateur connecté
        const isFollowed = await prisma.follow.findFirst({
          where: {
            followerId: user.id,
            followingId: connectedUserId,
          },
        });

        return {
          ...user,
          isFollowing: !!isFollowing, // Convertit en booléen
          isFollowed: !!isFollowed, // Convertit en booléen
        };
      })
    );

    if (usersWithFollow.length > 0) {
      return res.json(usersWithFollow);
    } else {
      // Si l'un des deux est indéfini, on considère que c'est une erreur
      return res.status(204).json();
    }
  } else {
    const { userId } = req.params;

    const followingsItems = await prisma.follow.findMany({
      where: {
        followerId: userId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
          },
        },
      },
      skip: parseInt(offset),
      take: parseInt(limit),
    });

    //keep only each following.following
    const followings = followingsItems.map((following) => following.following);

    const usersWithFollow = await Promise.all(
      followings.map(async (user) => {
        // Vérifie si l'utilisateur connecté suit cet utilisateur
        const isFollowing = await prisma.follow.findFirst({
          where: {
            followerId: userId,
            followingId: user.id,
          },
        });

        // Vérifie si cet utilisateur suit l'utilisateur connecté
        const isFollowed = await prisma.follow.findFirst({
          where: {
            followerId: user.id,
            followingId: userId,
          },
        });

        return {
          ...user,
          isFollowing: !!isFollowing, // Convertit en booléen
          isFollowed: !!isFollowed, // Convertit en booléen
        };
      })
    );

    if (usersWithFollow.length > 0) {
      return res.json(usersWithFollow);
    } else {
      return res.status(204).json();
    }
  }
}

async function deleteAccount(req, res) {
  const userId = req.user.userId;

  try {
    // Supprime l'utilisateur (et tout ce qui est associé via cascade)
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    logger.error('Erreur lors de la suppression du compte :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

module.exports = {
  getUserLists,
  getUsersByUsername,
  getFollowers,
  getFollowings,
  deleteAccount,
};

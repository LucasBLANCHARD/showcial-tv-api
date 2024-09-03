const { PrismaClient } = require('@prisma/client');
const { log } = require('console');
const prisma = new PrismaClient();

/**
 * @param {Array} followedUsers
 * @returns all activities for users
 */
async function getActivitiesForUsers(followedUsersIds, limit, page) {
  const activities = await prisma.activity.findMany({
    where: {
      userId: {
        in: followedUsersIds[0], // Utilise le tableau de chaînes de caractères
      },
    },
    include: {
      // take only the username
      user: {
        select: {
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    skip: parseInt(page) * parseInt(limit),
    take: parseInt(limit),
  });

  return activities;
}

/**
 * Add an activity for a user
 * @param {String} userId
 * @param {String} type
 * @param {String} referenceId
 * @returns the created activity
 */
async function addOrUpdateActivity(userId, type, referenceId) {
  //check if activity already exists
  const existingActivity = await prisma.activity.findFirst({
    where: {
      userId: userId,
      referenceId: referenceId,
    },
  });

  if (existingActivity) {
    const updatedActivity = await prisma.activity.update({
      where: {
        id: existingActivity.id,
      },
      data: {
        type: type,
        createdAt: new Date(),
      },
    });

    return updatedActivity;
  } else {
    const activity = await prisma.activity.create({
      data: {
        type: type,
        referenceId: referenceId,
        user: {
          connect: { id: userId },
        },
      },
    });

    return activity;
  }
}

module.exports = {
  getActivitiesForUsers,
  addOrUpdateActivity,
};

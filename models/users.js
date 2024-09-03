const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 *
 * @param {String} id
 * @returns user by id
 */
async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: {
      id: id,
    },
  });
  const { password, ...userWithoutPassword } = user;

  //count followers and followings
  const followers = await prisma.follow.count({
    where: {
      followingId: id,
    },
  });

  const followings = await prisma.follow.count({
    where: {
      followerId: id,
    },
  });

  // add followers count and followings count to user
  userWithoutPassword.followersCount = followers;
  userWithoutPassword.followingsCount = followings;

  return userWithoutPassword;
}

async function getFollowedUsers(userId) {
  const followedUsers = await prisma.follow.findMany({
    where: {
      followerId: userId,
    },
  });

  const followedUsersIds = followedUsers.map((follow) => follow.followingId);

  return followedUsersIds;
}

module.exports = {
  getUserById,
  getFollowedUsers,
};

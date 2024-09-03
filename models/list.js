const { PrismaClient } = require('@prisma/client');
const { getBackdropPath } = require('../tmdb/tmdb.api');
const prisma = new PrismaClient();

/**
 *
 * @param {String} userId
 * @param {String} language
 * @returns all lists for connected user
 */
async function getListsForConnectedUserProfile(userId, language) {
  //find lists for user and get 5 firsts items for each list
  const lists = await prisma.list.findMany({
    where: {
      userId: userId,
    },
    include: {
      items: {
        take: 5,
      },
    },
  });

  // Pour chaque liste, et pour chaque item dans la liste, ajouter le backdrop_path
  for (const list of lists) {
    for (const item of list.items) {
      if (item === undefined) {
        continue;
      }
      item.backdrop_path = await getBackdropPath({
        tmdbId: item.tmdbId,
        mediaType: item.isMovie ? 'movie' : 'tv',
        language,
      });
    }
  }

  return lists;
}

/**
 * @param {String} userId
 * @param {String} language
 * @returns all public lists for one user
 */
async function getListsForUserProfile(userId, language) {
  //find lists for user and get all items for each list
  const lists = await prisma.list.findMany({
    where: {
      userId: userId,
      isPublic: true,
    },
    include: {
      items: {
        take: 5,
      },
    },
  });

  // Pour chaque liste, et pour chaque item dans la liste, ajouter le backdrop_path
  for (const list of lists) {
    for (const item of list.items) {
      if (item === undefined) {
        continue;
      }
      item.backdrop_path = await getBackdropPath({
        tmdbId: item.tmdbId,
        mediaType: item.isMovie ? 'movie' : 'tv',
        language,
      });
    }
  }

  return lists;
}

/**
 *
 * @param {String} userId
 * @returns all lists for one user
 */
async function getListsForUserWithoutItems(userId) {
  //find lists for user and get 5 firsts items for each list
  const lists = await prisma.list.findMany({
    where: {
      userId: userId,
    },
  });

  return lists;
}

/**
 *
 * @param {String} userId
 * @returns watchlist for one user
 */
async function getWatchlistwithItems(userId) {
  //find watchlist for user and get all items for each list
  const watchlist = await prisma.list.findFirstOrThrow({
    where: {
      userId: userId,
      isDefault: true,
    },
    include: {
      items: true,
    },
  });

  return watchlist;
}

/**
 * @param {String} userId
 * @param {Int} tmdbId
 * @returns check if comment existing for one item for one user
 */
async function checkIfCommentExisting(userId, tmdbId) {
  //find comment for user and item
  const comment = await prisma.comment.findFirst({
    where: {
      userId: userId,
      tmdbId: tmdbId,
    },
  });

  return comment;
}

module.exports = {
  getListsForConnectedUserProfile,
  getListsForUserProfile,
  getListsForUserWithoutItems,
  getWatchlistwithItems,
  checkIfCommentExisting,
};

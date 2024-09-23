const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const {
  getListsForUserWithoutItems,
  getWatchlistwithItems,
  checkIfCommentExisting,
} = require('../models/list.js');
const { addOrUpdateActivity } = require('../models/activity.js');
const { get } = require('http');
const tmdbApi = require('../tmdb/tmdb.api.js');
const {
  scheduleCommentDeletion,
  scheduleActivityDeletion,
} = require('../utils/scheduleDeletion.js');
const logger = require('../utils/logger.js');

// Create a new list
async function createList(req, res) {
  const { userId, name, description, isPublic, listId } = req.body;
  try {
    if (listId) {
      //update list
      const updatedList = await prisma.list.update({
        where: {
          id: listId,
        },
        data: {
          name: name,
          description: description,
          isPublic: isPublic ?? true,
        },
      });

      res.json(updatedList);
    } else {
      //create list
      const list = await prisma.list.create({
        data: {
          name: name,
          user: {
            connect: { id: userId },
          },
          isPublic: isPublic ?? true,
          description: description,
        },
      });

      res.json(list);
    }
  } catch (error) {
    logger.error('Erreur lors de la création de la liste :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

// add element to a list
async function addItemToList(req, res) {
  const userId = req.user.userId;
  const { listId, tmdbId, media_type } = req.body;
  //don't add if already in the list
  const existingItem = await prisma.item.findFirst({
    where: {
      listId: listId,
      tmdbId: tmdbId,
    },
  });

  if (existingItem) {
    res.status(400).json({ error: 'Item already exists in the list' });
    return;
  }

  try {
    const itemToAdd = await prisma.item.create({
      data: {
        list: {
          connect: { id: listId },
        },
        tmdbId: tmdbId,
        isMovie: media_type === 'movie',
      },
      include: {
        list: {
          select: {
            userId: true,
            isPublic: true,
          },
        },
      },
    });

    const comment = await checkIfCommentExisting(userId, tmdbId);
    if (comment) {
      //modify comment to make scheduled deletion undefined
      await prisma.comment.update({
        where: {
          id: comment.id,
        },
        data: {
          scheduledDeletion: null,
        },
      });
    }

    if (itemToAdd.list.isPublic) {
      const newActivitie = await Promise.all([
        addOrUpdateActivity(itemToAdd.list.userId, 'ITEM_ADDED', itemToAdd.id),
      ]);
      await scheduleActivityDeletion(newActivitie[0].id);
    }
    res.json(itemToAdd);
  } catch (error) {
    logger.error("Erreur lors de l'ajout de l'élément à la liste :", error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

//remove item from watchlist
async function removeItemFromList(req, res) {
  const { listId } = req.body;
  const userId = req.user.userId;
  const tmdbId = parseInt(req.body.tmdbId);

  try {
    // Rechercher l'item avant de le supprimer
    const item = await prisma.item.findFirst({
      where: {
        listId: listId,
        tmdbId: tmdbId,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item non trouvé dans la liste.' });
    }

    // Supprimer l'activité associée à cet item, s'il en existe une
    const activity = await prisma.activity.findFirst({
      where: {
        referenceId: item.id,
        userId: userId,
      },
    });

    if (activity) {
      await prisma.activity.delete({
        where: {
          id: activity.id,
        },
      });
    }

    // Supprimer l'item après avoir traité l'activité
    await prisma.item.delete({
      where: {
        id: item.id,
      },
    });

    return res.json({ message: 'Item supprimé avec succès.' });
  } catch (error) {
    logger.error(
      "Erreur lors de la suppression de l'élément de la liste :",
      error
    );
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

//get all lists from a user
async function getLists(req, res) {
  const userId = req.params.id;
  try {
    const lists = await Promise.all([getListsForUserWithoutItems(userId)]);

    if (lists) {
      res.json(lists);
    } else {
      // Si l'un des deux est indéfini, on considère que c'est une erreur
      res.status(404).json({ error: 'listes non trouvés' });
    }
  } catch (error) {
    // Log l'erreur pour le débogage
    logger.error('Erreur lors de la récupération des listes :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

//get item in watchlist
async function getItemInWatchlist(req, res) {
  const userId = req.params.id;
  const tmdbId = parseInt(req.query.tmdbId);
  try {
    const watchlist = await getWatchlistwithItems(userId);

    if (watchlist) {
      const item = watchlist.items.find((item) => item.tmdbId === tmdbId);
      if (item) {
        res.json(item);
      } else {
        res.status(200).json(null);
      }
    } else {
      res.status(404).json({ error: 'liste non trouvée' });
    }
  } catch (error) {
    logger.error('Erreur lors de la récupération des listes :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

//check if item is in lists of user
async function checkIfIsInLists(req, res) {
  const userId = req.params.id;
  const tmdbId = parseInt(req.query.tmdbId);
  try {
    const lists = await prisma.list.findMany({
      where: {
        userId: userId,
      },
      include: {
        items: true,
      },
    });

    if (lists) {
      const item = lists
        .filter((list) => list.isDefault !== true)
        .map((list) => {
          return list.items.find((item) => item.tmdbId === tmdbId);
        });
      if (item) {
        //dont return null or undefined values
        res.json(item.filter((item) => item));
      } else {
        res.json(null);
      }
    } else {
      res.status(404).json({ error: 'liste non trouvée' });
    }
  } catch (error) {
    logger.error('Erreur lors de la récupération des listes :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function addComment(req, res) {
  const userId = req.params.id;
  const comment = req.body.comment;
  const isMovie = req.body.isMovie;
  const note = parseFloat(req.body.note);
  const tmdbId = parseInt(req.body.tmdbId);

  try {
    //update or create comment
    const existingComment = await prisma.comment.findFirst({
      where: {
        userId: userId,
        tmdbId: tmdbId,
      },
    });

    if (existingComment) {
      const updatedComment = await prisma.comment.update({
        where: {
          id: existingComment.id,
        },
        data: {
          rating: note,
          content: comment,
        },
      });

      const newActivitie = await Promise.all([
        addOrUpdateActivity(
          updatedComment.userId,
          'COMMENT_UPDATE',
          updatedComment.id
        ),
      ]);
      await scheduleActivityDeletion(newActivitie[0].id);

      res.json(updatedComment.id);
    } else {
      const newComment = await prisma.comment.create({
        data: {
          user: {
            connect: { id: userId },
          },
          tmdbId: tmdbId,
          rating: note,
          content: comment,
          isMovie: isMovie,
        },
      });

      const newActivitie = await Promise.all([
        addOrUpdateActivity(
          newComment.userId,
          'COMMENT_CREATED',
          newComment.id
        ),
      ]);
      await scheduleActivityDeletion(newActivitie[0].id);

      res.json(newComment.id);
    }
  } catch (error) {
    logger.error('Erreur lors de la création du commentaire :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function getItemComment(req, res) {
  const userId = req.params.id;
  const tmdbId = parseInt(req.query.tmdbId);
  try {
    const itemComment = await prisma.comment.findMany({
      where: {
        userId: userId,
        tmdbId: tmdbId,
      },
    });
    res.json(itemComment);
  } catch (error) {
    logger.error('Erreur lors de la récupération des commentaires :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function getListById(req, res) {
  const listId = req.params.id;

  try {
    const list = await prisma.list.findUnique({
      where: {
        id: listId,
      },
    });
    res.json(list);
  } catch (error) {
    logger.error('Erreur lors de la récupération de la liste :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function getListAndItemsById(req, res) {
  const listId = req.params.id;
  const { limit = 10, offset = 0 } = req.query;

  try {
    const list = await prisma.list.findUnique({
      where: {
        id: listId,
      },
      include: {
        items: {
          // Appliquer la pagination sur les items
          skip: parseInt(offset),
          take: parseInt(limit),
        },
      },
    });

    return res.json(list);
  } catch (error) {
    logger.error('Erreur lors de la récupération de la liste :', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function getItemById(req, res) {
  const itemId = req.params.id;
  const language = req.detectedLanguage;

  try {
    // Récupération de l'item depuis la base de données
    const item = await prisma.item.findUnique({
      where: { id: itemId },
      include: {
        list: {
          select: { name: true },
        },
      },
    });

    // Si l'item n'existe pas, retourne une erreur 404
    if (!item) {
      // Si l'item n'existe pas, supprimer l'activitée associée
      await prisma.activity.deleteMany({
        where: {
          referenceId: itemId,
        },
      });
      return res.status(204).json();
    }

    let comment = null;

    // Récupération du commentaire selon l'utilisateur
    if (req.user) {
      const connectedUserId = req.user.userId;
      comment = await prisma.comment.findFirst({
        where: {
          tmdbId: item.tmdbId,
          userId: connectedUserId,
        },
      });
    } else {
      const { userId } = req.params;
      comment = await prisma.comment.findFirst({
        where: {
          tmdbId: item.tmdbId,
          userId: userId,
        },
      });
    }

    // Ajout du commentaire (ou null s'il n'existe pas) à l'item
    const itemWithComment = { ...item, comment: comment || null };

    // Ajout des informations de TMDb à l'item
    const response = await tmdbApi.getItemByTmdbId({
      tmdbId: item.tmdbId,
      mediaType: item.isMovie ? 'movie' : 'tv',
      language,
    });

    if (response) {
      itemWithComment.poster_path = response.poster_path;
      itemWithComment.name = item.isMovie ? response.title : response.name;
    }

    // Retourner l'item avec le commentaire et les informations TMDb
    res.json(itemWithComment);
  } catch (error) {
    logger.error("Erreur lors de la récupération de l'item :", error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function getItemsById(req, res) {
  const { ids, userId, filters } = req.query;
  const language = req.detectedLanguage;

  try {
    // Récupération des items depuis la base de données
    if (!ids) {
      return res.status(204).json();
    }

    let items = await prisma.item.findMany({
      where: {
        id: { in: ids },
      },
      include: {
        list: {
          select: { name: true },
        },
      },
    });

    // Si l'item n'existe pas, retourne une erreur 404
    if (!items) {
      return res.status(404).json({ error: 'Item not found' });
    }

    //check filters if media is set
    if (filters.media && filters.media != 'both') {
      if (filters.media === 'movie') {
        items = items.filter((item) => item.isMovie);
      } else if (filters.media === 'tv') {
        items = items.filter((item) => !item.isMovie);
      }
    }

    // Récupération des informations de TMDb pour chaque item
    const itemsWithDetails = await Promise.all(
      items.map(async (item) => {
        const response = await tmdbApi.getItemByTmdbId({
          tmdbId: item.tmdbId,
          mediaType: item.isMovie ? 'movie' : 'tv',
          language,
        });

        // Si le genre de l'item ne correspond pas à l'un des genres filtrés, on l'exclut
        if (filters.genre && response && response.genres) {
          // Récupérer uniquement les IDs de genres dans response.genres
          const itemGenresIds = response.genres.map((genre) => genre.id);

          // Vérifier si au moins un des genres de l'item correspond aux genres filtrés
          const hasMatchingGenre = filters.genre.some((filterGenreId) =>
            itemGenresIds.includes(parseInt(filterGenreId))
          );

          // Si aucun genre ne correspond, retourner null (pour l'exclusion)
          if (!hasMatchingGenre) {
            return null;
          }
        }

        if (response) {
          return {
            ...item,
            poster_path: response.poster_path,
            name: item.isMovie ? response.title : response.name,
          };
        } else {
          return null;
        }
      })
    );

    const filteredItems = itemsWithDetails.filter((item) => item !== null);
    // Convertir filters.rating en nombre si défini
    const ratingThreshold = filters.rating ? parseFloat(filters.rating) : null;

    // Récupération des commentaires pour tous les items en une seule requête
    let comments = [];
    const tmdbIds = filteredItems.map((item) => item.tmdbId);

    if (userId) {
      comments = await prisma.comment.findMany({
        where: {
          tmdbId: { in: tmdbIds },
          userId: userId,
          // Appliquer le filtre rating si ratingThreshold est défini
          ...(ratingThreshold !== null
            ? { rating: { gte: ratingThreshold } }
            : {}),
        },
      });
    } else {
      const connectedUserId = req.user.userId;
      comments = await prisma.comment.findMany({
        where: {
          tmdbId: { in: tmdbIds },
          userId: connectedUserId,
          // Appliquer le filtre rating si ratingThreshold est défini
          ...(ratingThreshold !== null
            ? { rating: { gte: ratingThreshold } }
            : {}),
        },
      });
    }

    // Créer un mapping des commentaires par tmdbId
    const commentsMap = comments.reduce((acc, comment) => {
      acc[comment.tmdbId] = comment;
      return acc;
    }, {});

    // Ajouter les commentaires aux items et filtrer selon rating si nécessaire
    const itemsWithComment = filteredItems
      .map((item) => ({
        ...item,
        comment: commentsMap[item.tmdbId] || null,
      }))
      .filter((item) => {
        // Si ratingThreshold est défini, ne garder que les items avec un commentaire et un rating >= ratingThreshold
        if (ratingThreshold !== null) {
          return item.comment && item.comment.rating >= ratingThreshold;
        }
        return true; // Sinon, garder tous les items
      });

    // Trier les items par rating (rating peut être null, donc on le traite comme 0)
    const sortedItems = itemsWithComment.sort((a, b) => {
      const ratingA = a.comment?.rating || 0;
      const ratingB = b.comment?.rating || 0;
      return ratingB - ratingA; // Tri décroissant
    });

    return res.json(sortedItems);
  } catch (error) {
    logger.error('Erreur lors de la récupération des items :', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function getCommentById(req, res) {
  const commentId = req.params.id;
  const language = req.detectedLanguage;

  try {
    const comment = await prisma.comment.findUnique({
      where: {
        id: commentId,
      },
    });

    if (!comment) {
      return res.status(404).json({ error: 'Commentaire non trouvé' });
    }

    //add poster_path and name to item
    const response = await tmdbApi.getItemByTmdbId({
      tmdbId: comment.tmdbId,
      mediaType: comment.isMovie ? 'movie' : 'tv',
      language,
    });

    if (response) {
      comment.poster_path = response.poster_path;
      comment.itemName = comment.isMovie ? response.title : response.name;
    }

    return res.json(comment);
  } catch (error) {
    logger.error('Erreur lors de la récupération du commentaire :', error);
    return res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function scheduleDeleteComment(req, res) {
  const commentId = req.params.id;
  try {
    await scheduleCommentDeletion(commentId);

    res.json({ message: 'Le commentaire sera supprimé dans une semaine' });
  } catch (error) {
    logger.error('Erreur lors de la suppression du commentaire :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function deleteList(req, res) {
  const userId = req.user.userId;
  const listId = req.params.id;

  try {
    //vérifier si la liste appartient à l'utilisateur
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        userId: userId,
      },
    });

    if (!list) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Récupérer tous les items de la liste à supprimer
    const items = await prisma.item.findMany({
      where: {
        listId: listId,
      },
    });

    // supprimer les activitées liées aux items de la liste
    for (const item of items) {
      await prisma.activity.deleteMany({
        where: {
          referenceId: item.id,
        },
      });
    }

    // Pour chaque item, vérifier s'il est présent dans d'autres listes de l'utilisateur
    for (const item of items) {
      const itemInOtherLists = await prisma.item.findFirst({
        where: {
          tmdbId: item.tmdbId,
          list: {
            userId: userId,
            id: { not: listId }, // Exclure la liste actuelle
          },
        },
      });

      // Si l'item n'est pas présent dans d'autres listes, supprimer le commentaire associé
      if (!itemInOtherLists) {
        const comment = await prisma.comment.findFirst({
          where: {
            tmdbId: item.tmdbId,
            userId: userId,
            isMovie: item.isMovie,
          },
        });
        if (comment) {
          await scheduleCommentDeletion(comment.id);
          await prisma.activity.deleteMany({
            where: {
              referenceId: comment.id,
            },
          });
        }
      }
    }

    // Supprimer tous les items de la liste
    await prisma.item.deleteMany({
      where: {
        listId: listId,
      },
    });

    //Supprimer l'activité liée à la liste
    await prisma.activity.deleteMany({
      where: {
        referenceId: listId,
      },
    });

    // Supprimer la liste
    const deletedList = await prisma.list.delete({
      where: {
        id: listId,
      },
    });

    res.json(deletedList.name);
  } catch (error) {
    logger.error('Erreur lors de la suppression de la liste :', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

module.exports = {
  createList,
  addItemToList,
  getLists,
  getItemInWatchlist,
  removeItemFromList,
  checkIfIsInLists,
  addComment,
  getItemComment,
  getListById,
  getListAndItemsById,
  getItemById,
  getItemsById,
  getCommentById,
  scheduleDeleteComment,
  deleteList,
};

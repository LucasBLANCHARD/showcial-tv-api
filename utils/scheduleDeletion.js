const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const scheduleCommentDeletion = async (commentId) => {
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + 7); // Ajouter 7 jours

  await prisma.comment.update({
    where: { id: commentId },
    data: { scheduledDeletion: deletionDate },
  });
};

const scheduleActivityDeletion = async (activityId) => {
  const deletionDate = new Date();
  deletionDate.setDate(deletionDate.getDate() + 30);

  await prisma.activity.update({
    where: { id: activityId },
    data: { scheduledDeletion: deletionDate },
  });
};

module.exports = { scheduleCommentDeletion, scheduleActivityDeletion };

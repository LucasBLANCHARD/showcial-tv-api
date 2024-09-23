const express = require('express');
const cors = require('cors');
require('dotenv').config();
const i18n = require('./i18n');
var middleware = require('i18next-http-middleware');
const usersRoutes = require('./routes/usersRoutes.js');
const authRoutes = require('./routes/authRoutes.js');
const activityRoutes = require('./routes/activityRoutes.js');
const listRoutes = require('./routes/listRoutes.js');
const mediaRoutes = require('./routes/mediaRoutes.js');
const errorRoutes = require('./routes/errorRoutes.js');
const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const logger = require('./utils/logger.js');
const prisma = new PrismaClient();

const app = express();

//Middleware
app.use(middleware.handle(i18n));
app.use(cors());
app.use(express.json());

// Middleware global pour stocker la langue détectée
app.use((req, res, next) => {
  req.detectedLanguage = req.language; // Stocke la langue détectée dans req.detectedLanguage
  next();
});

//Routes
app.use('/auth', authRoutes);
app.use('/user', usersRoutes);
app.use('/activities', activityRoutes);
app.use('/list', listRoutes);
app.use('/media', mediaRoutes);

// Planification de la suppression différée des commentaires
cron.schedule('0 0 * * *', async () => {
  try {
    const now = new Date();
    // Récupérer tous les commentaires dont la date de suppression est passée
    const commentsToDelete = await prisma.comment.findMany({
      where: {
        scheduledDeletion: {
          lte: now, // less than or equal to now
        },
      },
    });

    //supprimer les activitées liées
    if (commentsToDelete.length > 0) {
      const activityIds = commentsToDelete.map((comment) => comment.id);
      await prisma.activity.deleteMany({
        where: {
          referenceId: {
            in: activityIds,
          },
        },
      });
    }

    // Supprimer les commentaires trouvés
    for (const comment of commentsToDelete) {
      await prisma.comment.delete({
        where: { id: comment.id },
      });
    }

    const activitiesToDelete = await prisma.activity.findMany({
      where: {
        scheduledDeletion: {
          lte: now,
        },
      },
    });

    for (const activity of activitiesToDelete) {
      await prisma.activity.delete({
        where: { id: activity.id },
      });
    }
  } catch (error) {
    logger.error(
      'Erreur lors de la suppression programmée des commentaires :',
      error
    );
  }
});

// Error handling middleware
app.use(errorRoutes);

app.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});

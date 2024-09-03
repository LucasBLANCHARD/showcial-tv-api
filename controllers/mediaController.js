const tmdbApi = require('../tmdb/tmdb.api');

async function research(req, res) {
  try {
    const mediaType = req.params.mediaType;
    const query = req.query.query;
    const page = req.query.page || 1;
    const language = req.detectedLanguage;

    const response = await tmdbApi.mediaSearch({
      query,
      page,
      mediaType,
      language,
    });

    if (response) {
      res.json(response);
    } else {
      res.status(404).json({ error: 'aucun film trouvé' });
    }
  } catch {
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function moviesOfWeek(req, res) {
  try {
    const mediaType = req.params.mediaType;
    const language = req.detectedLanguage;
    const region = req.detectedLanguage;

    const response = await tmdbApi.moviesOfWeekDiscover({
      mediaType,
      language,
      region,
    });

    if (response) {
      res.json(response);
    } else {
      res.status(404).json({ error: 'aucun film trouvé' });
    }
  } catch {
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function popular(req, res) {
  try {
    const mediaType = req.params.mediaType;
    const page = req.query.page || 1;
    const language = req.detectedLanguage;

    const response = await tmdbApi.popular({
      mediaType,
      page,
      language,
    });

    if (response) {
      res.json(response);
    } else {
      res.status(404).json({ error: 'aucun film trouvé' });
    }
  } catch {
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function popularAnimation(req, res) {
  try {
    const mediaType = req.params.mediaType;
    const page = req.query.page || 1;
    const language = req.detectedLanguage;

    const response = await tmdbApi.popularAnimation({
      mediaType,
      page,
      language,
    });

    if (response) {
      res.json(response);
    } else {
      res.status(404).json({ error: 'aucun film trouvé' });
    }
  } catch {
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

async function getItemByTmdbId(req, res) {
  const { tmdbId, mediaType } = req.params;
  const language = req.detectedLanguage;

  try {
    const response = await tmdbApi.getItemByTmdbId({
      tmdbId: tmdbId,
      mediaType: mediaType,
      language,
    });

    if (response) {
      res.json(response);
    } else {
      res.status(404).json({ error: 'aucun film ou série trouvé' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
}

module.exports = {
  research,
  moviesOfWeek,
  popular,
  popularAnimation,
  getItemByTmdbId,
};

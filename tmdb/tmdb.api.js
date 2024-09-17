const axios = require('axios');
const API_TMDB = require('./tmdb.config.js');
const getLastMondayAndNextSunday = require('./../utils/dates.js');
const {
  normalizeLanguage,
  normalizeRegion,
} = require('./../utils/normalize.js');

const tmdbApi = {
  mediaSearch: async ({ query, page, mediaType, language }) => {
    API_TMDB.url = `https://api.themoviedb.org/3/search/${mediaType}`;
    API_TMDB.params = {};
    API_TMDB.params.query = query;
    API_TMDB.params.page = page;
    API_TMDB.params.language = normalizeLanguage(language);

    const response = await axios.request(API_TMDB);

    return response.data;
  },

  moviesOfWeekDiscover: async ({ language, region, mediaType }) => {
    const { lastMonday, nextSunday } = getLastMondayAndNextSunday();
    API_TMDB.url = `https://api.themoviedb.org/3/discover/${mediaType}`;
    API_TMDB.params = {};
    API_TMDB.params.language = normalizeLanguage(language);
    if (mediaType === 'movie') {
      API_TMDB.params.region = normalizeRegion(region);
      API_TMDB.params['release_date.gte'] = lastMonday;
      API_TMDB.params['release_date.lte'] = nextSunday;
      API_TMDB.params.with_release_type = '3 | 4';
    } else {
      API_TMDB.params['air_date.gte'] = lastMonday;
      API_TMDB.params['air_date.lte'] = nextSunday;
      API_TMDB.params.watch_region = normalizeRegion(region);
      API_TMDB.params.with_watch_monetization_types = 'flatrate|free|ads';
    }

    const response = await axios.request(API_TMDB);

    return response.data;
  },

  popular: async ({ mediaType, page, language }) => {
    API_TMDB.url = `https://api.themoviedb.org/3/${mediaType}/popular`;
    API_TMDB.params = {};
    API_TMDB.params.page = page;
    API_TMDB.params.language = normalizeLanguage(language);

    const response = await axios.request(API_TMDB);

    return response.data;
  },

  popularAnimation: async ({ mediaType, page, language }) => {
    API_TMDB.url = `https://api.themoviedb.org/3/discover/${mediaType}`;
    API_TMDB.params = {};
    API_TMDB.params.page = page;
    API_TMDB.params.language = normalizeLanguage(language);
    API_TMDB.params['with_genres'] = '16';

    const response = await axios.request(API_TMDB);

    return response.data;
  },

  getBackdropPath: async ({ tmdbId, mediaType, language }) => {
    API_TMDB.url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}`;
    API_TMDB.params = {};
    API_TMDB.params.language = normalizeLanguage(language);

    const response = await axios.request(API_TMDB);

    return response.data.poster_path;
  },

  getItemByTmdbId: async ({ tmdbId, mediaType, language }) => {
    API_TMDB.url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}`;
    API_TMDB.params = {};
    API_TMDB.params.language = normalizeLanguage(language);

    try {
      const response = await axios.request(API_TMDB);
      if (response.status === 200) {
        return response.data;
      } else {
        return null;
      }
    } catch (error) {
      if (error.response.status === 404) {
        return null;
      }
    }
  },

  getWatchProviders: async ({ tmdbId, mediaType, language }) => {
    API_TMDB.url = `https://api.themoviedb.org/3/${mediaType}/${tmdbId}/watch/providers`;
    API_TMDB.params = {};
    const region = normalizeRegion(language);

    const response = await axios.request(API_TMDB);
    const watchProviders = response.data.results[region];

    return watchProviders;
  },
};

module.exports = tmdbApi;

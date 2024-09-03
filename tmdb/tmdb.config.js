const baseUrl = process.env.TMDB_BASE_URL;
const key = process.env.TMDB_KEY;

const API_TMDB = {
  method: 'GET',
  url: baseUrl,
  params: {},
  headers: {
    accept: 'application/json',
    Authorization: key,
  },
};

module.exports = API_TMDB;

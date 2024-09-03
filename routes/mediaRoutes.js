var express = require('express');
const {
  research,
  moviesOfWeek,
  popular,
  popularAnimation,
  getItemByTmdbId,
} = require('../controllers/mediaController.js');
var router = express.Router();

router.get('/:mediaType/research', research);
router.get('/:mediaType/movies-of-week', moviesOfWeek);
router.get('/:mediaType/popular', popular);
router.get('/:mediaType/popular-animation', popularAnimation);
router.get('/:mediaType/:tmdbId', getItemByTmdbId);

module.exports = router;

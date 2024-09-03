var express = require('express');
const { errorHandler } = require('../middlewares/errorHandler.js');
var router = express.Router();

router.get('/error', errorHandler);

module.exports = router;

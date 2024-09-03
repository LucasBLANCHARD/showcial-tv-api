const { ValidationError } = require('express-validator');
const { CustomError } = require('../helpers/customError.js');
const logger = require('../utils/logger.js');

const errorHandler = (err, req, res, next) => {
  // Si l'erreur est une instance de ValidationError (provenant d'express-validator)
  if (err instanceof ValidationError) {
    return res.status(400).json({ error: err.array() });
  }

  // Si l'erreur est une instance de CustomError (une erreur personnalisée)
  if (err instanceof CustomError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  // Si ce n'est pas une erreur connue, renvoyer une erreur 500 (Internal Server Error)
  logger.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
};

module.exports = { errorHandler };

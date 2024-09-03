const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');
const logger = require('../utils/logger');

const authenticateUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user; // Attacher les infos de l'utilisateur à la requête
    next();
  } catch (error) {
    logger.error('JWT Verification Error:', error.message);
    return res.status(403).json({ message: 'Forbidden' });
  }
};

module.exports = { authenticateUser };

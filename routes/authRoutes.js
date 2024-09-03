const express = require('express');
const {
  signup,
  login,
  changePassword,
} = require('../controllers/authController.js');
const { authenticateUser } = require('../middlewares/authController.js');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/change-password', authenticateUser, changePassword);

module.exports = router;

const express = require('express');
const {
  getActivities,
  addFollow,
  removeFollow,
} = require('../controllers/activityController.js');
const { authenticateUser } = require('../middlewares/authController.js');
const router = express.Router();

//get
router.get('/', authenticateUser, getActivities);

//post
router.post('/follow', authenticateUser, addFollow);

//delete
router.delete('/unfollow', authenticateUser, removeFollow);

module.exports = router;

var express = require('express');
const {
  getUserLists,
  getUsersByUsername,
  getFollowers,
  getFollowings,
  deleteAccount,
} = require('../controllers/userController.js');
const { authenticateUser } = require('../middlewares/authController.js');
var router = express.Router();

// Routes related to user followers
router.get('/profile/followers', authenticateUser, getFollowers);
router.get('/profile/followings', authenticateUser, getFollowings);
router.get('/profile/:userId/followers', getFollowers);
router.get('/profile/:userId/followings', getFollowings);

// Routes related to user profile
router.get('/profile', authenticateUser, getUserLists);
router.get('/:username', authenticateUser, getUsersByUsername);
router.get('/profile/:userId', authenticateUser, getUserLists);

//delete user
router.delete('/delete-account', authenticateUser, deleteAccount);

module.exports = router;

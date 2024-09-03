var express = require('express');
const {
  createList,
  addItemToList,
  getLists,
  getItemInWatchlist,
  removeItemFromList,
  checkIfIsInLists,
  addComment,
  getItemComment,
  getListById,
  getItemById,
  getItemsById,
  getCommentById,
  getListAndItemsById,
  scheduleDeleteComment,
  deleteList,
} = require('../controllers/listController.js');
const { authenticateUser } = require('../middlewares/authController.js');
var router = express.Router();

//get
router.get('/getListById/:id', getListById);
router.get('/getListAndItemsById/:id', getListAndItemsById);
router.get('/getItemById/:id', authenticateUser, getItemById);
router.get('/getItemsById', authenticateUser, getItemsById);
router.get('/getCommentById/:id', getCommentById);
router.get('/getLists/:id', getLists);
router.get('/getItemInWatchList/:id', getItemInWatchlist);
router.get('/checkIfIsInLists/:id', checkIfIsInLists);
router.get('/getItemComment/:id', getItemComment);

//post
router.post('/createList', createList);
router.post('/addItemToList', authenticateUser, addItemToList);
router.post('/addComment/:id', addComment);
router.post('/deleteComment/:id', scheduleDeleteComment);

//delete
router.delete('/removeItemFromList', authenticateUser, removeItemFromList);
router.delete('/deleteList/:id', authenticateUser, deleteList);

module.exports = router;

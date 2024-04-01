const express = require("express");
const { connection } = require("../connection");
const { ViewUserProfile,
  UpdateUserInfo,
  SearchBySkill,
  deleteUser,
  createUser,
  ViewCurrentUserProfile }= require('../controllers/user')

  const {  authenticateTokenHandler }  = require('../auth/auth');
const router= express.Router();
router.use(express.json());

router.delete('/DeleteAccount', authenticateTokenHandler,deleteUser);

router.put('/updateUserInfo',authenticateTokenHandler, UpdateUserInfo );

router.get('/BySkill',SearchBySkill);

router.get('/:userID/adminPrevillage',authenticateTokenHandler,ViewUserProfile);

router.get('/Profile',authenticateTokenHandler,ViewCurrentUserProfile);

router.post('/newUser',createUser);

module.exports=router;
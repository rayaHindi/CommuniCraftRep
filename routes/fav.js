const mysql = require('mysql');
const express = require('express');
const router=express.Router()

const { connection } = require('../connection');
const { authenticateTokenHandler }  = require('../controllers/project');
const {getFavProjects,removeFromFav} = require ('../controllers/fav');

router.get('/fav/list',authenticateTokenHandler,getFavProjects);
router.delete('/fav/:projectID',authenticateTokenHandler,removeFromFav); //remove from fav

module.exports=router;


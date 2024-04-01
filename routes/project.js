const mysql = require('mysql');
const express = require('express');
const router=express.Router()

const { connection } = require('../connection');
const { get_project,  delete_project, add_project,addToFav,
    finishedProjects, projectSharing, getAllprojects,updateProject,
      authenticateTokenHandler,checkProjectMembership,
      rateProject,  commentOnProject, checkTokenPresence, deleteComment
     }  = require('../controllers/project');

const {createIdea,
  // updateIdea,
  getIdeas,deleteIdea
  } =require('../controllers/idea');
router.use(express.json());

router.post('/newProject', add_project);

router.delete('/:projectID',authenticateTokenHandler, delete_project )

router.get('', get_project);

router.post('/:projectID/fav',authenticateTokenHandler,addToFav);

//////////////ideas
router.post('/:projectID/createIdea',createIdea);

router.get('/:projectID/ideas/list',getIdeas);

router.delete('/:projectID/ideas/:ideaID',deleteIdea);

///////////////////////////
//get all projects
router.get('/list', getAllprojects );

//update project details :
router.put('/:projectID', authenticateTokenHandler, checkProjectMembership, updateProject);

// Get all finished projects
router.get('/finished', finishedProjects);

//share finished projects
router.post('/share',authenticateTokenHandler,projectSharing);

router.post('/:projectId/ratings',checkTokenPresence, authenticateTokenHandler,rateProject);
router.post('/:projectId/comments',checkTokenPresence, authenticateTokenHandler,commentOnProject);
router.delete('/:projectId/comments/:commentId', authenticateTokenHandler, deleteComment);

  module.exports=router;
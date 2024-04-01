const mysql = require('mysql');
const express = require('express');
const router=express.Router()
const { connection } = require('../connection');
router.use(express.json());

const {addTask,assignTask,updateTaskStatus,deleteTask, getProjectTasks} = require('../controllers/task')

const { authenticateTokenHandler,checkProjectMembership }  = require('../controllers/project');

router.get('/project/:projectID/task/list',authenticateTokenHandler,checkProjectMembership,getProjectTasks);

router.post('/project/:projectID/task/newTask',authenticateTokenHandler, checkProjectMembership, addTask);

router.put('/project/:projectID/task/:taskID/taskManager', authenticateTokenHandler, checkProjectMembership,assignTask);

router.put('/project/:projectID/task/:taskID/taskStatus',authenticateTokenHandler, checkProjectMembership, updateTaskStatus);

router.delete('/project/:projectID/task/:taskID',authenticateTokenHandler, checkProjectMembership, deleteTask);

module.exports=router;
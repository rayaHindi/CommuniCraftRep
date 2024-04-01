const express = require('express');
        const router = express.Router();
        const { connection } = require('../connection');

const { authenticateTokenHandler, 
    checkToolOwnership,

     getAllTools,
      addTool,
      updateTool, 
      deleteTool } 
= require('../controllers/tools');


// GET request for retrieving all tools with owner username for all users
router.get('/tools',getAllTools );

//add new resource
router.post('/tools', authenticateTokenHandler, addTool);
//update tools info
router.put('/tools/:id', authenticateTokenHandler,checkToolOwnership,updateTool);
//delete a specific tool by its id

router.delete('/tools/:id', authenticateTokenHandler,  checkToolOwnership,deleteTool);
module.exports = router;
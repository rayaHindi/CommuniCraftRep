const express = require('express');
        const router = express.Router();
        const { connection } = require('../connection');

const { checkMaterialOwnership,
     getAllMaterials, 
    addMaterial, 
    updateMaterial,
     deleteMaterial,
    authenticateTokenHandler } = require('../controllers/materials');

// GET request for retrieving all materials with owner username for all users
router.get('/materials',getAllMaterials );

//add new material
router.post('/materials', authenticateTokenHandler, addMaterial);
//update 
router.put('/materials/:id', authenticateTokenHandler, checkMaterialOwnership,updateMaterial);
//delete
router.delete('/materials/:id', authenticateTokenHandler, checkMaterialOwnership,deleteMaterial); 
module.exports = router;
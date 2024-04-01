
//materials controller : 
const { connection } = require('../connection');


const { authenticateTokenHandler } = require('../auth/auth');
// Check material ownership
const checkMaterialOwnership = (req, res, next) => {
    const materialId = req.params.id;
    const userId = req.user.ID;

    const query = 'SELECT * FROM materials WHERE id = ? AND userID = ?';
    connection.query(query, [materialId, userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(403).json({ message: 'You are not authorized to access this material' });
        }
        next();
    });
};

// Get all materials
const getAllMaterials = (req, res) => {
    let orderBy = req.query.orderBy || 'name'; 
    let sortOrder = req.query.sortOrder || 'ASC'; 
    let searchTerm = req.query.name || ''; 

    let sqlQuery = `SELECT m.*, u.userName AS owner FROM materials AS m INNER JOIN user AS u ON m.userID = u.userID`;

    if (searchTerm !== '') {
        sqlQuery += ` WHERE m.name LIKE '%${searchTerm}%'`;
    }

    sqlQuery += ` ORDER BY m.${orderBy} ${sortOrder}`;
    
    connection.query(sqlQuery, (error, results) => {
        if (error) {
            console.error('Error fetching materials:', error);
            return res.status(500).send('Error fetching materials');
        } else {
            if (results.length === 0) {
                return res.status(404).json({ message: 'No materials found. You can add a new material if you want.' });
            }
            res.status(200).json(results);
        }
    });
};

// Add new material
const addMaterial = (req, res) => {
    const { name, unit_price, quantity_available } = req.body;
    const userId = req.user.ID;

    const sqlQuery = 'INSERT INTO materials (name, unit_price, quantity_available, userID) VALUES (?, ?, ?, ?)';
    connection.query(sqlQuery, [name, unit_price, quantity_available, userId], (error, results) => {
        if (error) {
            console.error('Error adding material:', error);
            res.status(500).send('Error adding material');
        } else {
            res.status(201).send('Material added successfully');
        }
    });
};

// Update material
const updateMaterial = (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: 'Invalid request, request body is missing' });
    }
    
    const { name, unit_price, quantity_available } = req.body;
    const materialId = req.params.id;
    
    // Initialize an array to hold the fields and values to update
    const updateFields = [];
    const fieldValues = [];
    
    // Check each field and add it to the updateFields array if it is provided
    if (name !== undefined) {
        updateFields.push('name = ?');
        fieldValues.push(name);
    }
    if (unit_price !== undefined) {
        updateFields.push('unit_price = ?');
        fieldValues.push(unit_price);
    }
    if (quantity_available !== undefined) {
        updateFields.push('quantity_available = ?');
        fieldValues.push(quantity_available);
    }
    
    if (updateFields.length === 0) {
        return res.status(400).json({ message: 'No fields provided for update' });
    }

    // SQL update query based on the provided fields
    const updateQuery = `UPDATE materials SET ${updateFields.join(', ')} WHERE id = ?`;
    fieldValues.push(materialId);
    
    connection.query(updateQuery, fieldValues, (err, results) => {
        if (err) {
            console.error('Error updating material:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.affectedRows > 0) {
            res.status(200).json({ message: 'Material updated successfully' });
        } else {
            // No rows affected means the material ID doesn't exist
            res.status(404).json({ message: 'Material not found' });
        }
    });
};

// Delete material
const deleteMaterial = (req, res) => {
    const materialId = req.params.id;

    const deleteQuery = 'DELETE FROM materials WHERE id = ?';
    connection.query(deleteQuery, [materialId], (error, results) => {
        if (error) {
            console.error('Error deleting material:', error);
            res.status(500).send('Error deleting material');
        } else {
            res.status(200).send('Material deleted successfully');
        }
    });
};

module.exports = { checkMaterialOwnership, getAllMaterials, addMaterial, updateMaterial, deleteMaterial,authenticateTokenHandler };


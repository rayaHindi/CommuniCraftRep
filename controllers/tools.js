// toolsController.js
const { connection } = require('../connection');
const { authenticateTokenHandler } = require('../auth/auth');
// Check tool ownership
const checkToolOwnership = (req, res, next) => {
    const toolId = req.params.id;
    const userId = req.user.ID;

    const query = 'SELECT * FROM tools WHERE id = ? AND userID = ?';
    connection.query(query, [toolId, userId], (err, results) => {
        if (err) {
            console.error('Error executing query:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.length === 0) {
            return res.status(403).json({ message: 'You are not authorized to access this tool' });
        }
        next();
    });
};

// Get all tools
const getAllTools = (req, res) => {
    let orderBy = req.query.orderBy || 'name'; 
    let sortOrder = req.query.sortOrder || 'ASC'; 
    let searchTerm = req.query.name || '';

    let sqlQuery = `SELECT * FROM tools`;

    // Add search condition if a name search term is provided
    if (searchTerm !== '') {
        sqlQuery += ` WHERE name LIKE '%${searchTerm}%'`;
    }

    // Add ordering
    sqlQuery += ` ORDER BY ${orderBy} ${sortOrder}`;
    
    connection.query(sqlQuery, (error, results) => {
        if (error) {
            console.error('Error fetching tools:', error);
            return res.status(500).send('Error fetching tools');
        } else {
            if (results.length === 0) {
                return res.status(404).json({ message: 'No tools found. You can add a new tool if you want.' });
            }
            res.status(200).json(results);
        }
    });
};
// Add new tool
const addTool = (req, res) => {
    const { name, unit_price, quantity_available } = req.body;
    const userId = req.user.ID;

    const sqlQuery = 'INSERT INTO tools (name, unit_price, quantity_available, userID) VALUES (?, ?, ?, ?)';
    connection.query(sqlQuery, [name, unit_price, quantity_available, userId], (error, results) => {
        if (error) {
            console.error('Error adding tool:', error);
            res.status(500).send('Error adding tool');
        } else {
            res.status(201).send('Tool added successfully');
        }
    });
};

// Update tool
const updateTool = (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: 'Invalid request, request body is missing' });
    }
    
    const { name, unit_price, quantity_available } = req.body;
    const toolId = req.params.id;
    
    const updateFields = [];
    const fieldValues = [];
    
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

    const updateQuery = `UPDATE tools SET ${updateFields.join(', ')} WHERE id = ?`;
    fieldValues.push(toolId);
    
    connection.query(updateQuery, fieldValues, (err, results) => {
        if (err) {
            console.error('Error updating tool:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        if (results.affectedRows > 0) {
            res.status(200).json({ message: 'Tool updated successfully' });
        } else {
            res.status(404).json({ message: 'Tool not found' });
        }
    });
};
// Delete tool
const deleteTool = (req, res) => {
    const toolId = req.params.id;

    const deleteQuery = 'DELETE FROM tools WHERE id = ?';
    connection.query(deleteQuery, [toolId], (error, results) => {
        if (error) {
            console.error('Error deleting tool:', error);
            res.status(500).send('Error deleting tool');
        } else {
            res.status(200).send('Tool deleted successfully');
        }
    });
};

module.exports = {authenticateTokenHandler, checkToolOwnership, checkToolOwnership ,getAllTools, addTool, updateTool, deleteTool };

const {connection} = require("../connection");
//const {checkProjectMembership} = require('./project.js');


const createIdea = (req, res) => {
    const projectID = req.params.projectID;

    const {describtion } = req.body;

    // Check if description is missing
    if (!describtion) {
        return res.status(400).json({ message: 'Description is required' });
    }


    // Insert the new idea into the database
    const query = 'INSERT INTO ideas (describtion, projectID) VALUES (?, ?)';
    connection.query(query, [describtion, projectID], (err, results) => {
        if (err) {
            console.error('Error creating idea', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        return res.status(201).json({ message: 'Idea created successfully', ideaID: results.insertId });
    });
};

const getIdeas = (req, res) => {

    const projectID = req.params.projectID;

    const query = 'SELECT * FROM ideas WHERE projectID = ?';
    connection.query(query, [projectID], (err, results) => {
        if (err) {
            console.error('Error retrieving ideas', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        return res.status(200).json({ ideas: results });
    });
};

const deleteIdea = (req, res) => {
    
    const ideaID = req.params.ideaID;

    const query = 'DELETE FROM ideas WHERE ID = ?';
    connection.query(query, [ideaID], (err, results) => {
        if (err) {
            console.error('Error deleting idea', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Idea not found' });
        }

        return res.status(200).json({ message: 'Idea deleted successfully' });
    });
};

module.exports = {createIdea,
     getIdeas,
     deleteIdea};

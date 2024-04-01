const mysql = require('mysql');
const { connection } = require('../connection');
const {getUserID} = require('./task')
const {checkProjectID} = require('../controllers/task');



const getFavProjects=(req, res) => {
    const userID= req.user.ID;
    console.log(userID);
    const query = `
    SELECT project.* FROM project JOIN user_favproject ON project.projectID = user_favproject.projectID WHERE user_favproject.userID = ?`;
        connection.query(query,[userID], (error, results) => {
        if (error) {
            console.error('Error getting projects:', error);
            res.status(500).send('Error getting projects');
        } else {
            if (results.length > 0) {
                res.status(200).json(results);
            } else {
                res.status(404).send('No projects found');
            }
        }
    });
}

const checkFavoriteProject = (userID, projectID) => {
    return new Promise((resolve, reject) => {
        const checkQuery = 'SELECT * FROM user_favproject WHERE userID = ? AND projectID = ?';
        connection.query(checkQuery, [userID, projectID], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results.length > 0);
            }
        });
    });
};

const removeFromFav = async (req, res) => {
    const projectID = req.params.projectID;
    const userID = req.user.ID;

    try {
        const projectExists = await checkFavoriteProject(userID, projectID);
        if (!projectExists) {
            return res.status(404).json({ error: 'Project not found in favorites list' });
        }

        const deleteQuery = 'DELETE FROM user_favproject WHERE userID = ? AND projectID = ?';
        connection.query(deleteQuery, [userID, projectID], (err, deleteResult) => {
            if (err) {
                console.error('Error:', err);
                return res.status(500).json({ error: 'Internal Server Error' });
            }
            
            if (deleteResult.affectedRows === 0) {
                return res.status(404).json({ error: 'Project not found in favorites list' });
            }

            res.status(200).json({ message: `Project with ID ${projectID} removed successfully from Fav list` });
        });
    
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

module.exports={getFavProjects,removeFromFav};
const mysql = require('mysql');
const { connection } = require('../connection');
const {getUserID} = require('./task')

const { sendEmail } = require('../services/emailService');
const { authenticateTokenHandler } = require('../auth/auth');
const {checkProjectID} = require('../controllers/task');

function gatherUserData(projectID, res, responseData) {
    connection.query('SELECT userID FROM user_project WHERE projectID = ?', [projectID], (err, userProjectResult) => {
        if (err) {
            console.error(err);
            res.status(500).json({ error: 'An error occurred while retrieving user project data' });
            return;
        }

        if (userProjectResult.length > 0) {
            const userIDs = userProjectResult.map(row => row.userID);

            connection.query('SELECT userName FROM user WHERE userID IN (?)', [userIDs], (err, userResult) => {
                if (err) {
                    console.error(err);
                    res.status(500).json({ error: 'An error occurred while retrieving user names' });
                    return;
                }

                const userNames = userResult.map(row => row.userName);
                responseData.userNames = userNames;
                res.status(200).json(responseData);
            });
        } else {
            res.status(200).json(responseData);
        }
    });
}
function insertUserProject(projectID, userName) {
    return new Promise((resolve, reject) => {
        getUserID(userName)
            .then(userID => {
                if (!userID) {
                    reject(new Error('User ID not available'));
                }
                connection.query('INSERT INTO user_project (projectID, userID) VALUES (?, ?)', [projectID, userID], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            })
            .catch(reject);
    });
}
const get_project= (req, res) => {
    let { projectID, projectName, userName } = req.query;
    let responseData = {};

    if (projectID) {
        connection.query('SELECT * FROM project WHERE projectID = ?', [projectID], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'An error occurred while retrieving the project' });
                return;
            }

            if (result.length === 0) {
                res.status(404).json({ error: 'Project not found' });
                return;
            }
            responseData.project = result[0];

            // Call the function to gather user data
            gatherUserData(projectID, res, responseData);
        });
    } // of projectID
    else if (projectName) {
        connection.query('SELECT * FROM project WHERE projectName = ?', [projectName], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'An error occurred while retrieving the project' });
                return;
            }

            if (result.length === 0) {
                res.status(404).json({ error: 'Project not found' });
                return;
            }

            // If project name found, get project ID
            const projectID = result[0].projectID;
            responseData.project = result[0];

            // Call the function to gather user data
            gatherUserData(projectID, res, responseData);
        });
    }
    else if (userName) {
            connection.query('SELECT project.* FROM project JOIN user_project ON project.projectID = user_project.projectID JOIN user ON user_project.userID = user.userID WHERE user.userName = (?)', [userName], (err, result) => {
            if (err) {
                console.error(err);
                res.status(500).json({ error: 'An error occurred while retrieving username' });
                return;
            }

            if (result.length === 0) {
                res.status(404).json({ error: 'There are no projects' });
                return;
            }

            res.status(200).json({ projects: result });

        });
    }
    ////
    else{
        res.status(404).json({ error: 'Project not found' });
        return;
    }
}

const delete_project= async (req , res) => {
    const projectID= req.params.projectID;

    const userId = req.user.ID; // Assuming the user ID is available in the request

    // Check if the user making the request is an admin
    const adminQuery = 'SELECT admin FROM user WHERE userID = ?';
    connection.query(adminQuery, [userId], (adminError, adminResult) => {
        if (adminError) {
            console.error('Error checking user admin status:', adminError);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const isAdmin = adminResult[0].admin === 1;

        if (!isAdmin) {
            return res.status(403).json({ error: 'Unauthorized access: Only admin users can share projects' });
        }
    })
    try{
        const selectResult = await new Promise((resolve, reject) => {
            connection.query('SELECT * FROM project WHERE projectID = ? ', [projectID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        if (selectResult.length > 0) {
            const projectDeleteResult1 = await new Promise((resolve, reject) => {
                connection.query('DELETE FROM user_project WHERE projectID = ? ', [projectID], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
        
            const projectDeleteResult2 = await new Promise((resolve, reject) => {
                connection.query('DELETE FROM project WHERE projectID = ? ', [projectID], (err, result) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(result);
                    }
                });
            });
            res.status(200).json({ message: `project with ID ${projectID} deleted successfully` });
        
        } else {
            // Handle the case where no project is found with the specified projectName
            res.status(404).json({ error: 'No project found with the specified projectName' });

        }
    
    }//try
    catch(error){
        console.error('Error:', error);
        res.status(500).json({ error: 'No project found with the specified projectName' });
    }
    }

const add_project= async (req, res) => {
    try {
        let projectID = -1;
        const { projectName, groupSize, type, material, category, userNames,description  } = req.body;

        // Loop through each username
        const usersExist = [];//array to store if usernames exist
        for (const userName of userNames) {
            const userID = await getUserID(userName);// reuse the function
            const exists = userID !== null;
            usersExist.push(exists);
            }

        if (usersExist.includes(false)) {
            return res.status(404).json({ error: 'One or more usernames do not exist' });
            }
        
        // Insert
        const projectInsertResult = await new Promise((resolve, reject) => {
            connection.query('INSERT INTO project (projectName, groupSize, material, category,description) VALUES (?, ?, ?, ?, ?)', [projectName, groupSize, material, category, description], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });

        projectID = projectInsertResult.insertId;
        console.log('New project inserted successfully with ID:', projectID);

        await Promise.all(userNames.map(userName => insertUserProject(projectID, userName))); //mapping each username given
        console.log('New project-user relationships inserted successfully');

        res.status(201).json({ message: 'New project inserted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
//////////////leen's///////////////

// Get all projects
const getAllprojects = (req, res) => {
    const sqlQuery = 'SELECT * FROM project';
    connection.query(sqlQuery, async (error, projects) => {
        if (error) {
            console.error('Error getting projects:', error);
            return res.status(500).send('Error getting projects');
        } else if (projects.length > 0) {
            try {
                const projectsWithDetails = await Promise.all(projects.map(async (project) => {
                    // Fetch comments for the project
                    const commentsQuery = `
                        SELECT c.comment, u.userName AS username 
                        FROM comments c
                        JOIN user u ON c.userID = u.userID
                        WHERE projectID = ?`;
                    const comments = await new Promise((resolve, reject) => {
                        connection.query(commentsQuery, [project.projectID], (err, commentsResult) => {
                            if (err) reject(err);
                            else resolve(commentsResult.length ? commentsResult : [{ comment: 'No comments yet' }]);
                        });
                    });

                    // Fetch ratings for the project
                    const ratingsQuery = `
                        SELECT r.rating, u.userName AS username
                        FROM ratings r
                        JOIN user u ON r.userID = u.userID
                        WHERE projectID = ?`;
                    const ratings = await new Promise((resolve, reject) => {
                        connection.query(ratingsQuery, [project.projectID], (err, ratingsResult) => {
                            if (err) reject(err);
                            else resolve(ratingsResult.length ? ratingsResult : [{ rating: 'No ratings yet'}]);
                        });
                    });

                    return { ...project, comments, ratings }; // Combine project info with comments and ratings
                }));

                res.status(200).json(projectsWithDetails);
            } catch (err) {
                console.error('Error fetching project details:', err);
                res.status(500).send('Failed to fetch project details');
            }
        } else {
            res.status(404).send('No projects found');
        }
    });
};

//middleware to authenticate token
const checkProjectMembership = (req, res, next) => {
    const projectId = req.params.projectID;
    const userId = req.user.ID; // 'ID' should match the property in the JWT payload
    console.log(userId);

    const projectQuery = 'SELECT * FROM project WHERE projectID = ?';
    connection.query(projectQuery, [projectId], (projectErr, projectResults) => {
        if (projectErr) {
            console.error('Error checking project:', projectErr);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (projectResults.length === 0) {
            return res.status(404).json({ message: 'Project not found' });
        }

        const userProjectQuery = 'SELECT * FROM user_project WHERE projectID = ? AND userID = ?';
        connection.query(userProjectQuery, [projectId, userId], (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (results.length === 0) {
                return res.status(403).json({ message: "User is not authorized to make changes to this project." });
            }
            next(); // User is authorized
        });
    });
}
//////////////////////////////////////////
//update projects 
const updateProject=(req, res) => {
        if (!req.body) {
            return res.status(400).json({ message: 'Invalid request, request body is missing' });
        }
        
        const { projectName, groupSize, type, material, category, status, description} = req.body;
        const projectId = req.params.projectID;
        
        const updateFields = [];
        const fieldValues = [];
        
        if (projectName !== undefined) {
            updateFields.push('projectName = ?');
            fieldValues.push(projectName);
        }
        if (groupSize !== undefined) {
            updateFields.push('groupSize = ?');
            fieldValues.push(groupSize);
        }
        if (type !== undefined) {
            updateFields.push('type = ?');
            fieldValues.push(type);
        }
        if (material !== undefined) {
            updateFields.push('material = ?');
            fieldValues.push(material);
        }
        if (category !== undefined) {
            updateFields.push('category = ?');
            fieldValues.push(category);
        }
        if (status !== undefined) {
            updateFields.push('status = ?');
            fieldValues.push(status);
        }
        if (description !== undefined) {
            updateFields.push('description = ?');
            fieldValues.push(description);
        }
        //SQL update query based on the provided fields
        const updateQuery = `UPDATE project SET ${updateFields.join(', ')} WHERE projectID = ?`;
        fieldValues.push(projectId);
        
        connection.query(updateQuery, fieldValues, (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (results.affectedRows > 0) {
                res.status(200).json({ message: 'Project updated successfully' });
            } else {
                res.status(404).json({ message: 'Project not found' });
            }
        });
}
////////////////////////////////////////////

const executeQuery = (sql, values) => {
    return new Promise((resolve, reject) => {
        connection.query(sql, values, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

const addToFav = async (req, res) => {
    const projectID = req.params.projectID;
    const userID = req.user.ID; 

    try {
        const existingProjectID = await checkProjectID(projectID);
        if (!existingProjectID) {
            res.status(404).send('Project not found');
            return;
        }

        // check if already added
        const favResults = await executeQuery('SELECT * FROM user_favproject WHERE userID = ? AND projectID = ?', [userID, projectID]);

        if (favResults.length > 0) {
            res.status(400).send('Project already added as favorite');
            return;
        }

        const addFavoriteQuery = 'INSERT INTO user_favproject (userID, projectID) VALUES (?, ?)';
        await executeQuery(addFavoriteQuery, [userID, projectID]);

        res.status(200).send('Project added to favorites successfully');
    } catch (error) {
        console.error('Error adding favorite project:', error);
        res.status(500).send('Error adding favorite project');
    }
};


////////////////////////////////////////////
//get finished projects in controller 
const finishedProjects = (req, res) => {
    const sqlQuery = 'SELECT * FROM project WHERE status = "finished"';
    connection.query(sqlQuery, async (error, projects) => {
        if (error) {
            console.error('Error getting finished projects:', error);
            return res.status(500).send('Error getting finished projects');
        } else if (projects.length > 0) {
            try {
                const projectsWithDetails = await Promise.all(projects.map(async (project) => {
                    // Fetch comments for the project
                    const commentsQuery = `
                        SELECT c.comment, u.userName AS username 
                        FROM comments c
                        JOIN user u ON c.userID = u.userID
                        WHERE c.projectID = ?`;
                    const comments = await new Promise((resolve, reject) => {
                        connection.query(commentsQuery, [project.projectID], (err, commentsResult) => {
                            if (err) reject(err);
                            else resolve(commentsResult.length ? commentsResult : [{ comment: 'No comments yet' }]);
                        });
                    });

                    // Fetch ratings for the project
                    const ratingsQuery = `
                        SELECT r.rating, u.userName AS username
                        FROM ratings r
                        JOIN user u ON r.userID = u.userID
                        WHERE r.projectID = ?`;
                    const ratings = await new Promise((resolve, reject) => {
                        connection.query(ratingsQuery, [project.projectID], (err, ratingsResult) => {
                            if (err) reject(err);
                            else resolve(ratingsResult.length ? ratingsResult : [{ rating: 'No ratings yet' }]);
                        });
                    });

                    return { ...project, comments, ratings }; // Combine project info with comments and ratings
                }));

                res.status(200).json(projectsWithDetails);
            } catch (err) {
                console.error('Error fetching project details:', err);
                res.status(500).send('Failed to fetch project details');
            }
        } else {
            res.status(404).send('No finished projects found');
        }
    });
};
////////////////////////////////////////////////////////////////

const projectSharing = (req, res) => {
    const { projectId } = req.body;
    const userId = req.user.ID; // Assuming the user ID is available in the request

    // Check if the user making the request is an admin
    const adminQuery = 'SELECT admin FROM user WHERE userID = ?';
    connection.query(adminQuery, [userId], (adminError, adminResult) => {
        if (adminError) {
            console.error('Error checking user admin status:', adminError);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const isAdmin = adminResult[0].admin === 1;

        if (!isAdmin) {
            return res.status(403).json({ error: 'Unauthorized access: Only admin users can share projects' });
        }

        // Fetch project details from the database
        const projectQuery = 'SELECT projectName, description FROM project WHERE projectID = ?';
        connection.query(projectQuery, [projectId], (error, project) => {
            if (error) {
                console.error('Error fetching project details:', error);
                return res.status(500).json({ error: 'Failed to fetch project details' });
            }

            if (project.length === 0) {
                return res.status(404).json({ error: 'Project not found' });
            }

            // Fetch all users from the database
            const usersQuery = 'SELECT email FROM user';
            connection.query(usersQuery, (usersError, users) => {
                if (usersError) {
                    console.error('Error fetching users from the database:', usersError);
                    return res.status(500).json({ error: 'Failed to fetch users from the database' });
                }

                // Update project status to "finished" in the database
                const updateProjectQuery = 'UPDATE project SET status = "finished" WHERE projectID = ?';
                connection.query(updateProjectQuery, [projectId], (updateError, updateResult) => {
                    if (updateError) {
                        console.error('Error updating project status:', updateError);
                        return res.status(500).json({ error: 'Failed to update project status' });
                    }

                    // Send emails to all users in the database
                    users.forEach(user => {
                        sendEmail(user.email, project[0])
                            .then(() => {
                                console.log(`Email sent to user ${user.email}`);
                            })
                            .catch(emailError => {
                                console.error(`Error sending email to user ${user.email}:, emailError`);
                            });
                    });

                    res.status(200).json({ message: 'Project shared successfully' });
                });
            });
        });
    });
}

//////////////////////////////////////////
const checkTokenPresence = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Please log in to access this feature." });
    }
    next();
};
const commentOnProject = (req, res) => {
    // Check if the user is authenticated
    if (!req.user || !req.user.ID) {
        // User is not authenticated, return a custom message
        return res.status(401).json({ message: 'Please log in to comment on this project.' });
    }

    // Proceed with the rest of the function if authenticated
    const projectId = req.params.projectId;
    const userId = req.user.ID;
    const { comment } = req.body;

    const query = 'INSERT INTO comments (projectID, userID, comment) VALUES (?, ?, ?)';
    connection.query(query, [projectId, userId, comment], (err, results) => {
        if (err) {
            console.error('Error executing query', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json({ message: 'Comment added successfully', commentId: results.insertId });
    });
}

/////////////////////////////delete comment///////////////
const deleteComment = (req, res) => {
    if (!req.user || !req.user.ID) {
        return res.status(401).json({ message: 'Authentication required: Please log in to delete your comment.' });
    }

    const { projectId, commentId } = req.params;
    const userId = req.user.ID;

    // First, verify the comment belongs to the user and is under the correct project
    const checkQuery = 'SELECT * FROM comments WHERE commentID = ? AND userID = ? AND projectID = ?';
    connection.query(checkQuery, [commentId, userId, projectId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error checking comment ownership', checkErr);
            return res.status(500).json({ error: 'Internal server error during comment check' });
        }
        
        if (checkResults.length === 0) {
            return res.status(403).json({ message: 'You can only delete your own comments and ensure the project ID matches.' });
        }

        const deleteQuery = 'DELETE FROM comments WHERE commentID = ?';
        connection.query(deleteQuery, [commentId], (deleteErr, deleteResults) => {
            if (deleteErr) {
                console.error('Error deleting comment', deleteErr);
                return res.status(500).json({ error: 'Internal server error during comment deletion' });
            }
            if (deleteResults.affectedRows > 0) {
                res.status(200).json({ message: 'Comment deleted successfully' });
            } else {
                res.status(404).json({ message: 'Comment not found' });
            }
        });
    });
}
/////////////////////////////////////Ratings :

const rateProject = (req, res) => {
    // Directly check if req.user is undefined, indicating no authentication
    if (!req.user || !req.user.ID) {
        return res.status(401).json({ message: 'Authentication required: Please log in to rate.' });
    }

    const projectId = req.params.projectId;
    const userId = req.user.ID; // This is now guaranteed to be present
    const { rating } = req.body;

    // First, check if the user has already rated this project
    const checkQuery = 'SELECT * FROM ratings WHERE projectID = ? AND userID = ?';
    connection.query(checkQuery, [projectId, userId], (checkErr, checkResults) => {
        if (checkErr) {
            console.error('Error checking existing rating', checkErr);
            return res.status(500).json({ error: 'Internal server error during rating check' });
        }

        // If a rating already exists, inform the user
        if (checkResults.length > 0) {
            return res.status(409).json({ message: 'You have already rated this project. Users can rate a project only once.' });
        } else {
            // No existing rating found, proceed to insert the new rating
            const insertQuery = 'INSERT INTO ratings (projectID, userID, rating) VALUES (?, ?, ?)';
            connection.query(insertQuery, [projectId, userId, rating], (insertErr, insertResults) => {
                if (insertErr) {
                    console.error('Error executing insert query', insertErr);
                    return res.status(500).json({ error: 'Internal server error during rating insert' });
                }
                res.status(200).json({ message: 'Rating added successfully', ratingId: insertResults.insertId });
            });
        }
    });
};



module.exports= {
    get_project,
    delete_project,
    add_project,
    finishedProjects,
    projectSharing,
    getAllprojects,
    updateProject,

    addToFav,
    authenticateTokenHandler,
    checkProjectMembership,

    rateProject, 
    commentOnProject,
    deleteComment,
    checkTokenPresence,
    authenticateTokenHandler
}
const mysql = require('mysql');
const { connection } = require('../connection');

const addTask = async (req, res) => {
    const { taskTitle, description} = req.body; 
    const projectID= req.params.projectID;

    try {
        const result = await checkProjectID(projectID);
        if (!result) {
            return res.status(404).json({ error: 'project not found' });
        }

        const taskInsertResult = await new Promise((resolve, reject) => {
            connection.query('INSERT INTO task (taskTitle, description, projectID) VALUES (?, ?, ?)', [taskTitle, description, projectID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        res.status(201).json({ message: 'New task added successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const assignTask = async (req, res) => {
    const { userName } = req.body; 
    const projectID= req.params.projectID;
    const taskID= req.params.taskID;

    try {
        const userID = await getUserID(userName);
        if (!userID) {
            return res.status(404).json({ error: 'user not found' });
        }
        const result = await checkProjectID(projectID);
        if (!result) {
            return res.status(404).json({ error: 'project not found' });
        }

        const userProjectExists = await checkUserProject(userID, projectID);
        if (!userProjectExists) {
            return res.status(403).json({ error: 'user is not part of this project' });
        }
       
        const result1 = await checkTaskID(taskID);
        if (!result1) {
            return res.status(404).json({ error: 'project not found' });
        }

        const taskAssignResult = await new Promise((resolve, reject) => {
            const status= 'In Progress';
            connection.query('UPDATE task SET userID=?, status=? WHERE projectID=? AND taskID=?', [userID, status, projectID, taskID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        console.log(`task ${taskID} assigned successfully`);
        res.status(201).json({ message: 'task assigned successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const updateTaskStatus = async (req, res) => { 
    const { status } = req.body; 
    const projectID= req.params.projectID;
    const taskID= req.params.taskID;

    try {
        const result = await checkProjectID(projectID);
        if (!result) {
            return res.status(404).json({ error: 'project not found' });
        }
        const result1 = await checkTaskID(taskID);
        if (!result1) {
            return res.status(404).json({ error: 'task not found' });
        }

        const taskAssignResult = await new Promise((resolve, reject) => {
            connection.query('UPDATE task SET status=? WHERE projectID=? AND taskID=?', [status, projectID,taskID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
        res.status(201).json({ message: 'task updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}
const deleteTask = async (req, res) => { 
    const projectID= req.params.projectID;
    const taskID= req.params.taskID;

    try {
         const result = await checkProjectID(projectID);
        if (!result) {
            return res.status(404).json({ error: 'project not found' });
        }
        const result1 = await checkTaskID(taskID);
        if (!result1) {
            return res.status(404).json({ error: 'task not found' });
         }
         const taskAssignResult = await new Promise((resolve, reject) => {
            connection.query('DELETE FROM task WHERE taskID = ? AND projectID=? ', [taskID,projectID], (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                 } });
                 res.status(200).json({ message: `task with ID ${taskID} deleted successfully` });
            });
             
            
        }
            
        catch (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
}


function getUserID(userName) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT userID FROM user WHERE userName=?', [userName], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.length > 0 ? result[0].userID : null);
            }
        });
    });
}

function checkProjectID(projectID) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM project WHERE projectID = ?', [projectID], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.length > 0 ? result[0].projectID : null);
            }
        });
    });
}
function checkTaskID(taskID) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM task WHERE taskID = ?', [taskID], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.length > 0 ? result[0].projectID : null);
            }
        });
    });
}

function checkUserProject(userID, projectID) {
    return new Promise((resolve, reject) => {
        connection.query('SELECT * FROM user_project WHERE userID = ? AND projectID = ?', [userID, projectID], (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result.length > 0);
            }
        });
    });
}

const getProjectTasks = async (req, res) => {
    const projectID = req.params.projectID;

    try {
        const query = 'SELECT task.taskTitle, task.description, task.status, user.userName FROM task LEFT JOIN user ON task.userID = user.userID WHERE task.projectID = ?';
        connection.query(query, [projectID], (err, result) => {
            if (err) {
                console.error('Error retrieving tasks:', err);
                res.status(500).json({ error: 'An error occurred while retrieving tasks' });
                return;
            }

            if (result.length === 0) {
                console.log('No tasks found for projectID:', projectID);
                res.status(404).json({ error: `There are no tasks for project ${projectID}` });
                return;
            }

            const tasksData = result.map(task => ({
                taskTitle: task.taskTitle,
                description: task.description,
                status: task.status,
                userName: (task.userName || 'Not-Assigned') 
            }));
            res.status(200).json(tasksData);
        });
    } catch (error) {
        console.error('error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports= {addTask,assignTask,updateTaskStatus,deleteTask, getUserID, getProjectTasks, checkProjectID}

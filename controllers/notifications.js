const express = require("express");
const {connection} = require("../connection");

///////all of these functions requires to be logged in first
//////and send the token fron login in the header

////in this,send the skill you are searching for in the body 
////along with the type and message
const sendInvitation = (req, res) => {
    if (!req.body) {
        return res.status(400).json({ message: 'Invalid request, request body is missing' });
    }
    
    const senderId = req.user.ID;
    const { skill, type, message } = req.body;
    const queryGetRecipients = 'SELECT userID FROM user WHERE skill = ?';
    const queryInsertInvitation = 'INSERT INTO invitations (sender_id, recipient_id, type, status, message, isRead) VALUES ?'; 

    connection.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Fetch users from database based on skill
        connection.query(queryGetRecipients, [skill], (err, recipientResults) => {
            if (err) {
                connection.rollback(() => {
                    return res.status(500).json({ error: err.message });
                });
            } else {
                ////get ids of users with the required skill
                const recipientIds = recipientResults.map(recipient => [senderId, recipient.userID, type, 'pending', message, 1]);
                
                // Insert invitations for each user
                connection.query(queryInsertInvitation, [recipientIds], (err, insertResults) => {
                    if (err) {
                        connection.rollback(() => {
                            return res.status(500).json({ error: err.message });
                        });
                    } else {
                        connection.commit((err) => {
                            if (err) {
                                connection.rollback(() => {
                                    return res.status(500).json({ error: err.message });
                                });
                            } else {
                                return res.json({ message: 'Invitations sent successfully' });
                            }
                        });
                    }
                });
            }
        });
    });
};

const getInvitations = (req, res) => {
    const recipientId = req.user.ID;
    const selectQuery = 'SELECT sender_id, type, status, message FROM invitations WHERE recipient_id = ?';
    const updateQuery = 'UPDATE invitations SET isRead = 0 WHERE recipient_id = ? AND isRead = 1';
    const senderNameQuery = 'SELECT userName, email FROM user WHERE userID = ?'; 

    connection.beginTransaction((err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        // Fetch invitations based on userID
        connection.query(selectQuery, [recipientId], (err, notifications) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            } else {
                // Update the isRead column for invitations fetched by the user
                connection.query(updateQuery, [recipientId], (err, updateResults) => {
                    if (err) {
                        return res.status(500).json({ error: err.message });
                    } else {
                        // Fetch sender's name and email for each invitation to display them in the result
                        const promises = notifications.map(notification => {
                            return new Promise((resolve, reject) => {
                                connection.query(senderNameQuery, [notification.sender_id], (err, sender) => {
                                    if (err) {
                                        reject(err);
                                    } else {
                                        resolve({ 
                                            senderName: sender[0].userName,
                                            email: sender[0].email,
                                            ...notification 
                                        });
                                    }
                                });
                            });
                        });

                        
                        Promise.all(promises)
                            .then(results => {
                                connection.commit((err) => {
                                    if (err) {
                                        return res.status(500).json({ error: err.message });
                                    } else {
                                        return res.status(200).json(results);
                                    }
                                });
                            })
                            .catch(err => {
                                connection.rollback(() => {
                                    return res.status(500).json({ error: err.message });
                                });
                            });
                    }
                });
            }
        });
    });
};

/////you have to send the projectid in the body so the user is added to this project
////also send the invitation id in the url
const acceptInvitation = (req, res) => {
    const invitationId = req.params.invitationId;
    const projectID = req.body.projectID;
    const queryUpdateInvitation = 'UPDATE invitations SET status = "accepted" WHERE id = ?';
    const queryInsertUserProject = 'INSERT INTO user_project (projectID, userID) VALUES (?, ?)';
      
        connection.query(queryUpdateInvitation, [invitationId,projectID], (err, results) => {
            if (err) {
                console.error('Error executing query', err);
                res.status(500).json({ error: 'Internal server error' });
                return;
              }else {
                const userId = req.user.ID; 
                
                connection.query(queryInsertUserProject, [projectID, userId], (err, result) => {
                    if (err) {
                        console.error('Error executing query', err);
                        res.status(500).json({ error: 'Internal server error' });
                        return;
                      } else {
                        
                                res.status(200).json({ message: 'Invitation accepted and user added to project' });

                    }
                });
            }
        });
    };

////send the invitation id in the url
    const declineInvitation = (req, res) => {
        const invitationId = req.params.invitationId;
        const query = 'UPDATE invitations SET status = "declined" WHERE id = ?';
        
        connection.query(query, [invitationId], (err, results) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            } else {
                return res.json({ message: 'Invitation declined' });
            }
        });
    };
    
    module.exports = {
        sendInvitation,
        getInvitations,
        acceptInvitation,
        declineInvitation
    };
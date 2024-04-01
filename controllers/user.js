const {connection} = require("../connection");
  session=require('../routes/login')
 const crypto = require('crypto');

// Function to hash pass using SHA-1 
const hashPasswordSHA1 = (password) => {
    const sha1Hash = crypto.createHash('sha1');
    sha1Hash.update(password);
    return sha1Hash.digest('hex');
};


const ViewUserProfile=(req, res)=>{
    const  userID  = req.params.userID;
    const Admin=req.user.ID;
    // Check if the user making the request is an admin
    const adminQuery = 'SELECT admin FROM user WHERE userID = ?';
    connection.query(adminQuery, [Admin], (adminError, adminResult) => {
        if (adminError) {
            console.error('Error checking user admin status:', adminError);
            return res.status(500).json({ error: 'Internal server error' });
        }
        const isAdmin = adminResult[0].admin === 1;

        if (!isAdmin) {
            return res.status(403).json({ error: 'Unauthorized access: Only admin users can share projects' });
        }

      });

    const query = 'SELECT userName,email,skill FROM user WHERE userID=?';
    connection.query(query, [userID], (err, results) => {
      if (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      ///console.log(results)
      if (results.length > 0) {
        res.status(200).json({ message: 'User Profile ',
        user: results[0] });
  
      }
      else {
        res.status(401).json({ message: 'No Such User' });
      }
  
    });
  }

const UpdateUserInfo=(req, res) => {
  
  const userID= req.user.ID;

    if (!req.body) {
      res.status(400).json({ message: 'Invalid request, request body is missing' });
      return;
    }
    
    let {userName, email, password ,skill} = req.body;
    let query = 'SELECT * FROM user WHERE userID=?';
    connection.query(query, [userID], (err, results) => {
      if (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
  
      if (userName == 'NoChange') {
        userName = results[0].userName
      }
      if (email == 'NoChange') {
        email = results[0].email;
      }
      if (password == 'NoChange') {
        password = results[0].password;
      }
      if (skill == 'NoChange') {
        skill = results[0].skill;
      }
      const query = "UPDATE user SET userName = ?, email = ?, password = ?,skill = ? WHERE userID = ?";
      connection.query(query, [userName, email, password,skill ,userID], (err, results1) => {
        if (err) {
          console.error('Error executing query', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        // Fetch the updated data from the database
        const fetchQuery = "SELECT * FROM user WHERE userID = ?";
        connection.query(fetchQuery, [userID], (fetchErr, fetchResults) => {
          if (fetchErr) {
            console.error('Error fetching user data', fetchErr);
            res.status(500).json({ error: 'Internal server error' });
            return;
          }
          if (results1.affectedRows > 0) {
            res.status(200).json({ message: 'Updated successfully', Before: results[0], After: fetchResults[0] });
  
          }
          else {
            // User not found or password incorrect~, return error response
            res.status(401).json({ message: 'No Such User' });
          }
        });
  
  
      });
    });
  
  
  
  
  }

const SearchBySkill=(req, res)=>{
    if (!req.body) {
      res.status(400).json({ message: 'Invalid request, request body is missing' });
      return;
    }
    const { skill } = req.body;
    const query = 'SELECT userName,email,skill FROM user WHERE skill=?';
    connection.query(query, [skill], (err, results) => {
      if (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      ///console.log(results)
      if (results.length > 0) {
        res.status(200).json({ message: 'Users with skill '+skill,
        user: results });
  
      }
      else {
        // User not found or password incorrect~, return error response
        res.status(401).json({ message: 'No Such User' });
      }
  
    });
  }
 const deleteUser=(req, res) => {

    const userID= req.user.ID;

    const query = 'DELETE FROM user WHERE userID=?';
    connection.query(query, [userID], (err, results) => {
      if (err) {
        console.error('Error executing query', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
      ///console.log(results)
      if (results.affectedRows > 0) {
        res.status(200).json({ message: 'Deleted successfully' });
  
      }
      else {
        // User not found or password incorrect~, return error response
        res.status(401).json({ message: 'No Such User' });
      }
  
    });
  
  
  }

  const createUser = (req, res) => {
    if (!req.body) {
        res.status(400).json({ message: 'Invalid request, request body is missing' });
        return;
    }

    let { userName, email, password ,skill} = req.body;

    //  Check if required fields are present
    if ( !userName || !email || !password || !skill) {
        res.status(400).json({ message: 'Missing required fields' });
        return;
    }
    const hashedPasswordSHA1 = hashPasswordSHA1(password);


    
        const createUserQuery = 'INSERT INTO user (userName, email, password, skill) VALUES ( ?, ?, ?, ?)';
        connection.query(createUserQuery, [ userName, email, hashedPasswordSHA1, skill], (createErr, createResult) => {
            if (createErr) {
                console.error('Error creating user', createErr);
                res.status(500).json({ error: 'Internal server error' });
                return;
            }

            res.status(200).json({ message: 'User created successfully', user: {  userName, email, password ,skill} });
        });
};

const ViewCurrentUserProfile = (req, res) => {

  const userID = req.user.ID;
  const userProfileQuery = 'SELECT userName, email, skill FROM user WHERE userID=?';
  const unreadNotificationsQuery = 'SELECT COUNT(*) AS unreadCount FROM invitations WHERE recipient_id=? AND isRead=1';

  connection.query(userProfileQuery, [userID], (err, userResults) => {
      if (err) {
          console.error('Error executing user profile query', err);
          return res.status(500).json({ error: 'Internal server error' });
      }

      if (userResults.length > 0) {
          const user = userResults[0];

          // Check for unread notifications
          connection.query(unreadNotificationsQuery, [userID], (err, notificationResults) => {
              if (err) {
                  console.error('Error executing unread notifications query', err);
                  return res.status(500).json({ error: 'Internal server error' });
              }

              const unreadCount = notificationResults.length > 0 ? notificationResults[0].unreadCount : 0;

              res.status(200).json({
                  message: 'User Profile',
                  user: user,
                  unreadNotifications: unreadCount
              });
          });
      } else {
          res.status(401).json({ message: 'No Such User' });
      }
  });
};

module.exports={
    ViewUserProfile,
    UpdateUserInfo,
    SearchBySkill,
    deleteUser,
    createUser,
    ViewCurrentUserProfile,
    hashPasswordSHA1
}
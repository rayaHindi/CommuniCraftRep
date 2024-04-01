const express = require("express");
const {connection} = require("../connection");
const jwt = require('jsonwebtoken');
const {generateToken} = require("../auth/auth");
const {hashPasswordSHA1}= require("./user.js");

 const app = express();
app.use(express.json());
const login= (req, res) => {

    if (!req.body) {
      res.status(400).json({ message: 'Invalid request, request body is missing' });
      return;
  }
     
  
      const { userName , password } = req.body; ////body from postman
      const hashedPassword = hashPasswordSHA1(password);// to compare it to encrypted pass in the database
  
      const query = 'SELECT * FROM user WHERE userName = ? AND password = ?';
          connection.query(query, [userName, hashedPassword], (err, results) => {
        if (err) {
          console.error('Error executing query', err);
          res.status(500).json({ error: 'Internal server error' });
          return;
        }
        if (results.length > 0) {
          // User found, return success response
          const token = generateToken({
            ID: results[0].userID,
            Name: results[0].userName,
            LastName: results[0].email,
            Password: results[0].password,
            skill: results[0].skill,
        });
  
          res.status(200).json({ token :token,message: 'Login successful', user: results[0] });
      } else {
          // User not found or password incorrect, return error response
          res.status(401).json({ message: 'Invalid username or password' });
      }
  
      });
    }
    module.exports=login;
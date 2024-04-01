const mysql = require('mysql');
const express = require("express");
const app = express();
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'communicraft'
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL: ' + err.stack);
        process.exit(1); // Exit the application if connection fails
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);
});

// Handle the event of the application termination
process.on('SIGINT', () => {
    connection.end((err) => {
        if (err) {
            console.error('Error ending MySQL connection: ' + err.stack);
            process.exit(1);
        }
        console.log('MySQL connection ended.');
        process.exit(0);
    });
});

module.exports = {
    app,
    mysql,
    connection,
};

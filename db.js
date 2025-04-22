// db.js
const mysql = require('mysql2/promise');

// Database connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'lcdk6666', // Your MySQL password
  database: 'benebook',
  waitForConnections: true,
  connectionLimit: 10
});

module.exports = { pool };
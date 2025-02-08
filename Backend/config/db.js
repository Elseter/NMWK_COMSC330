// import dotenv from 'dotenv'

// Main file for managing the database configuration

const mysql = require('mysql2');
const pool = mysql.createPool({
  host: 'localhost',
  user: 'user',
  password: 'password',
  database: 'school_db',
  waitForConnections: true,
  connectionLimit: 30,
  queueLimit: 0
});

const promisePool = pool.promise();

module.exports = promisePool;

// backend/config/db.js
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'dontforget_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
});

const db = pool.promise();

db.getConnection()
  .then(() => console.log('MySQL Connected'))
  .catch(err => console.error('MySQL Error:', err));

module.exports = db;

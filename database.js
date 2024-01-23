const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Crear tabla de usuarios si no existe
  
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE, 
      email TEXT UNIQUE,
      password TEXT
    )
  `);

  // Crear tabla de tokens de recuperación si no existe
  db.run(`
    CREATE TABLE IF NOT EXISTS recovery_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE,
      token TEXT,
      expiration_time INTEGER
    )
  `);
});

module.exports = db;

const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
require('dotenv').config();

let isMySQL = process.env.DB_TYPE === 'mysql';
let mysqlPool = null;
let sqliteDb = null;

// Ensure database folder exists for SQLite
const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const sqliteDbPath = path.join(dbDir, 'event_registration.db');

async function connect() {
  if (isMySQL) {
    try {
      const poolOptions = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'event_registration',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      };

      // Enable SSL automatically for cloud-hosted databases
      if (process.env.DB_HOST && process.env.DB_HOST !== 'localhost') {
        poolOptions.ssl = {
          rejectUnauthorized: false
        };
      }

      mysqlPool = mysql.createPool(poolOptions);
      // Test connection
      await mysqlPool.query('SELECT 1');
      console.log('Successfully connected to MySQL database.');
    } catch (err) {
      console.error('MySQL connection failed:', err);
      if (process.env.VERCEL) {
        // On Vercel, throw the real MySQL connection error so it appears directly in logs
        throw err;
      }
      console.warn('Falling back to local SQLite database...', err.message);
      isMySQL = false;
      await connectSQLite();
    }
  } else {
    await connectSQLite();
  }
}

async function connectSQLite() {
  return new Promise((resolve, reject) => {
    sqliteDb = new sqlite3.Database(sqliteDbPath, async (err) => {
      if (err) {
        console.error('Failed to open SQLite database:', err.message);
        reject(err);
      } else {
        console.log(`Connected to local SQLite database at: ${sqliteDbPath}`);
        // Enable foreign keys
        sqliteDb.run('PRAGMA foreign_keys = ON;', async (err) => {
          if (err) {
            console.error('Failed to enable foreign keys in SQLite:', err.message);
          }
          try {
            await initDb();
            resolve();
          } catch (initErr) {
            reject(initErr);
          }
        });
      }
    });
  });
}

function sqliteAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function sqliteRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function (err) {
      if (err) reject(err);
      else {
        resolve({
          insertId: this.lastID,
          affectedRows: this.changes
        });
      }
    });
  });
}

async function query(sql, params = []) {
  if (!mysqlPool && !sqliteDb) {
    await connect();
  }

  if (isMySQL) {
    const [result] = await mysqlPool.execute(sql, params);
    if (Array.isArray(result)) {
      return result;
    } else {
      return {
        insertId: result.insertId,
        affectedRows: result.affectedRows
      };
    }
  } else {
    const trimmed = sql.trim().toUpperCase();
    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH') || trimmed.startsWith('PRAGMA')) {
      return await sqliteAll(sql, params);
    } else {
      return await sqliteRun(sql, params);
    }
  }
}

async function initDb() {
  if (isMySQL) {
    // MySQL tables are expected to be created by schema.sql manually
  } else {
    // SQLite schema definition
    const schema = `
      CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT CHECK(role IN ('user', 'admin')) DEFAULT 'user',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          description TEXT,
          category TEXT NOT NULL,
          date TEXT NOT NULL,
          time TEXT NOT NULL,
          location TEXT NOT NULL,
          capacity INTEGER NOT NULL,
          spots_left INTEGER NOT NULL,
          image_url TEXT DEFAULT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS registrations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          event_id INTEGER NOT NULL,
          status TEXT CHECK(status IN ('confirmed', 'cancelled')) DEFAULT 'confirmed',
          registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
          UNIQUE(user_id, event_id)
      );
    `;

    await new Promise((resolve, reject) => {
      sqliteDb.exec(schema, (err) => {
        if (err) {
          console.error('Error creating SQLite tables:', err.message);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    // Check if users table is empty to run seeds
    const userCountResult = await query('SELECT count(*) as count FROM users');
    if (userCountResult[0].count === 0) {
      console.log('Database empty. Running seed scripts for SQLite...');
      try {
        const seedsPath = path.join(__dirname, '../../database/seeds.sql');
        if (fs.existsSync(seedsPath)) {
          const seedsSql = fs.readFileSync(seedsPath, 'utf8');
          await new Promise((resolve, reject) => {
            sqliteDb.exec(seedsSql, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
          console.log('Local SQLite database seeded successfully.');
        } else {
          console.warn('Seeds file not found, skipping seeding.');
        }
      } catch (err) {
        console.error('Failed to seed SQLite database:', err.message);
      }
    }
  }
}

module.exports = {
  query,
  connect,
  isMySQL: () => isMySQL
};

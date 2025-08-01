// utils/db.js
import { openDatabaseSync } from 'expo-sqlite';

const db = openDatabaseSync('chat.db');
export default db;

db.execAsync(`
  CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY NOT NULL,
    text TEXT NOT NULL,
    sender TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL
  );
`);

db.execAsync(`
  CREATE TABLE IF NOT EXISTS checkups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phqScore INTEGER,
    gadScore INTEGER,
    createdAt TEXT
  );
`);

export const insertCheckupScores = async (phq, gad) => {
  await db.runAsync(
    'INSERT INTO checkups (phqScore, gadScore, createdAt) VALUES (?, ?, ?)',
    [phq, gad, new Date().toISOString()]
  );
};


export const insertMessage = async ({ id, text, sender }) => {
  await db.runAsync('INSERT INTO messages (id, text, sender) VALUES (?, ?, ?)', [id, text, sender]);
};

export const getMessages = async () => {
  const result = await db.getAllAsync('SELECT * FROM messages ORDER BY id ASC');
  return result;
};

export const clearMessages = async () => {
  await db.runAsync('DELETE FROM messages');
};

export const saveSummary = async (content) => {
  await db.runAsync('DELETE FROM summary');
  await db.runAsync('INSERT INTO summary (content) VALUES (?)', [content]);
};

export const getSummary = async () => {
  const result = await db.getFirstAsync('SELECT content FROM summary');
  return result?.content || '';
};

import pool from '../../db.js';

export async function getAllUsersFromDB() {
  const result = await pool.query('SELECT id, name FROM users');
  return result.rows;
}
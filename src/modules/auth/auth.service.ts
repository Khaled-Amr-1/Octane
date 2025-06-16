import pool from "../../db.js";

export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  created_at: Date;
  updated_at: Date;
}

export async function createUser(user: { name: string; email: string; password: string }): Promise<User> {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *`,
    [user.name, user.email, user.password]
  );
  return rows[0];
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const { rows } = await pool.query(
    `SELECT * FROM users WHERE email = $1 LIMIT 1`,
    [email]
  );
  if (rows.length === 0) return null;
  return rows[0];
}
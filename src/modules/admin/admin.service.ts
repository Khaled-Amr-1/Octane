import { Pool } from "pg";

const pool = new Pool({
  // Your database config here, or use env variables
  connectionString: process.env.DATABASE_URL,
});


export const allocateNfcsForUser = async (
  userId: number,
  allocated: number
) => {
  // Insert a new row in nfcs for this allocation
  const query = `
    INSERT INTO public.nfcs (user_id, allocated, day_allocated, updated_at)
    VALUES ($1, $2, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING *
  `;
  const { rows } = await pool.query(query, [userId, allocated]);
  return rows[0];
};

export const suspendUserById = async (userId: number): Promise<boolean> => {
  const query = `
    UPDATE public.users
    SET status = 'suspended', updated_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND status != 'suspended'
    RETURNING id
  `;
  const { rowCount } = await pool.query(query, [userId]);
  return (rowCount ?? 0) > 0;
};
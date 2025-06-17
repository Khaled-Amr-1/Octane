import { Pool } from "pg";

const pool = new Pool({
  // Your database config here, or use env variables
  connectionString: process.env.DATABASE_URL,
});

export const getNfcsStats = async (userId: number) => {
  const query = `
    WITH last_nfc_date AS (
      SELECT MAX(updated_at::date) AS latest_date
      FROM public.nfcs
      WHERE user_id = $1
    )
    SELECT
      COALESCE((
        SELECT SUM(cards_submitted)
        FROM public.acknowledgments
        WHERE updated_at::date = CURRENT_DATE
        AND user_id = $1
      ), 0) AS today_cards_submitted,
      last_nfc_date.latest_date AS updated_at,
      COALESCE((
        SELECT SUM(allocated)
        FROM public.nfcs
        WHERE user_id = $1
        AND updated_at::date = last_nfc_date.latest_date
      ), 0) AS allocated,
      COALESCE((
        SELECT SUM(cards_submitted)
        FROM public.acknowledgments
        WHERE user_id = $1
        AND updated_at::date >= last_nfc_date.latest_date
        AND updated_at::date <= CURRENT_DATE
      ), 0) AS submitted
    FROM last_nfc_date;
  `;

  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};
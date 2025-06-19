import { Pool } from "pg";

const pool = new Pool({
  // Your database config here, or use env variables
  connectionString: process.env.DATABASE_URL,
});

// export const getNfcsStats = async (userId: number) => {
//   const query = `
//     WITH last_nfc_date AS (
//       SELECT MAX(updated_at::date) AS latest_date
//       FROM public.nfcs
//       WHERE user_id = $1
//     )
//     SELECT
//       COALESCE((
//         SELECT SUM(cards_submitted)
//         FROM public.acknowledgments
//         WHERE updated_at::date = CURRENT_DATE
//         AND user_id = $1
//       ), 0) AS today_cards_submitted,
//       last_nfc_date.latest_date AS updated_at,
//       COALESCE((
//         SELECT SUM(allocated)
//         FROM public.nfcs
//         WHERE user_id = $1
//         AND updated_at::date = last_nfc_date.latest_date
//       ), 0) AS allocated,
//       COALESCE((
//         SELECT SUM(cards_submitted)
//         FROM public.acknowledgments
//         WHERE user_id = $1
//         AND updated_at::date >= last_nfc_date.latest_date
//         AND updated_at::date <= CURRENT_DATE
//       ), 0) AS submitted
//     FROM last_nfc_date;
//   `;

//   const { rows } = await pool.query(query, [userId]);
//   return rows[0];
// };


// Helper to get first and last day of the current month in SQL
export const getNfcsStats = async (userId: number) => {
  const query = `
    WITH month_range AS (
      SELECT
        date_trunc('month', CURRENT_DATE) AS first_day,
        (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date AS last_day
    )
    SELECT
      COALESCE((
        SELECT SUM(allocated)
        FROM public.nfcs, month_range
        WHERE user_id = $1
        AND day_allocated::date >= month_range.first_day
        AND day_allocated::date <= month_range.last_day
      ), 0) AS allocated,
      COALESCE((
        SELECT SUM(cards_submitted)
        FROM public.acknowledgments, month_range
        WHERE user_id = $1
        AND updated_at::date >= month_range.first_day
        AND updated_at::date <= month_range.last_day
      ), 0) AS submitted
  `;
  const { rows } = await pool.query(query, [userId]);
  return rows[0];
};

export const insertAcknowledgment = async (
  userId: number,
  companyId: number,
  cardsSubmitted: number,
  submissionType: string,
  deliveryMethod: string,
  imageUrl: string
) => {
  const query = `
    INSERT INTO public.acknowledgments
      (user_id, company_id, cards_submitted, submission_type, delivery_method, image, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    RETURNING id, user_id, company_id, cards_submitted, submission_type, delivery_method, image, updated_at;
  `;
  const values = [userId, companyId, cardsSubmitted, submissionType, deliveryMethod, imageUrl];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

export const getAcknowledgmentsHistory = async (userId: number) => {
  // 1. Get latest allocation date for this user from the nfcs table.
  // 2. Get all acknowledgment records for this user where submission_date >= latest allocation date, ordered by submission_date DESC.
  // 3. Join companies for code and name.

  const allocationDateQuery = `
    SELECT MAX(day_allocated::date) AS latest_allocation
    FROM public.nfcs
    WHERE user_id = $1
  `;
  const { rows: allocationRows } = await pool.query(allocationDateQuery, [userId]);
  const latestAllocation = allocationRows[0]?.latest_allocation;

  if (!latestAllocation) return []; // No allocation, no history

  const historyQuery = `
    SELECT
      a.submission_date,
      c.id as company_id,
      c.code as company_code,
      c.name as company_name,
      a.cards_submitted,
      a.submission_type,
      a.delivery_method,
      a.image
    FROM public.acknowledgments a
    JOIN public.companies c ON a.company_id = c.id
    WHERE a.user_id = $1
      AND a.submission_date::date >= $2
    ORDER BY a.submission_date DESC
  `;
  const { rows } = await pool.query(historyQuery, [userId, latestAllocation]);
  // Format response as requested
  return rows.map((row) => ({
    submission_date: row.submission_date
    ? new Date(row.submission_date).toISOString().split("T")[0]
      : null,
    company: {
      id: row.company_id,
      code: row.company_code,
      name: row.company_name,
    },
    cards_submitted: row.cards_submitted,
    submission_type: row.submission_type,
    delivery_method: row.delivery_method,
    image: row.image,
  }));
};



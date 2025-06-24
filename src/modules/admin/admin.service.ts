import pool from '../..//db.js' ;
import { deleteFromCloudinaryByUrl } from "../../utils/cloudinary.js";

// const pool = new Pool({
//   // Your database config here, or use env variables
//   connectionString: process.env.DATABASE_URL,
// });


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

export const deleteAcknowledgmentsForMonth = async (month: string): Promise<number> => {
  // Build start and end of month
  const start = `${month}-01`;
  const [year, mon] = month.split("-");
  const nextMonth =
    mon === "12"
      ? `${Number(year) + 1}-01`
      : `${year}-${String(Number(mon) + 1).padStart(2, "0")}`;
  const end = `${nextMonth}-01`;

  // 1. Fetch image URLs to delete from cloudinary
  const { rows } = await pool.query(
    `SELECT image FROM public.acknowledgments WHERE submission_date >= $1 AND submission_date < $2`,
    [start, end]
  );
  const imageUrls = rows.map((r) => r.image);

  // 2. Delete images from Cloudinary if real
  await Promise.all(imageUrls.map(deleteFromCloudinaryByUrl));

  // 3. Delete acknowledgments from DB
  const deleteRes = await pool.query(
    `DELETE FROM public.acknowledgments WHERE submission_date >= $1 AND submission_date < $2`,
    [start, end]
  );
  return deleteRes.rowCount ?? 0;
};

export const addCompaniesBulk = async (
  companies: Array<{ name: string; code: string }>
) => {
  if (!companies.length) return;

  // Prepare bulk insert statement
  const values = companies.map(
    (c, i) => `($${i * 2 + 1}, $${i * 2 + 2})`
  );
  const params = companies.flatMap((c) => [c.name, c.code]);
  const query = `INSERT INTO public.companies (name, code) VALUES ${values.join(",")}`;

  await pool.query(query, params);
};
export const upsertCompaniesBulk = async (
  companies: Array<{ name: string; code: string }>
) => {
  if (!companies.length) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const company of companies) {
      await client.query(
        `INSERT INTO public.companies (name, code)
         VALUES ($1, $2)
         ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
        [company.name, company.code]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
export const getAllCompanies = async () => {
  const { rows } = await pool.query("SELECT id, name, code FROM public.companies ORDER BY id");
  return rows;
};

export const getAcknowledgmentsForPeriod = async (start: string, end: string) => {
  const query = `
    SELECT 
      a.id,
      u.name AS user_name,
      c.name AS company_name,
      c.code AS company_code,
      a.cards_submitted,
      a.submission_type,
      a.delivery_method,
      a.state_time,
      a.image,
      a.submission_date,
      a.updated_at
    FROM public.acknowledgments a
    JOIN public.users u ON a.user_id = u.id
    JOIN public.companies c ON a.company_id = c.id
    WHERE a.submission_date::date >= $1
      AND a.submission_date::date <= $2
    ORDER BY a.submission_date ASC
  `;
  const params = [start, end];
  const { rows } = await pool.query(query, params);
  return rows;
};
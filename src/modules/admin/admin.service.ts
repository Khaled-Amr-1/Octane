import { Pool } from "pg";
import { deleteFromCloudinaryByUrl } from "../../utils/cloudinary.js";

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
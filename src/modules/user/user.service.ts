import pool from '../../db.js';

export interface NfcStats {
  allocated: number;
  submitted: number;
}


export const getNfcsStats = async (userId: number): Promise<NfcStats> => {
  const query = `
    WITH
      allocated_current AS (
        SELECT COALESCE(SUM(allocated),0) AS amt
          FROM public.nfcs
         WHERE user_id = $1
           AND day_allocated >= date_trunc('month', CURRENT_DATE)
           AND day_allocated <  (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')
      ),
      submitted_current AS (
        SELECT COALESCE(SUM(cards_submitted),0) AS amt
          FROM public.acknowledgments
         WHERE user_id = $1
           AND updated_at >= date_trunc('month', CURRENT_DATE)
           AND updated_at <  (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')
      ),
      allocated_prior AS (
        SELECT COALESCE(SUM(allocated),0) AS amt
          FROM public.nfcs
         WHERE user_id = $1
           AND day_allocated  < date_trunc('month', CURRENT_DATE)
      ),
      submitted_prior AS (
        SELECT COALESCE(SUM(cards_submitted),0) AS amt
          FROM public.acknowledgments
         WHERE user_id = $1
           AND updated_at      < date_trunc('month', CURRENT_DATE)
      )
    SELECT
      (ac.amt + GREATEST(ap.amt - sp.amt, 0)) AS available,
      sc.amt                        AS submitted
    FROM allocated_current ac
    CROSS JOIN submitted_current sc
    CROSS JOIN allocated_prior   ap
    CROSS JOIN submitted_prior   sp;
  `;

  const { rows } = await pool.query(query, [userId]);
  const { available, submitted } = rows[0];
  return {
    allocated: Number(available),
    submitted: Number(submitted)
  };
};


export const insertAcknowledgmentWithCompany = async (
  userId: number,
  companyId: number,
  cardsSubmitted: number,
  submissionType: string,
  deliveryMethod: string,
  imageUrl: string,
  stateTime: string
) => {
  // Insert the acknowledgment and get the date
  const query = `
    INSERT INTO public.acknowledgments
      (user_id, company_id, cards_submitted, submission_type, delivery_method, image, updated_at, state_time)
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
    RETURNING id, company_id, cards_submitted, submission_type, delivery_method, image, updated_at, state_time;
  `;
  const values = [
    userId,
    companyId,
    cardsSubmitted,
    submissionType,
    deliveryMethod,
    imageUrl,
    stateTime,
  ];
  const { rows } = await pool.query(query, values);
  const ack = rows[0];

  // Fetch company details
  const companyRes = await pool.query(
    "SELECT id, code, name FROM public.companies WHERE id = $1",
    [companyId]
  );
  const company = companyRes.rows[0];

  // Format the response object
  return {
    submission_date: ack.updated_at ? new Date(ack.updated_at).toISOString().split("T")[0] : null,
    company: {
      id: company.id,
      code: company.code,
      name: company.name,
    },
    cards_submitted: ack.cards_submitted,
    submission_type: ack.submission_type,
    delivery_method: ack.delivery_method,
    image: ack.image,
    state_time: ack.state_time,
  };
};

type Period = "daily" | "weekly" | "monthly";

export const getAcknowledgmentsHistory = async (
  userId: number,
  period: Period
) => {
  let dateFilter = "";

  if (period === "daily") {
    dateFilter = "a.submission_date::date = CURRENT_DATE";
  } else if (period === "weekly") {
    dateFilter =
      "a.submission_date::date >= (CURRENT_DATE - INTERVAL '6 days')";
  } else if (period === "monthly") {
    dateFilter = "a.submission_date::date >= date_trunc('month', CURRENT_DATE)";
  } else {
    throw new Error("Invalid period");
  }

  const historyQuery = `
    SELECT
      a.submission_date,
      c.id as company_id,
      c.code as company_code,
      c.name as company_name,
      a.cards_submitted,
      a.submission_type,
      a.delivery_method,
      a.image,
      a.state_time
    FROM public.acknowledgments a
    JOIN public.companies c ON a.company_id = c.id
    WHERE a.user_id = $1
      AND ${dateFilter}
    ORDER BY a.submission_date DESC
  `;
  const params = [userId];
  const { rows } = await pool.query(historyQuery, params);

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
    state_time: row.state_time,
  }));
};

export const getUserById = async (userId: number) => {
  const { rows } = await pool.query(
    "SELECT id, name, email, role, status, created_at, updated_at, image, password FROM public.users WHERE id = $1",
    [userId]
  );
  return rows[0];
};

// Set user image
export const setUserImage = async (userId: number, imageUrl: string) => {
  await pool.query(
    "UPDATE public.users SET image = $1, updated_at = NOW() WHERE id = $2",
    [imageUrl, userId]
  );
};
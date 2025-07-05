import { Request, Response } from "express";
import { allocateNfcsForUser, toggleUserSuspendStatusById, deleteAcknowledgmentsForMonth, addCompaniesBulk, upsertCompaniesBulk, getAllCompanies, getAcknowledgmentsForPeriod, getAllUsersBasic, getUserAcknowledgmentsAndStatsService, getAcknowledgmentsReportService } from "./admin.service.js";
import * as XLSX from "xlsx";

// Admin: Allocate NFCs to a user
export const allocateNfcsToUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const { allocated } = req.body; // expects { "allocated": 10 }

    if (isNaN(userId) || !Number.isInteger(allocated) || allocated < 0) {
      res.status(400).json({ message: "Invalid userId or allocated number" });
      return ;
    }

    // You might want to check if admin: (req as any).user.role === 'admin'

    const allocation = await allocateNfcsForUser(userId, allocated);
    res.status(201).json({ message: "NFCs allocated successfully", allocation });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const suspendUser = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) {
      res.status(400).json({ message: "Invalid userId" });
      return;
    }

    const newStatus = await toggleUserSuspendStatusById(userId);
    if (newStatus === "suspended") {
      res.json({ message: "User suspended successfully" });
    } else if (newStatus === "active") {
      res.json({ message: "User reactivated successfully" });
    } else {
      res.status(404).json({ message: "User not found or cannot toggle status" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteAcknowledgmentsByMonth = async (req: Request, res: Response) => {
  try {
    const { month } = req.query; // expected format: "2025-06"
    if (!month || !/^\d{4}-\d{2}$/.test(month as string)) {
      res.status(400).json({ message: "Invalid or missing month. Use ?month=YYYY-MM" });
      return ;
    }
    const deletedCount = await deleteAcknowledgmentsForMonth(month as string);
    res.json({ message: "Acknowledgments deleted successfully", deletedCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};



export const exportAcknowledgmentsReport = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      res.status(400).json({ message: "start and end date are required" });
      return;
    }
    
    // Fetch data with user name and company name
    const data = await getAcknowledgmentsForPeriod(start as string, end as string);
    
    // Prepare rows for Excel
    const rows = data.map(row => ({
      User: row.user_name,
      Company: row.company_name,
      Company_Code: row.company_code,
      Cards_Submitted: row.cards_submitted,
      Submission_Type: row.submission_type,
      Delivery_Method: row.delivery_method,
      State_Time: row.state_time,
      Image: row.image,
      Submission_Date: row.submission_date,
    }));

    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Acknowledgments");

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    
    // Set headers and send file
    res.setHeader("Content-Disposition", `attachment; filename="acknowledgments_${start}_to_${end}.xlsx"`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


function getField(row: any, possibleKeys: string[]): string | undefined {
  for (let key of Object.keys(row)) {
    let trimmed = key.trim().toLowerCase();
    for (let possible of possibleKeys) {
      if (trimmed === possible.trim().toLowerCase()) {
        return row[key];
      }
    }
  }
  return undefined;
}

// Helper to parse file buffer for .csv, .xlsx, .ods
function parseCompaniesFromFile(file: Express.Multer.File): Array<{ name: string; code: string }> {
  const originalName = file.originalname.toLowerCase();
  let companies: any[] = [];
  if (originalName.endsWith(".csv")) {
    const csvData = file.buffer.toString("utf-8");
    const workbook = XLSX.read(csvData, { type: "string" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    companies = XLSX.utils.sheet_to_json(sheet);
  } else {
    const workbook = XLSX.read(file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    companies = XLSX.utils.sheet_to_json(sheet);
  }
  // LOG FIRST ROW TO DEBUG
  if (companies.length > 0) console.log('First row keys:', Object.keys(companies[0]));

  const nameKeys = ["name", "الإسم", "اسم", "Name"];
  const codeKeys = ["code", "#", "كود", "Code"];

  const toInsert: Array<{ name: string; code: string }> = [];
  for (const row of companies) {
    const name = getField(row, nameKeys);
    const code = getField(row, codeKeys);
    if (name && code) {
      toInsert.push({ name: String(name), code: String(code) });
    }
  }
  return toInsert;
}

export const addCompaniesFromExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    const toInsert = parseCompaniesFromFile(req.file);

    if (toInsert.length === 0) {
      res.status(400).json({ message: "No valid rows found in file" });
      return;
    }

    await addCompaniesBulk(toInsert);
    res.status(201).json({ message: "Companies added successfully", count: toInsert.length });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const replaceAllCompanies = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }
    const toInsert = parseCompaniesFromFile(req.file);

    if (toInsert.length === 0) {
      res.status(400).json({ message: "No valid rows found in the file" });
      return;
    }

    await upsertCompaniesBulk(toInsert);

    res.status(201).json({ message: "Companies upserted (added or updated) successfully", count: toInsert.length });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getCompanies = async (req: Request, res: Response) => {
  try {
    const companies = await getAllCompanies();
    res.json({ companies });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsersBasic();
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getUserAcknowledgmentsAndStats = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
      res.status(400).json({ message: "Invalid userId" });
      return;
    }

    const result = await getUserAcknowledgmentsAndStatsService(userId);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const getAcknowledgmentsReport = async (req: Request, res: Response) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      res.status(400).json({ message: "start and end parameters are required" });
      return;
    }
    const data = await getAcknowledgmentsReportService(start as string, end as string);

    // Transform output to match your standard
    const acknowledgments = data.map((ack: any) => ({
      id: ack.id,
      user_id: ack.user_id,
      cards_submitted: ack.cards_submitted,
      submission_type: ack.submission_type,
      delivery_method: ack.delivery_method,
      image: ack.image,
      submission_date: ack.submission_date
        ? new Date(ack.submission_date).toISOString().slice(0, 10)
        : null,
      state_time: ack.state_time,
      user_name: ack.user_name,
      company: {
        id: ack.company_id,
        code: ack.company_code,
        name: ack.company_name,
      },
      // Note: `updated_at` is omitted
    }));

    res.json({ acknowledgments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
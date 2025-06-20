import { Request, Response } from "express";
import { allocateNfcsForUser, suspendUserById, deleteAcknowledgmentsForMonth, addCompaniesBulk } from "./admin.service.js";
import XLSX from "xlsx";

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

    const result = await suspendUserById(userId);
    if (result) {
      res.json({ message: "User suspended successfully" });
    } else {
      res.status(404).json({ message: "User not found or already suspended" });
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


export const addCompaniesFromExcel = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ message: "No file uploaded" });
      return;
    }

    const originalName = req.file.originalname.toLowerCase();
    let companies: any[] = [];

    if (originalName.endsWith(".csv")) {
      const csvData = req.file.buffer.toString("utf-8");
      const workbook = XLSX.read(csvData, { type: "string" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      companies = XLSX.utils.sheet_to_json(sheet);
    } else {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      companies = XLSX.utils.sheet_to_json(sheet);
    }

    // Validate and extract data
    const toInsert: Array<{ name: string; code: string }> = [];
    for (const row of companies as any[]) {
      if (row.name && row.code) {
        toInsert.push({ name: row.name, code: String(row.code) });
      }
    }

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
import { Request, Response } from "express";
import { getAllUsersFromDB } from "./user.service.js";

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await getAllUsersFromDB();
    res.json(users);
  } catch (err) {
    console.error(err); // Log for Vercel logs
    res
      .status(500)
      .json({
        error: "Database error",
        details: err instanceof Error ? err.message : err,
      });
  }
};

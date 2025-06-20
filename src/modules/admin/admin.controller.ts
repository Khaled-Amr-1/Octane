import { Request, Response } from "express";
import { allocateNfcsForUser, suspendUserById } from "./admin.service.js";

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
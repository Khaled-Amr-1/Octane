import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import pool  from "../db.js"; // Adjust path if necessary

// Replace with your actual secret
const JWT_SECRET = process.env.JWT_SECRET || "supersecret";

export const verifyToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    // Fetch user from DB to check status
    const { rows } = await pool.query(
      "SELECT id, status FROM users WHERE id = $1",
      [decoded.id]
    );
    const user = rows[0];
    if (!user) {
      res.status(401).json({ message: "User not found" });
      return ;
    }
    if (user.status === "suspended") {
      res.status(403).json({ message: "Account suspended" });
      return ;
    }
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};
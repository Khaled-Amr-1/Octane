import { Request, Response } from "express";
import { getNfcsStats } from "./user.service.js";

export const getNfcs = async (req: Request, res: Response) => {
  try {
    // If your token middleware attaches user info you can use (req as any).user
    // Otherwise, get user id from query or params as needed
    const userId = (req as any).user.id ;
    const stats = await getNfcsStats(userId);

    if (!stats) {
      res.status(404).json({ message: "No statistics found" });
      return;
    }

    const todayStatement = `today you submitted ${stats.today_cards_submitted}`;
    const periodStatement = `from ${stats.updated_at} you submitted ${stats.submitted} out of ${stats.allocated}`;

    res.json({
      today: todayStatement,
      period: periodStatement,
    });
    return ;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
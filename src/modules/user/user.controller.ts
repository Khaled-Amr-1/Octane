import { Request, Response } from "express";
import { getNfcsStats } from "./user.service.js";

export const getNfcs = async (req: Request, res: Response) => {
  try {
    // If your token middleware attaches user info you can use (req as any).user
    // Otherwise, get user id from query or params as needed
    const userId = (req as any).user.id;
    const stats = await getNfcsStats(userId);

    if (!stats) {
      res.status(404).json({ message: "No statistics found" });
      return;
    }

    let formattedDate = "";
    if (stats.updated_at) {
      const date = new Date(stats.updated_at);
      // Option 1: "YYYY-MM-DD"
      formattedDate = date.toISOString().split("T")[0];
      // Option 2: "Jun 17, 2025"
      // formattedDate = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    }

    const todayStatement = `today you submitted ${stats.today_cards_submitted}`;
    const periodStatement = `from ${formattedDate} you submitted ${stats.submitted} out of ${stats.allocated}`;

    res.json({
      today: todayStatement,
      period: periodStatement,
    });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

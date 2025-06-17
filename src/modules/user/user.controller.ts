import { Request, Response } from "express";
import { getNfcsStats } from "./user.service.js";

export const getNfcs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const stats = await getNfcsStats(userId);

    let todayStatement = `today you submitted ${stats.today_cards_submitted} cards`;
    let periodStatement = "";

    if (stats.updated_at) {
      const date = new Date(stats.updated_at);
      // Option 1: "YYYY-MM-DD"
      const formattedDate = date.toISOString().split("T")[0];
      // Option 2: "Jun 17, 2025"
      // const formattedDate = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      periodStatement = `from ${formattedDate} you submitted ${stats.submitted} out of ${stats.allocated}`;
    } else {
      periodStatement = "you didn't get any cards allocated";
    }

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
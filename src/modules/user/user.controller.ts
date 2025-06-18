import { Request, Response } from "express";
import { getNfcsStats } from "./user.service.js";
import { uploadToCloudinary } from "../../utils/cloudinary.js";
import { insertAcknowledgment, getAcknowledgmentsHistory } from "./user.service.js";


export const getNfcs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const stats = await getNfcsStats(userId);

    let todayStatement = `today you submitted ${stats.today_cards_submitted} cards`;
    let periodStatement = "";

    let formattedDate = "";
    if (stats.updated_at) {
      const date = new Date(stats.updated_at);
      // Option 1: "YYYY-MM-DD"
      formattedDate = date.toISOString().split("T")[0];
      // Option 2: "Jun 17, 2025"
      // const formattedDate = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
      periodStatement = `from ${formattedDate} you submitted ${stats.submitted} out of ${stats.allocated}`;
    } else {
      periodStatement = "you didn't get any cards allocated";
    }

    res.json({
      today: todayStatement,
      period: periodStatement,
      today_cards_submitted: stats.today_cards_submitted,
      submitted: stats.submitted,
      allocated: stats.allocated,
      date:formattedDate

    });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};


const SUBMISSION_TYPES = ['replacement', 'existing_customer', 'new_customer'];
const DELIVERY_METHODS = ['office_receival', 'octane_employee', 'aramex'];

export const postAcknowledgment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // From the JWT, not request body!
    const { company_id, cards_submitted, submission_type, delivery_method } = req.body;

    // Validate required fields
    if (!company_id || !cards_submitted || !submission_type || !delivery_method) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }
    if (!SUBMISSION_TYPES.includes(submission_type)) {
      res.status(400).json({ message: "Invalid submission_type" });
      return;
    }
    if (!DELIVERY_METHODS.includes(delivery_method)) {
      res.status(400).json({ message: "Invalid delivery_method" });
      return;
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer, `acknowledgment_${Date.now()}`);
    } else {
      res.status(400).json({ message: "Image file is required" });
      return;
    }

    const record = await insertAcknowledgment(
      userId,
      Number(company_id),
      Number(cards_submitted),
      submission_type,
      delivery_method,
      imageUrl
    );

    res.status(201).json({ acknowledgment: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAcknowledgments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const history = await getAcknowledgmentsHistory(userId);

    res.json({ acknowledgments: history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
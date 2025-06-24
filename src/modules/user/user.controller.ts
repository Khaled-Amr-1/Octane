import { Request, Response } from "express";
import { getNfcsStats } from "./user.service.js";
import { getUserById, setUserImage } from "./user.service.js";
import { deleteFromCloudinaryByUrl } from "../../utils/cloudinary.js";

import { uploadToCloudinary } from "../../utils/cloudinary.js";
import {
  insertAcknowledgment,
  getAcknowledgmentsHistory,
} from "./user.service.js";


//     const userId = (req as any).user.id;
//     const stats = await getNfcsStats(userId);

//     let todayStatement = `today you submitted ${stats.today_cards_submitted} cards`;
//     let periodStatement = "";

//     let formattedDate = "";
//     if (stats.updated_at) {
//       const date = new Date(stats.updated_at);
//       // Option 1: "YYYY-MM-DD"
//       formattedDate = date.toISOString().split("T")[0];
//       // Option 2: "Jun 17, 2025"
//       // const formattedDate = date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
//       periodStatement = `from ${formattedDate} you submitted ${stats.submitted} out of ${stats.allocated}`;
//     } else {
//       periodStatement = "you didn't get any cards allocated";
//     }

//     res.json({
//       today: todayStatement,
//       period: periodStatement,
//       today_cards_submitted: stats.today_cards_submitted,
//       submitted: stats.submitted,
//       allocated: stats.allocated,
//       date:formattedDate

//     });
//     return;
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };



export const getNfcs = async (req: Request, res: Response) => {
  console.time("⏱ handler total");
  try {
    const userId = (req as any).user.id;
    console.time("⏱ query");
    const stats = await getNfcsStats(userId);
    console.timeEnd("⏱ query");

    if (!stats) {
      console.timeEnd("⏱ handler total");
      res.status(404).json({ message: "No NFC stats found for this user" });
      return;
    }

    console.time("⏱ res.json");
    res.json({
      allocated: stats.allocated,
      submitted: stats.submitted,
    });
    console.timeEnd("⏱ res.json");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  } finally {
    console.timeEnd("⏱ handler total");
  }
};


const SUBMISSION_TYPES = ["replacement", "existing_customer", "new_customer"];
const DELIVERY_METHODS = ["office_receival", "octane_employee", "aramex"];
const STATE_TIMES = ["on-Time", "Late"]; // Add this constant

export const postAcknowledgment = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id; // From the JWT, not request body!
    const {
      company_id,
      cards_submitted,
      submission_type,
      delivery_method,
      state_time,
    } = req.body;

    // Validate required fields
    if (
      !company_id ||
      !cards_submitted ||
      !submission_type ||
      !delivery_method ||
      !state_time
    ) {
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
    if (!STATE_TIMES.includes(state_time)) {
      res.status(400).json({ message: "Invalid state_time" });
      return;
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadToCloudinary(
        req.file.buffer,
        `acknowledgment_${Date.now()}`
      );
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
      imageUrl,
      state_time // Pass state_time to the service
    );

    res.status(201).json({ acknowledgment: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const allowedPeriods = ["daily", "weekly", "monthly"];

export const getAcknowledgments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const period = req.query.period as string;

    if (!period || !allowedPeriods.includes(period)) {
      res.status(400).json({
        message: "Invalid or missing period. Use ?period=daily|weekly|monthly",
      });
      return;
    }

    const history = await getAcknowledgmentsHistory(
      userId,
      period as "daily" | "weekly" | "monthly"
    );
    res.json({ acknowledgments: history });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const testRoute = (req: Request, res: Response) => {
  res.json({ message: "Test route works!" });
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const user = await getUserById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    // Omit password from returned data!
    const { password, ...userData } = user;
    res.json(userData);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 2. POST /profile/image (set if null)
export const uploadProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }
    const imageUrl = await uploadToCloudinary(req.file.buffer, `user_${userId}_${Date.now()}`);
    await setUserImage(userId, imageUrl);
    res.status(201).json({ message: "Profile image uploaded", image: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// 3. PUT /profile/image (replace old image if exists)
export const updateProfileImage = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    if (!req.file) {
      res.status(400).json({ message: "Image file is required" });
      return;
    }
    // Optionally delete previous image from Cloudinary
    const user = await getUserById(userId);
    if (user?.image) {
      // Implement this function to remove image from Cloudinary if you want
      await deleteFromCloudinaryByUrl(user.image);
    }
    const imageUrl = await uploadToCloudinary(req.file.buffer, `user_${userId}_${Date.now()}`);
    await setUserImage(userId, imageUrl);
    res.json({ message: "Profile image updated", image: imageUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
};
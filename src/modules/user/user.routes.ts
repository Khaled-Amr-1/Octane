import { Router } from "express";
import { getNfcs } from "./user.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import {
  postAcknowledgment,
  getAcknowledgments,
} from "../user/user.controller.js";
import { upload } from "../../middlewares/upload.middleware.js";

const router = Router();

// GET /nfcs
router.get("/nfcs", verifyToken, getNfcs);
router.get("/acknowledgments", verifyToken, getAcknowledgments);

router.post(
  "/acknowledgments",
  verifyToken,
  upload.single("image"), // image field in form-data
  postAcknowledgment
);

export default router;

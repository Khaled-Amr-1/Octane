import { Router } from "express";
import { getNfcs } from "./user.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";

const router = Router();

// GET /nfcs
router.get("/nfcs", verifyToken, getNfcs);

export default router;
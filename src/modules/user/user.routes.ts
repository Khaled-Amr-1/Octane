import { Router } from "express";
import { getNfcs, testRoute } from "./user.controller.js";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import {
  postAcknowledgment,
  getAcknowledgments,
} from "../user/user.controller.js";
import { upload } from "../../middlewares/upload.middleware.js";
import {
  getProfile,
  uploadProfileImage,
  updateProfileImage,
} from "./user.controller.js";

const router = Router();

// GET /nfcs
router.get("/nfcs", verifyToken, getNfcs);
router.get("/acknowledgments", verifyToken, getAcknowledgments);
router.get("/test", verifyToken, testRoute);

router.post(
  "/acknowledgments",
  verifyToken,
  upload.single("image"), // image field in form-data
  postAcknowledgment
);




router.get("/profile", verifyToken, getProfile);

router.post(
  "/profile/image",
  verifyToken,
  upload.single("image"),
  uploadProfileImage
);

router.put(
  "/profile/image",
  verifyToken,
  upload.single("image"),
  updateProfileImage
);

export default router;

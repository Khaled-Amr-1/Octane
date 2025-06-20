import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { allocateNfcsToUser } from "./admin.controller.js";
import { authorizeRoles } from "../../middlewares/authorize.middleware.js";

const router = Router();

// Admin: Allocate NFCs to a user
router.post(
  "/admin/users/allocate/:userId",
  verifyToken,
    authorizeRoles("admin"), // Only allow admin role
  allocateNfcsToUser
);

export default router;
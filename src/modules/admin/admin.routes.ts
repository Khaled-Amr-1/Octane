import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { allocateNfcsToUser, suspendUser } from "./admin.controller.js";
import { authorizeRoles } from "../../middlewares/authorize.middleware.js";
import { deleteAcknowledgmentsByMonth } from "./admin.controller.js";

const router = Router();

// Admin: Allocate NFCs to a user
router.post(
  "/users/allocate/:userId",
  verifyToken,
    authorizeRoles("admin"), // Only allow admin role
  allocateNfcsToUser
);

// Admin: Suspend a user account
router.post(
  "/users/suspend/:userId",
  verifyToken,
  authorizeRoles("admin"),
  suspendUser
);


router.delete(
  "/acknowledgments",
  verifyToken,
  authorizeRoles("admin"),
  deleteAcknowledgmentsByMonth
);



export default router;
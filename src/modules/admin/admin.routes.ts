import { Router } from "express";
import { verifyToken } from "../../middlewares/auth.middleware.js";
import { allocateNfcsToUser, suspendUser } from "./admin.controller.js";
import { authorizeRoles } from "../../middlewares/authorize.middleware.js";
import { deleteAcknowledgmentsByMonth, replaceAllCompanies } from "./admin.controller.js";
import { addCompaniesFromExcel, getCompanies, exportAcknowledgmentsReport , getAllUsers, getUserAcknowledgmentsAndStats, getAcknowledgmentsReport, exportUserAcknowledgmentsCurrentMonth} from "./admin.controller.js";
import { uploadExcel } from "../../middlewares/uploadExcel.middleware.js";

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


router.post(
  "/companies",
  verifyToken,
  authorizeRoles("admin"),
  uploadExcel.single("file"), // "file" is the field name in form-data
  addCompaniesFromExcel
);

router.put(
  "/companies",
  verifyToken,
  authorizeRoles("admin"),
  uploadExcel.single("file"),
  replaceAllCompanies
);

router.get(
  "/companies",
  verifyToken,
  getCompanies
);

router.get(
  "/report/export",
  verifyToken,
  authorizeRoles("admin"),
  exportAcknowledgmentsReport
);



router.get(
  "/users",
  verifyToken,
  authorizeRoles("admin"),
  getAllUsers
);

router.get(
  "/users/acknowledgments/:userId",
  verifyToken,
  authorizeRoles("admin"),
  getUserAcknowledgmentsAndStats
);


router.get(
  "/reports",
  verifyToken,
  authorizeRoles("admin"),
  getAcknowledgmentsReport
);

router.get(
  "/report/export/user/:userId",
  verifyToken,
  authorizeRoles("admin"),
  exportUserAcknowledgmentsCurrentMonth
);

export default router;
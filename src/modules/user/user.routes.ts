import { Router } from "express";
import { getUsers } from "./user.controller.js";

const router = Router();

router.get("/users", getUsers);

export default router;

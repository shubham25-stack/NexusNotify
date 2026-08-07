import { Router } from "express";
import { getIntent } from "../controllers/intent.js";

const router = Router();

router.get("/:messageId", getIntent);

export default router;

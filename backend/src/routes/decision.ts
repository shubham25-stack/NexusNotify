import { Router } from "express";

import { getDecision } from "../controllers/decision.js";

const router = Router();

router.get("/:messageId", getDecision);

export default router;

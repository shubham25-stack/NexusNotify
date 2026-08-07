import { Router } from "express";

import { getEvidence } from "../controllers/evidence.js";

const router = Router();

router.get("/:messageId", getEvidence);

export default router;

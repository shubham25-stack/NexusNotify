import { Router } from "express";

import { getMessageScore } from "../controllers/scoring.js";

const router = Router();

router.get("/:messageId", getMessageScore);

export default router;

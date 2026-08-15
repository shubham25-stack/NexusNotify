import { Router } from "express";

import {
  generateSubmissionHandler,
  healthCheck,
  routeSingleMessageHandler,
} from "../controllers/router.controller.js";

const router = Router();

router.get("/health", healthCheck);
router.post("/submission/generate", generateSubmissionHandler);
router.get("/messages/:messageId/route", routeSingleMessageHandler);

export default router;

import { Router } from "express";

import { getPersonalization } from "../controllers/personalization.js";

const router = Router();

router.get(
  "/:messageId",

  getPersonalization,
);

export default router;

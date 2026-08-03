import { Router } from "express";

import { getMedia } from "../controllers/media.js";

const router = Router();

router.get("/:messageId", getMedia);

export default router;

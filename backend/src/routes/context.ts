import { Router } from "express";

import { getMessageContext } from "../controllers/context.js";

const router = Router();

router.get("/:messageId", getMessageContext);

export default router;

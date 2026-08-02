import { Router } from "express";
import { getDatasetStats } from "../controllers/dataset.js";

const router = Router();

router.get("/stats", getDatasetStats);

export default router;

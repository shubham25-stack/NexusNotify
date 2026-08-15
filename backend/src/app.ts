import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import router from "./routes/router.routes.js";
import datasetRoutes from "./routes/dataset.js";
import contextRoutes from "./routes/context.js";
import scoringRoutes from "./routes/scoring.js";
import mediaRoutes from "./routes/media.js";
import evidenceRoutes from "./routes/evidence.js";
import intentRoutes from "./routes/intent.js";
import personalizationRoutes from "./routes/personalization.js";
import decisionRoutes from "./routes/decision.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (_, response) => {
  response.json({
    success: true,
    message: "NexusNotify Backend Running 🚀",
  });
});

app.use("/api", router);
app.use("/api/dataset", datasetRoutes);
app.use("/api/context", contextRoutes);
app.use("/api/scoring", scoringRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/evidence", evidenceRoutes);
app.use("/api/intent", intentRoutes);
app.use("/api/personalization", personalizationRoutes);
app.use("/api/decision", decisionRoutes);

export default app;

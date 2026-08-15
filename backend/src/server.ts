import "dotenv/config";

import app from "./app.js";
import { initializeDataset } from "./modules/dataset/initializer.js";
import { logger } from "./shared/logger/logger.js";

const PORT = Number(process.env.PORT || 5000);

const startServer = async (): Promise<void> => {
  await initializeDataset();

  app.listen(PORT, () => {
    logger.info(`Server running on http://localhost:${PORT}`);
  });
};

void startServer();

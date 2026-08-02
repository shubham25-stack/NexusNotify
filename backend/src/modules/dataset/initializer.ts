import { logger } from "../../shared/logger/logger.js";
import { createDatasetRegistry } from "./registry.js";
import { loadDatasetBundle } from "./loader.js";
import type {
  DatasetBundle,
  DatasetRegistry,
} from "../context/context.types.js";

let cachedBundle: DatasetBundle | null = null;
let cachedRegistry: DatasetRegistry | null = null;

const loadAndCacheDataset = async (): Promise<DatasetRegistry> => {
  logger.info("Loading dataset bundle");
  cachedBundle = await loadDatasetBundle();
  cachedRegistry = createDatasetRegistry(cachedBundle);
  logger.info(
    `Dataset initialized with ${cachedBundle.messages.length} incoming messages`,
  );
  return cachedRegistry;
};

export const initializeDataset = async (): Promise<DatasetRegistry> => {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  try {
    return await loadAndCacheDataset();
  } catch (error) {
    logger.error(error instanceof Error ? error.message : String(error));
    throw error;
  }
};

export const reloadDataset = async (): Promise<DatasetRegistry> => {
  cachedBundle = null;
  cachedRegistry = null;
  return initializeDataset();
};

export const getDatasetBundle = (): DatasetBundle | null => cachedBundle;
export const getDatasetRegistry = (): DatasetRegistry | null => cachedRegistry;

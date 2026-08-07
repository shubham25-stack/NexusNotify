import * as path from "node:path";

import { DATASET_FILES, DATASET_PATH } from "../../shared/constants/dataset.js";
import { writeCSV } from "../../shared/utils/csv.js";
import { logger } from "../../shared/logger/logger.js";
import type {
  DatasetRegistry,
  RoutingDecision,
} from "../context/context.types.js";
import { routeMessage } from "../router/router.service.js";

export interface SubmissionResult {
  outputPath: string;
  decisions: RoutingDecision[];
}

export const generateSubmission = async (
  registry: DatasetRegistry,
): Promise<SubmissionResult> => {
  const decisions = await Promise.all(
    registry.bundle.messages.map((message) => routeMessage(registry, message)),
  );
  const outputPath = path.join(DATASET_PATH, DATASET_FILES.output);

  await writeCSV(
    outputPath,
    [
      "message_id",
      "action",
      "message_type",
      "reason",
      "confidence",
      "evidence_message_ids",
    ],
    decisions.map((decision) => ({
      message_id: decision.messageId,
      action: decision.action,
      message_type: decision.messageType,
      reason: decision.reason,
      confidence: decision.confidence.toFixed(2),
      evidence_message_ids: decision.evidenceMessageIds.join(";"),
    })),
  );

  logger.info(`Submission generated at ${outputPath}`);

  return {
    outputPath,
    decisions,
  };
};

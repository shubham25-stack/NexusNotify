import type { Request, Response } from "express";

import { getDatasetRegistry } from "../modules/dataset/initializer.js";
import { buildMessageContext } from "../modules/context/context.service.js";
import { findEvidenceMessageIds } from "../modules/evidence/evidence.service.js";
import { scoreMessage } from "../modules/scoring/scoring.service.js";
import { routeMessage } from "../modules/router/router.service.js";
import { resolveRouteParam } from "../shared/helpers/http.js";

export const getEvidence = async (req: Request, res: Response) => {
  const registry = getDatasetRegistry();

  if (!registry) {
    return res.status(500).json({
      success: false,
    });
  }

  const messageId = resolveRouteParam(req.params.messageId);

  if (!messageId) {
    return res.status(400).json({
      success: false,
    });
  }

  const message = registry.messagesById.get(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
    });
  }

  const context = await buildMessageContext(registry, message);

  const decision = await routeMessage(registry, message);

  const evidence = findEvidenceMessageIds(registry, context, decision);

  return res.json({
    success: true,

    evidence,
  });
};

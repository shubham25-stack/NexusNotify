import type { Request, Response } from "express";

import { getDatasetRegistry } from "../modules/dataset/initializer.js";
import { buildMessageContext } from "../modules/context/context.service.js";
import { scoreMessage } from "../modules/scoring/scoring.service.js";
import { resolveRouteParam } from "../shared/helpers/http.js";

export const getMessageScore = async (req: Request, res: Response) => {
  const registry = getDatasetRegistry();

  if (!registry) {
    return res.status(500).json({
      success: false,
      message: "Dataset not initialized",
    });
  }

  const messageId = resolveRouteParam(req.params.messageId);

  if (!messageId) {
    return res.status(400).json({
      success: false,
      message: "messageId is required",
    });
  }

  const message = registry.messagesById.get(messageId);

  if (!message) {
    return res.status(404).json({
      success: false,
      message: "Message not found",
    });
  }

  const context = await buildMessageContext(registry, message);

  const scores = scoreMessage(context);

  return res.json({ success: true, scores });
};

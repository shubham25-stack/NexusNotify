import type { Request, Response } from "express";

import { getDatasetRegistry } from "../modules/dataset/initializer.js";
import { buildMessageContext } from "../modules/context/context.service.js";
import { calculatePersonalization } from "../modules/personalization/service.js";
import { resolveRouteParam } from "../shared/helpers/http.js";

export const getPersonalization = async (
  req: Request,

  res: Response,
) => {
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

  const personalization = calculatePersonalization(context);

  return res.json({
    success: true,

    personalization,
  });
};

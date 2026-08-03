import type { Request, Response } from "express";

import { getDatasetRegistry } from "../modules/dataset/initializer.js";
import { resolveMediaContext } from "../modules/media/media.service.js";
import { resolveRouteParam } from "../shared/helpers/http.js";

export const getMedia = async (req: Request, res: Response) => {
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

  const media = await resolveMediaContext(registry, message);

  return res.json({ success: true, media });
};

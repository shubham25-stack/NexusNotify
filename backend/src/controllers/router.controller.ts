import type { Request, Response } from "express";

import { initializeDataset } from "../modules/dataset/initializer.js";
import { generateSubmission } from "../modules/evaluation/evaluation.service.js";
import { routeMessage } from "../modules/router/router.service.js";

export const healthCheck = (_request: Request, response: Response): void => {
  response.json({
    success: true,
    message: "NexusNotify Backend Running",
  });
};

export const generateSubmissionHandler = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  const registry = await initializeDataset();
  const result = await generateSubmission(registry);

  response.json({
    success: true,
    outputPath: result.outputPath,
    totalMessages: result.decisions.length,
  });
};

export const routeSingleMessageHandler = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const registry = await initializeDataset();
  const messageId = Array.isArray(request.params.messageId)
    ? request.params.messageId[0]
    : request.params.messageId;

  if (!messageId) {
    response.status(400).json({
      success: false,
      message: "messageId is required",
    });
    return;
  }

  const message = registry.messagesById.get(messageId);

  if (!message) {
    response.status(404).json({
      success: false,
      message: "Message not found",
    });
    return;
  }

  const decision = await routeMessage(registry, message);

  response.json({
    success: true,
    decision,
  });
};

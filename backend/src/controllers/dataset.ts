import type { Request, Response } from "express";
import { getDatasetRegistry } from "../modules/dataset/initializer.js";

export const getDatasetStats = (_req: Request, res: Response) => {
  const registry = getDatasetRegistry();

  if (!registry) {
    return res.status(500).json({
      success: false,
      message: "Dataset not initialized",
    });
  }

  return res.json({
    success: true,

    stats: {
      messages: registry.bundle.messages.length,
      users: registry.bundle.users.length,
      groups: registry.bundle.groups.length,
      groupMembers: registry.bundle.groupMembers.length,
      businessAccounts: registry.bundle.businessAccounts.length,
      messageHistory: registry.bundle.messageHistory.length,
      messageEvents: registry.bundle.messageEvents.length,
      images: registry.bundle.images.length,
      voiceNotes: registry.bundle.voiceNotes.length,
    },
  });
};

import * as fs from "node:fs";
import * as path from "node:path";

import { DATASET_PATH } from "../../shared/constants/dataset.js";
import { extractMediaWithFallbackProviders } from "../llm/manager.js";
import type {
  DatasetRegistry,
  MediaContext,
  MessageRecord,
} from "../context/context.types.js";

const mediaCache = new Map<string, Promise<MediaContext>>();

const buildMediaContext = (
  mediaType: MediaContext["mediaType"],
  mediaId: string,
  filePath: string,
  extractedText: string,
  source: MediaContext["source"],
  confidence: number,
): MediaContext => ({
  mediaType,
  mediaId,
  filePath,
  extractedText,
  source,
  confidence,
});

const findMediaFilePath = (
  registry: DatasetRegistry,
  message: MessageRecord,
): string => {
  if (message.media_type === "image") {
    return registry.imagesById.get(message.media_id)?.file_path ?? "";
  }

  if (message.media_type === "voice") {
    return registry.voiceNotesById.get(message.media_id)?.file_path ?? "";
  }

  return "";
};

const resolveMediaSource = (
  mediaType: MediaContext["mediaType"],
): MediaContext["source"] => {
  if (mediaType === "image") {
    return "ocr";
  }

  if (mediaType === "voice") {
    return "transcript";
  }

  return "none";
};

const buildCacheKey = (message: MessageRecord, filePath: string): string => {
  return [
    message.message_id,
    message.media_type,
    message.media_id,
    filePath,
  ].join("::");
};

export const resolveMediaContext = async (
  registry: DatasetRegistry,
  message: MessageRecord,
): Promise<MediaContext> => {
  if (!message.media_type || !message.media_id) {
    return buildMediaContext("", "", "", "", "none", 1);
  }

  const datasetFilePath = findMediaFilePath(registry, message);
  const resolvedFilePath = datasetFilePath
    ? path.join(DATASET_PATH, datasetFilePath)
    : "";
  const cacheKey = buildCacheKey(message, resolvedFilePath);

  if (mediaCache.has(cacheKey)) {
    return mediaCache.get(cacheKey)!;
  }

  const mediaPromise = (async (): Promise<MediaContext> => {
    if (!resolvedFilePath || !fs.existsSync(resolvedFilePath)) {
      return buildMediaContext(
        message.media_type,
        message.media_id,
        resolvedFilePath,
        "",
        "none",
        0,
      );
    }

    const extracted = await extractMediaWithFallbackProviders(
      buildMediaContext(
        message.media_type,
        message.media_id,
        resolvedFilePath,
        "",
        resolveMediaSource(message.media_type),
        0,
      ),
      { message },
    );

    if (!extracted) {
      if (message.media_type === "image" && message.message_text.trim()) {
        return buildMediaContext(
          message.media_type,
          message.media_id,
          resolvedFilePath,
          message.message_text.trim(),
          "ocr",
          0.35,
        );
      }

      return buildMediaContext(
        message.media_type,
        message.media_id,
        resolvedFilePath,
        "",
        resolveMediaSource(message.media_type),
        0.1,
      );
    }

    return buildMediaContext(
      message.media_type,
      message.media_id,
      resolvedFilePath,
      extracted.extractedText.trim(),
      extracted.reason.toLowerCase().includes("transcription")
        ? "transcript"
        : "ocr",
      extracted.confidence,
    );
  })();

  mediaCache.set(cacheKey, mediaPromise);
  return mediaPromise;
};

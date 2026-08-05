import fs from "node:fs";

import { logger } from "../../shared/logger/logger.js";
import {
  buildIntentPrompt,
  buildMediaPrompt,
  buildRoutingPrompt,
} from "./prompt.js";
import {
  parseClassificationResponse,
  parseIntentResponse,
  parseMediaResponse,
} from "./parser.js";
import type {
  AIClassification,
  IntentLLMResult,
  MediaLLMResult,
} from "./types.js";
import type { MessageContext, MediaContext } from "../context/context.types.js";

const GEMINI_DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_VISION_MODEL =
  process.env.GEMINI_VISION_MODEL || GEMINI_DEFAULT_MODEL;
const GEMINI_AUDIO_MODEL =
  process.env.GEMINI_AUDIO_MODEL || GEMINI_DEFAULT_MODEL;

const callGemini = async (
  model: string,
  prompt: string,
  inlineData?: { mimeType: string; data: string },
): Promise<string | null> => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(
    () => controller.abort(),
    Number(process.env.LLM_TIMEOUT_MS || 30000),
  );

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                ...(inlineData
                  ? [
                      {
                        inline_data: {
                          mime_type: inlineData.mimeType,
                          data: inlineData.data,
                        },
                      },
                    ]
                  : []),
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      },
    );

    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(
        payload.error?.message ||
          `Gemini request failed with ${response.status}`,
      );
    }

    const rawText =
      payload.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("")
        .trim() || "";
    logger.info(
      `LLM provider=gemini model=${model} latencyMs=${Date.now() - startedAt}`,
    );
    return rawText || null;
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const readMediaFileAsBase64 = (
  filePath: string,
): { mimeType: string; data: string } | null => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const extension = filePath.split(".").pop()?.toLowerCase() ?? "";
  const mimeType =
    extension === "jpg" || extension === "jpeg"
      ? "image/jpeg"
      : extension === "png"
        ? "image/png"
        : extension === "webp"
          ? "image/webp"
          : extension === "mp3"
            ? "audio/mpeg"
            : extension === "wav"
              ? "audio/wav"
              : extension === "m4a"
                ? "audio/mp4"
                : "application/octet-stream";

  return {
    mimeType,
    data: fs.readFileSync(filePath).toString("base64"),
  };
};

export const analyzeWithGemini = async (
  context: MessageContext,
): Promise<AIClassification | null> => {
  const rawText = await callGemini(
    GEMINI_DEFAULT_MODEL,
    buildRoutingPrompt(context),
  );
  return rawText ? parseClassificationResponse(rawText, "gemini") : null;
};

export const analyzeIntentWithGemini = async (
  context: MessageContext,
): Promise<IntentLLMResult | null> => {
  const rawText = await callGemini(
    GEMINI_DEFAULT_MODEL,
    buildIntentPrompt(context),
  );
  return rawText ? parseIntentResponse(rawText, "gemini") : null;
};

export const extractMediaWithGemini = async (
  mediaContext: MediaContext,
  messageContext: Pick<MessageContext, "message">,
): Promise<MediaLLMResult | null> => {
  if (!mediaContext.filePath) {
    return null;
  }

  const inlineData = readMediaFileAsBase64(mediaContext.filePath);
  if (!inlineData) {
    return null;
  }

  const model =
    mediaContext.mediaType === "voice"
      ? GEMINI_AUDIO_MODEL
      : GEMINI_VISION_MODEL;
  const rawText = await callGemini(
    model,
    buildMediaPrompt(mediaContext, messageContext),
    inlineData,
  );
  return rawText ? parseMediaResponse(rawText, "gemini") : null;
};

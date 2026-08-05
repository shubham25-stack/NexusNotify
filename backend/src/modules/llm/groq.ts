import * as fs from "node:fs";
import * as path from "node:path";

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

const GROQ_BASE_URL =
  process.env.GROQ_BASE_URL || "https://api.groq.com/openai/v1";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GROQ_VISION_MODEL =
  process.env.GROQ_VISION_MODEL || "llama-3.2-90b-vision-preview";
const GROQ_TRANSCRIPTION_MODEL =
  process.env.GROQ_TRANSCRIPTION_MODEL || "whisper-large-v3";

const callGroq = async (prompt: string): Promise<string | null> => {
  const apiKey = process.env.GROQ_API_KEY;
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
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        temperature: 0.1,
        messages: [
          { role: "system", content: "Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
      signal: controller.signal,
    });

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(
        payload.error?.message || `Groq request failed with ${response.status}`,
      );
    }

    const rawText = payload.choices?.[0]?.message?.content?.trim() || "";
    logger.info(
      `LLM provider=groq model=${GROQ_MODEL} latencyMs=${Date.now() - startedAt}`,
    );
    return rawText || null;
  } finally {
    clearTimeout(timeoutHandle);
  }
};

export const analyzeWithGroq = async (
  context: MessageContext,
): Promise<AIClassification | null> => {
  const rawText = await callGroq(buildRoutingPrompt(context));
  return rawText ? parseClassificationResponse(rawText, "groq") : null;
};

export const analyzeIntentWithGroq = async (
  context: MessageContext,
): Promise<IntentLLMResult | null> => {
  const rawText = await callGroq(buildIntentPrompt(context));
  return rawText ? parseIntentResponse(rawText, "groq") : null;
};

const callGroqVision = async (
  prompt: string,
  imagePath: string,
): Promise<string | null> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !fs.existsSync(imagePath)) {
    return null;
  }

  const extension = path.extname(imagePath).toLowerCase();
  const mimeType =
    extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : "image/jpeg";
  const imageData = `data:${mimeType};base64,${fs.readFileSync(imagePath).toString("base64")}`;
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(
    () => controller.abort(),
    Number(process.env.LLM_TIMEOUT_MS || 30000),
  );

  try {
    const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: GROQ_VISION_MODEL,
        temperature: 0.1,
        messages: [
          { role: "system", content: "Return only valid JSON." },
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageData } },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(
        payload.error?.message ||
          `Groq vision request failed with ${response.status}`,
      );
    }

    const rawText = payload.choices?.[0]?.message?.content?.trim() || "";
    logger.info(
      `LLM provider=groq-vision model=${GROQ_VISION_MODEL} latencyMs=${Date.now() - startedAt}`,
    );
    return rawText || null;
  } finally {
    clearTimeout(timeoutHandle);
  }
};

const callGroqTranscription = async (
  audioPath: string,
): Promise<string | null> => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || !fs.existsSync(audioPath)) {
    return null;
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutHandle = setTimeout(
    () => controller.abort(),
    Number(process.env.LLM_TIMEOUT_MS || 30000),
  );

  try {
    const audioBuffer = fs.readFileSync(audioPath);
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer]), path.basename(audioPath));
    formData.append("model", GROQ_TRANSCRIPTION_MODEL);
    formData.append("response_format", "json");

    const response = await fetch(`${GROQ_BASE_URL}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
      signal: controller.signal,
    });

    const payload = (await response.json()) as {
      text?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new Error(
        payload.error?.message ||
          `Groq transcription request failed with ${response.status}`,
      );
    }

    const rawText = (payload.text ?? "").trim();
    logger.info(
      `LLM provider=groq-transcription model=${GROQ_TRANSCRIPTION_MODEL} latencyMs=${Date.now() - startedAt}`,
    );
    return rawText || null;
  } finally {
    clearTimeout(timeoutHandle);
  }
};

export const extractMediaWithGroq = async (
  mediaContext: MediaContext,
  messageContext: Pick<MessageContext, "message">,
): Promise<MediaLLMResult | null> => {
  if (mediaContext.mediaType === "image") {
    const rawText = await callGroqVision(
      buildMediaPrompt(mediaContext, messageContext),
      mediaContext.filePath,
    );
    return rawText ? parseMediaResponse(rawText, "groq") : null;
  }

  if (mediaContext.mediaType === "voice") {
    const transcript = await callGroqTranscription(mediaContext.filePath);
    return transcript
      ? {
          provider: "groq",
          extractedText: transcript,
          confidence: 0.88,
          reason: "Audio transcription generated by Groq",
        }
      : null;
  }

  return null;
};

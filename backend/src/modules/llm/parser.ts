import { z } from "zod";

import type {
  AIClassification,
  AIProvider,
  IntentLLMResult,
  MediaLLMResult,
} from "./types.js";

const classificationSchema = z.object({
  action: z.enum(["notify", "digest", "mute"]),
  messageType: z.enum([
    "personal",
    "urgent",
    "event",
    "payment",
    "business_update",
    "promotion",
    "greeting",
    "forward",
    "spam",
    "scam",
    "unknown",
  ]),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
});

const intentSchema = z.object({
  type: z.enum([
    "personal",
    "urgent",
    "event",
    "payment",
    "business_update",
    "promotion",
    "greeting",
    "forward",
    "spam",
    "scam",
    "unknown",
  ]),
  intent: z.string().min(1),
  urgency: z.enum(["low", "medium", "high"]),
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(1),
});

const mediaSchema = z.object({
  extractedText: z.string(),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1),
});

const stripCodeFences = (rawText: string): string => {
  return rawText
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
};

const extractJsonCandidate = (rawText: string): string => {
  const sanitizedText = stripCodeFences(rawText);
  const firstBrace = sanitizedText.indexOf("{");
  const lastBrace = sanitizedText.lastIndexOf("}");

  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return sanitizedText.slice(firstBrace, lastBrace + 1);
  }

  return sanitizedText;
};

const parseWithSchema = <T>(
  rawText: string,
  schema: z.ZodType<T>,
): T | null => {
  try {
    const candidate = extractJsonCandidate(rawText);
    const parsedValue = JSON.parse(candidate) as unknown;
    const validation = schema.safeParse(parsedValue);

    if (!validation.success) {
      return null;
    }

    return validation.data;
  } catch {
    return null;
  }
};

export const parseClassificationResponse = (
  rawText: string,
  provider: AIProvider,
): AIClassification | null => {
  const parsedValue = parseWithSchema(rawText, classificationSchema);
  if (!parsedValue) {
    return null;
  }

  return {
    provider,
    ...parsedValue,
  };
};

export const parseIntentResponse = (
  rawText: string,
  provider: AIProvider,
): IntentLLMResult | null => {
  const parsedValue = parseWithSchema(rawText, intentSchema);
  if (!parsedValue) {
    return null;
  }

  return {
    provider,
    ...parsedValue,
  };
};

export const parseMediaResponse = (
  rawText: string,
  provider: AIProvider,
): MediaLLMResult | null => {
  const parsedValue = parseWithSchema(rawText, mediaSchema);
  if (!parsedValue) {
    return null;
  }

  return {
    provider,
    ...parsedValue,
  };
};

export const parseFreeTextResponse = (rawText: string): string => {
  const candidate = extractJsonCandidate(rawText);

  try {
    const parsedValue = JSON.parse(candidate) as Record<string, unknown>;
    const textValue =
      parsedValue.extractedText ??
      parsedValue.text ??
      parsedValue.transcript ??
      parsedValue.reason;

    if (typeof textValue === "string") {
      return textValue.trim();
    }
  } catch {
    return rawText.trim();
  }

  return rawText.trim();
};

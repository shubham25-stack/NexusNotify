import { logger } from "../../shared/logger/logger.js";
import { buildIntentPrompt, buildRoutingPrompt } from "./prompt.js";
import { parseClassificationResponse, parseIntentResponse } from "./parser.js";
import type { AIClassification, IntentLLMResult } from "./types.js";
import type { MessageContext } from "../context/context.types.js";

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

const callOpenRouter = async (prompt: string): Promise<string | null> => {
  const apiKey = process.env.OPENROUTER_API_KEY;
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
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.OPENROUTER_HTTP_REFERER || "http://localhost:5000",
        "X-Title": process.env.OPENROUTER_APP_NAME || "NexusNotify",
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
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
        payload.error?.message ||
          `OpenRouter request failed with ${response.status}`,
      );
    }

    const rawText = payload.choices?.[0]?.message?.content?.trim() || "";
    logger.info(
      `LLM provider=openrouter model=${OPENROUTER_MODEL} latencyMs=${Date.now() - startedAt}`,
    );
    return rawText || null;
  } finally {
    clearTimeout(timeoutHandle);
  }
};

export const analyzeWithOpenRouter = async (
  context: MessageContext,
): Promise<AIClassification | null> => {
  const rawText = await callOpenRouter(buildRoutingPrompt(context));
  return rawText ? parseClassificationResponse(rawText, "openrouter") : null;
};

export const analyzeIntentWithOpenRouter = async (
  context: MessageContext,
): Promise<IntentLLMResult | null> => {
  const rawText = await callOpenRouter(buildIntentPrompt(context));
  return rawText ? parseIntentResponse(rawText, "openrouter") : null;
};

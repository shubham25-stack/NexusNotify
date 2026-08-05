import { logger } from "../../shared/logger/logger.js";
import type {
  AIClassification,
  IntentLLMResult,
  MediaLLMResult,
} from "./types.js";
import type { MessageContext, MediaContext } from "../context/context.types.js";
import {
  analyzeIntentWithGemini,
  analyzeWithGemini,
  extractMediaWithGemini,
} from "./gemini.js";
import {
  analyzeIntentWithGroq,
  analyzeWithGroq,
  extractMediaWithGroq,
} from "./groq.js";
import {
  analyzeIntentWithOpenRouter,
  analyzeWithOpenRouter,
} from "./openrouter.js";

const routingProviders = [
  analyzeWithGemini,
  analyzeWithGroq,
  analyzeWithOpenRouter,
] as const;
const intentProviders = [
  analyzeIntentWithGemini,
  analyzeIntentWithGroq,
  analyzeIntentWithOpenRouter,
] as const;

export const analyzeWithFallbackProviders = async (
  context: MessageContext,
): Promise<AIClassification | null> => {
  for (const provider of routingProviders) {
    const startedAt = Date.now();

    try {
      const result = await provider(context);
      if (result) {
        logger.info(
          `LLM routing decision source=${result.provider} latencyMs=${Date.now() - startedAt}`,
        );
        return result;
      }
    } catch (error) {
      logger.error(`LLM routing error provider=${provider.name}`, error);
    }
  }

  return null;
};

export const analyzeIntentWithFallbackProviders = async (
  context: MessageContext,
): Promise<IntentLLMResult | null> => {
  for (const provider of intentProviders) {
    try {
      const result = await provider(context);
      if (result) {
        return result;
      }
    } catch (error) {
      logger.error(`LLM intent error provider=${provider.name}`, error);
    }
  }

  return null;
};

export const extractMediaWithFallbackProviders = async (
  mediaContext: MediaContext,
  messageContext: Pick<MessageContext, "message">,
): Promise<MediaLLMResult | null> => {
  try {
    const geminiResult = await extractMediaWithGemini(
      mediaContext,
      messageContext,
    );
    if (geminiResult) {
      return geminiResult;
    }
  } catch (error) {
    logger.error("LLM media extraction error provider=gemini", error);
  }

  try {
    const groqResult = await extractMediaWithGroq(mediaContext, messageContext);
    if (groqResult) {
      return groqResult;
    }
  } catch (error) {
    logger.error("LLM media extraction error provider=groq", error);
  }

  return null;
};

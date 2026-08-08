import { analyzeIntentWithFallbackProviders } from "../llm/manager.js";
import {
  normalizeText,
  containsAnyToken,
  clampNumber,
} from "../../shared/helpers/normalizer.js";
import type { MessageContext } from "../context/context.types.js";
import type { IntentResult } from "./types.js";

const PAYMENT = [
  "payment",
  "invoice",
  "refund",
  "upi",
  "bank",
  "transaction",
  "pay",
];
const EVENT = [
  "meeting",
  "class",
  "maintenance",
  "schedule",
  "tomorrow",
  "today",
  "notice",
];
const PROMOTION = ["sale", "offer", "discount", "coupon", "cashback", "deal"];
const SPAM = ["lottery", "winner", "free money", "click here", "gift card"];
const URGENT = ["urgent", "asap", "immediately", "deadline", "call now"];
const GREETING = ["hi", "hello", "good morning", "good evening", "thanks"];

const buildRuleIntent = (context: MessageContext): IntentResult => {
  const text = normalizeText(
    `${context.message.message_text} ${context.media.extractedText}`,
  );
  const contains = (words: string[]) =>
    words.some((word) => text.includes(word));

  if (contains(SPAM)) {
    return {
      type: "spam",
      intent: "spam",
      urgency: "low",
      confidence: 0.92,
      explanation: "Spam keywords detected.",
    };
  }

  if (contains(PAYMENT)) {
    return {
      type: "payment",
      intent: "payment reminder",
      urgency: "high",
      confidence: 0.88,
      explanation: "Payment related message.",
    };
  }

  if (contains(EVENT)) {
    return {
      type: "event",
      intent: "event update",
      urgency: "medium",
      confidence: 0.86,
      explanation: "Event related information.",
    };
  }

  if (contains(PROMOTION)) {
    return {
      type: "promotion",
      intent: "marketing",
      urgency: "low",
      confidence: 0.83,
      explanation: "Promotional content.",
    };
  }

  if (contains(URGENT)) {
    return {
      type: "urgent",
      intent: "urgent request",
      urgency: "high",
      confidence: 0.9,
      explanation: "Urgent language detected.",
    };
  }

  if (contains(GREETING)) {
    return {
      type: "greeting",
      intent: "greeting",
      urgency: "low",
      confidence: 0.8,
      explanation: "Greeting message.",
    };
  }

  return {
    type:
      context.message.conversation_type === "personal" ? "personal" : "unknown",
    intent: "general",
    urgency: "low",
    confidence: 0.65,
    explanation: "No strong intent detected.",
  };
};

export const detectIntent = async (
  context: MessageContext,
): Promise<IntentResult> => {
  const ruleIntent = buildRuleIntent(context);

  if (ruleIntent.confidence >= 0.75) {
    return ruleIntent;
  }

  const llmIntent = await analyzeIntentWithFallbackProviders(context);
  if (!llmIntent) {
    return ruleIntent;
  }

  return {
    type: llmIntent.type,
    intent: llmIntent.intent,
    urgency: llmIntent.urgency,
    confidence: clampNumber(llmIntent.confidence, 0, 0.99),
    explanation: llmIntent.explanation,
  };
};

import {
  clampNumber,
  containsAnyToken,
  normalizeText,
} from "../../shared/helpers/normalizer.js";
import { analyzeWithFallbackProviders } from "../llm/manager.js";
import type {
  DatasetRegistry,
  MessageContext,
  MessageRecord,
  MessageType,
  RoutingDecision,
} from "../context/context.types.js";
import {
  buildMessageContext,
  hasRepeatedRepetition,
} from "../context/context.service.js";
import { scoreMessage } from "../scoring/scoring.service.js";
import { findEvidenceMessageIds } from "../evidence/evidence.service.js";

const SCAM_KEYWORDS = [
  "otp",
  "click here",
  "verify now",
  "account suspended",
  "bank",
  "wallet",
  "gift card",
  "amazonpay-delivery",
  "transaction failed",
];
const SPAM_KEYWORDS = [
  "send this to",
  "forward this",
  "free money",
  "winner",
  "lottery",
  "subscribe",
  "promo",
  "deal ends",
];
const PAYMENT_KEYWORDS = [
  "payment",
  "invoice",
  "delivery",
  "refund",
  "upi",
  "bank",
  "order",
  "pay",
  "transfer",
  "receipt",
];
const EVENT_KEYWORDS = [
  "maintenance",
  "meeting",
  "class",
  "bus",
  "society",
  "water",
  "schedule",
  "notice",
  "update",
  "today",
  "tomorrow",
];
const PROMOTION_KEYWORDS = [
  "sale",
  "discount",
  "offer",
  "deal",
  "promo",
  "coupon",
  "clearance",
  "buy now",
];
const GREETING_KEYWORDS = [
  "good morning",
  "good evening",
  "hi",
  "hello",
  "thanks",
  "thank you",
];

const determineMessageType = (context: MessageContext): MessageType => {
  const messageText = normalizeText(
    [context.message.message_text, context.media.extractedText]
      .filter(Boolean)
      .join(" "),
  );
  const forwardedCount = Number.parseInt(
    context.message.forwarded_count || "0",
    10,
  );

  if (
    containsAnyToken(messageText, SCAM_KEYWORDS) ||
    context.riskSignals.includes("scam")
  ) {
    return "scam";
  }

  if (containsAnyToken(messageText, SPAM_KEYWORDS) || forwardedCount >= 3) {
    return "spam";
  }

  if (containsAnyToken(messageText, PAYMENT_KEYWORDS)) {
    return "payment";
  }

  if (containsAnyToken(messageText, EVENT_KEYWORDS)) {
    return "event";
  }

  if (context.business && containsAnyToken(messageText, PROMOTION_KEYWORDS)) {
    return "promotion";
  }

  if (
    containsAnyToken(messageText, GREETING_KEYWORDS) &&
    messageText.split(" ").length <= 12
  ) {
    return "greeting";
  }

  if (context.message.conversation_type === "business") {
    return context.prioritySignals.includes("payment")
      ? "payment"
      : "business_update";
  }

  if (context.message.conversation_type === "group") {
    if (
      context.prioritySignals.includes("urgent") ||
      context.prioritySignals.includes("event")
    ) {
      return context.prioritySignals.includes("event") ? "event" : "urgent";
    }

    if (context.message.forwarded_count !== "0") {
      return "forward";
    }

    return context.groupMember?.role === "admin" ? "event" : "personal";
  }

  return context.prioritySignals.includes("urgent") ? "urgent" : "personal";
};

const determineAction = (
  context: MessageContext,
  scores: ReturnType<typeof scoreMessage>["breakdown"],
  messageType: MessageType,
): "notify" | "digest" | "mute" => {
  if (
    scores.riskScore >= 0.68 ||
    messageType === "scam" ||
    messageType === "spam"
  ) {
    return "mute";
  }

  if (
    context.quietHoursActive &&
    messageType !== "urgent" &&
    scores.priorityScore < 0.85
  ) {
    return scores.priorityScore > 0.42 ? "digest" : "mute";
  }

  if (
    scores.priorityScore >= 0.68 &&
    scores.trustScore >= 0.4 &&
    scores.riskScore < 0.5
  ) {
    return "notify";
  }

  if (
    scores.priorityScore >= 0.42 ||
    scores.trustScore >= 0.45 ||
    scores.historyScore >= 0.35
  ) {
    return "digest";
  }

  return "mute";
};

const buildReason = (
  context: MessageContext,
  action: RoutingDecision["action"],
  messageType: MessageType,
  confidence: number,
): string => {
  const rootReason =
    action === "mute"
      ? messageType === "scam" || messageType === "spam"
        ? "Risky or repetitive content with weak user value"
        : context.quietHoursActive
          ? "Low-priority message during quiet hours"
          : "Low-value message for this user"
      : action === "notify"
        ? context.prioritySignals.includes("urgent")
          ? "Time-sensitive content with high user relevance"
          : "Trusted and relevant message that deserves immediate attention"
        : "Useful message that can be shown later";

  return `${rootReason}. Confidence ${confidence.toFixed(2)}.`;
};

export const routeMessage = async (
  registry: DatasetRegistry,
  message: MessageRecord,
): Promise<RoutingDecision> => {
  const context = await buildMessageContext(registry, message);
  const scoresResult = scoreMessage(context);
  let messageType = determineMessageType(context);
  let action = determineAction(context, scoresResult.breakdown, messageType);

  const llmHint =
    scoresResult.breakdown.confidence >= 0.75
      ? null
      : await analyzeWithFallbackProviders(context);
  if (llmHint) {
    if (llmHint.messageType !== "unknown") {
      messageType = llmHint.messageType;
    }
    action = llmHint.action;
  }

  if (hasRepeatedRepetition(context) && messageType === "promotion") {
    messageType = "spam";
    action = "mute";
  }

  const confidence = clampNumber(
    scoresResult.breakdown.confidence +
      (action === "mute" && scoresResult.breakdown.riskScore > 0.6 ? 0.08 : 0),
    0,
    0.99,
  );
  const evidenceMessageIds = findEvidenceMessageIds(registry, context, {
    messageId: message.message_id,
    action,
    messageType,
    reason: "",
    confidence,
    evidenceMessageIds: [],
    scores: scoresResult.breakdown,
  });

  return {
    messageId: message.message_id,
    action,
    messageType,
    reason: buildReason(context, action, messageType, confidence),
    confidence,
    evidenceMessageIds,
    scores: scoresResult.breakdown,
  };
};

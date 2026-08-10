import {
  clampNumber,
  containsAnyToken,
  countKeywordHits,
  normalizeText,
} from "../../shared/helpers/normalizer.js";
import type { MessageContext } from "../context/context.types.js";

export interface RiskScoreResult {
  score: number;
  signals: string[];
}

const SCAM_KEYWORDS = [
  "otp",
  "click here",
  "verify now",
  "suspended",
  "blocked",
  "gift card",
  "wallet",
  "crypto",
  "lottery",
  "prize",
  "pin",
  "password",
  "phishing",
  "amazonpay-delivery",
  "bankofamerica",
  "delivery failed",
];
const SPAM_KEYWORDS = [
  "forward this",
  "send this to",
  "chain message",
  "viral",
  "winner",
  "free money",
  "deal ends",
  "limited time",
  "subscribe",
  "promo",
];

export const calculateRiskScore = (
  context: MessageContext,
): RiskScoreResult => {
  const messageText = normalizeText(
    [context.message.message_text, context.media.extractedText]
      .filter(Boolean)
      .join(" "),
  );
  const signals: string[] = [];
  const components: number[] = [];

  if (
    context.message.media_type === "voice" ||
    context.message.media_type === "image"
  ) {
    components.push(0.15);
  }

  const scamHits = countKeywordHits(messageText, SCAM_KEYWORDS);
  if (scamHits > 0) {
    signals.push("scam_keywords");
    components.push(clampNumber(0.55 + scamHits * 0.12, 0, 1));
  }

  const spamHits = countKeywordHits(messageText, SPAM_KEYWORDS);
  if (
    spamHits > 0 ||
    Number.parseInt(context.message.forwarded_count || "0", 10) > 0
  ) {
    signals.push("spam_forwarded");
    components.push(
      clampNumber(
        0.4 +
          spamHits * 0.1 +
          Number.parseInt(context.message.forwarded_count || "0", 10) * 0.04,
        0,
        1,
      ),
    );
  }

  if (context.business && context.business.verified !== "1") {
    signals.push("unverified_business");
    components.push(0.35);
  }

  if (
    context.business &&
    containsAnyToken(context.business.domain_used_by_sender, [".in", ".com"])
  ) {
    components.push(0.08);
  }

  if (Number.parseInt(context.receiver?.messages_reported_30d ?? "0", 10) > 0) {
    components.push(0.1);
  }

  if (
    Number.parseInt(context.groupMember?.group_muted_by_user ?? "0", 10) > 0
  ) {
    signals.push("group_muted");
    components.push(0.25);
  }

  if (
    context.prioritySignals.includes("promotion") &&
    !context.userBusinessHistory.some(
      (history) => history.allows_promotions === "1",
    )
  ) {
    components.push(0.22);
  }

  return {
    score: clampNumber(Math.max(...components, 0), 0, 1),
    signals,
  };
};

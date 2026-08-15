import type { ScoreBreakdown } from "../context/context.types.js";
import type { IntentResult } from "../intent/types.js";
import type { PersonalizationResult } from "../personalization/types.js";
import type { DecisionResult } from "./types.js";

interface MatrixInput {
  scores: ScoreBreakdown;

  intent: IntentResult;

  personalization: PersonalizationResult;

  quietHours: boolean;
}

export const evaluateDecision = (input: MatrixInput): DecisionResult => {
  const reasons: string[] = [];

  let notify = 0;

  let digest = 0;

  let mute = 0;

  const intentType = input.intent.type;
  const urgencyScore =
    input.intent.urgency === "high"
      ? 1
      : input.intent.urgency === "medium"
        ? 0.5
        : 0;

  if (intentType === "spam" || intentType === "scam") {
    reasons.push("Spam / Scam");
    return {
      action: "mute",
      confidence: 0.95,
      reasons,
    };
  }

  notify += input.scores.priorityScore * 30;
  notify += input.scores.trustScore * 18;
  notify += input.personalization.score * 16;
  notify += input.scores.historyScore * 10;
  notify += urgencyScore * 20;

  digest += input.scores.loadScore * 18;
  digest += input.quietHours ? 12 : 0;

  mute += input.scores.riskScore * 45;
  mute += input.personalization.score < 0.35 ? 8 : 0;

  switch (intentType) {
    case "urgent":
      notify += 25;
      reasons.push("Urgent");
      break;
    case "payment":
      notify += 20;
      reasons.push("Payment");
      break;
    case "event":
      notify += 18;
      reasons.push("Event");
      break;
    case "business_update":
    case "promotion":
    case "greeting":
    case "personal":
    case "forward":
    case "unknown":
      digest += 12;
      break;
  }

  if (
    (intentType === "urgent" ||
      intentType === "payment" ||
      intentType === "event") &&
    input.scores.trustScore >= 0.6 &&
    input.scores.riskScore < 0.75
  ) {
    return {
      action: "notify",
      confidence: 0.91,
      reasons,
    };
  }

  if (input.scores.riskScore >= 0.7 && input.scores.trustScore < 0.6) {
    reasons.push("High risk");
    return {
      action: "mute",
      confidence: 0.93,
      reasons,
    };
  }

  if (
    input.quietHours &&
    intentType !== "urgent" &&
    intentType !== "payment" &&
    intentType !== "event"
  ) {
    digest += 10;
    mute += 8;
    reasons.push("Quiet hours");
  }

  if (
    notify >= digest &&
    notify >= mute &&
    input.scores.priorityScore >= 0.45 &&
    input.scores.riskScore < 0.6
  ) {
    return {
      action: "notify",
      confidence: 0.9,
      reasons,
    };
  }

  if (digest >= mute) {
    return {
      action: "digest",
      confidence: 0.86,
      reasons,
    };
  }

  return {
    action: "mute",
    confidence: 0.9,
    reasons,
  };
};

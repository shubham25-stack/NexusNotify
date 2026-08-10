import { clampNumber } from "../../shared/helpers/normalizer.js";
import type {
  MessageContext,
  ScoreBreakdown,
} from "../context/context.types.js";
import { calculatePriorityScore } from "./priority.service.js";
import { calculateRiskScore } from "./risk.service.js";
import { calculateTrustScore } from "./trust.service.js";

export interface ScoreResult {
  breakdown: ScoreBreakdown;
  prioritySignals: string[];
  riskSignals: string[];
  trustSignals: string[];
}

export const scoreMessage = (context: MessageContext): ScoreResult => {
  const priority = calculatePriorityScore(context);
  const trust = calculateTrustScore(context);
  const risk = calculateRiskScore(context);

  const historyScore = clampNumber(
    Math.min(context.relatedHistory.length / 5, 1) +
      Math.min(
        context.relatedEvents.filter((event) => event.message_opened === "1")
          .length / 5,
        1,
      ) *
        0.25,
    0,
    1,
  );
  const loadScore = clampNumber(
    Math.min(context.notificationLoad / 20, 1),
    0,
    1,
  );
  const personalizationScore = clampNumber(
    (context.userBusinessHistory.length > 0 ? 0.35 : 0) +
      (context.groupMember ? 0.25 : 0) +
      (context.relatedHistory.length > 0 ? 0.25 : 0) +
      (context.media.mediaType ? 0.15 : 0),
    0,
    1,
  );

  const confidence = clampNumber(
    0.3 +
      priority.score * 0.22 +
      trust.score * 0.18 +
      historyScore * 0.12 +
      personalizationScore * 0.1 -
      risk.score * 0.18 -
      loadScore * 0.08,
    0,
    0.99,
  );

  return {
    breakdown: {
      priorityScore: priority.score,
      trustScore: trust.score,
      riskScore: risk.score,
      historyScore,
      loadScore,
      personalizationScore,
      confidence,
    },
    prioritySignals: priority.signals,
    riskSignals: risk.signals,
    trustSignals: trust.signals,
  };
};

import {
  clampNumber,
  averageNumbers,
} from "../../shared/helpers/normalizer.js";
import type { MessageContext } from "../context/context.types.js";

export interface TrustScoreResult {
  score: number;
  signals: string[];
}

export const calculateTrustScore = (
  context: MessageContext,
): TrustScoreResult => {
  const signals: string[] = [];
  const components: number[] = [];

  if (context.business?.verified === "1") {
    signals.push("verified_business");
    components.push(0.82);
  }

  if (context.groupMember?.role === "admin") {
    signals.push("group_admin");
    components.push(0.78);
  }

  if ((context.userBusinessHistory[0]?.activity_count_180d ?? "0") !== "0") {
    signals.push("known_business_relationship");
    components.push(0.7);
  }

  const historyOpenRate =
    context.relatedEvents.filter((event) => event.message_opened === "1")
      .length / Math.max(context.relatedEvents.length, 1);
  components.push(clampNumber(historyOpenRate + 0.25, 0, 1));

  const dismissalPenalty =
    Number.parseInt(context.receiver?.notifications_dismissed_30d ?? "0", 10) >
    10
      ? 0.2
      : 0;
  components.push(clampNumber(0.8 - dismissalPenalty, 0, 1));

  return {
    score: clampNumber(averageNumbers(components), 0, 1),
    signals,
  };
};

import type { MessageContext } from "../context/context.types.js";
import type { PersonalizationResult } from "./types.js";

export const calculatePersonalization = (
  context: MessageContext,
): PersonalizationResult => {
  let score = 0.5;

  const reasons: string[] = [];

  /*
        BUSINESS HISTORY
    */

  if (context.userBusinessHistory.length) {
    score += 0.15;

    reasons.push("Known business");
  }

  /*
        USER READS SIMILAR MESSAGES
    */

  const opened = context.relatedEvents.filter(
    (e) => e.message_opened === "1",
  ).length;

  if (opened >= 3) {
    score += 0.15;

    reasons.push("Frequently opens similar messages");
  }

  /*
        USER REPLIES
    */

  const replied = context.relatedEvents.filter(
    (e) => e.message_replied === "1",
  ).length;

  if (replied >= 2) {
    score += 0.1;

    reasons.push("Frequently replies");
  }

  /*
        GROUP MUTED
    */

  if (context.groupMember?.group_muted_by_user === "1") {
    score -= 0.25;

    reasons.push("Muted group");
  }

  /*
        HIGH DISMISS RATE
    */

  if (Number(context.receiver?.notifications_dismissed_30d) > 30) {
    score -= 0.1;

    reasons.push("High notification dismiss rate");
  }

  /*
        QUIET HOURS
    */

  if (context.quietHoursActive) {
    score -= 0.1;
    reasons.push("Quiet hours");
  }

  score = Math.max(
    0,

    Math.min(
      score,

      1,
    ),
  );

  return {
    score,

    reasons,

    confidence: 0.9,

    userPreference: score > 0.65 ? "high" : score > 0.4 ? "medium" : "low",
  };
};

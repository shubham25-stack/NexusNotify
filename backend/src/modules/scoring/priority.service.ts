import {
  averageNumbers,
  clampNumber,
  containsAnyToken,
  countKeywordHits,
} from "../../shared/helpers/normalizer.js";
import type { MessageContext } from "../context/context.types.js";

export interface PriorityScoreResult {
  score: number;
  signals: string[];
}

const URGENT_KEYWORDS = [
  "urgent",
  "asap",
  "immediately",
  "today",
  "deadline",
  "join now",
  "call now",
  "pls respond",
  "before eod",
  "notify",
];
const EVENT_KEYWORDS = [
  "society",
  "school",
  "bus",
  "maintenance",
  "notice",
  "meeting",
  "schedule",
  "update",
  "water",
  "pickup",
  "drop",
  "class",
];
const PERSONAL_KEYWORDS = [
  "hey",
  "hello",
  "hi",
  "good morning",
  "good evening",
  "thanks",
  "ok",
  "sure",
];

export const calculatePriorityScore = (
  context: MessageContext,
): PriorityScoreResult => {
  const messageText = [
    context.message.message_text,
    context.media.extractedText,
  ]
    .filter(Boolean)
    .join(" ");
  const signals: string[] = [];
  const components: number[] = [];

  if (containsAnyToken(messageText, URGENT_KEYWORDS)) {
    signals.push("urgent_language");
    components.push(0.82);
  }

  if (containsAnyToken(messageText, EVENT_KEYWORDS)) {
    signals.push("time_sensitive_event");
    components.push(0.68);
  }

  if (context.message.conversation_type === "personal") {
    components.push(0.42);
  }

  if (
    context.group?.group_type === "school_group" ||
    context.group?.group_type === "society" ||
    context.group?.group_type === "coworker"
  ) {
    signals.push("high_value_group");
    components.push(0.66);
  }

  if (context.groupMember?.role === "admin") {
    components.push(0.12);
  }

  if (
    context.message.sender_user_id &&
    context.senderMessageHistory.length > 0
  ) {
    components.push(0.18);
  }

  if (
    containsAnyToken(messageText, PERSONAL_KEYWORDS) &&
    context.message.conversation_type === "personal"
  ) {
    components.push(0.3);
  }

  const directMentions = countKeywordHits(messageText, [
    context.receiver?.user_id ?? "",
    `@${context.receiver?.user_id ?? ""}`,
  ]);
  if (directMentions > 0) {
    signals.push("direct_mention");
    components.push(0.75);
  }

  return {
    score: clampNumber(
      averageNumbers(components.length > 0 ? components : [0.2]),
      0,
      1,
    ),
    signals,
  };
};

import { getDateOnly } from "../../shared/helpers/date.js";
import {
  normalizeText,
  similarityScore,
  tokenizeText,
  uniqueValues,
} from "../../shared/helpers/normalizer.js";
import type {
  DatasetRegistry,
  MessageContext,
  MessageHistoryRecord,
  RoutingDecision,
} from "../context/context.types.js";

const rankHistoryEvidence = (
  leftHistory: MessageHistoryRecord,
  rightMessageText: string,
): number => {
  const textScore = similarityScore(leftHistory.message_text, rightMessageText);
  const mediaBoost = leftHistory.media_type ? 0.05 : 0;
  const forwardBoost =
    Number.parseInt(leftHistory.forwarded_count || "0", 10) > 0 ? 0.05 : 0;

  return textScore + mediaBoost + forwardBoost;
};

const collectCandidateHistory = (
  registry: DatasetRegistry,
  context: MessageContext,
): MessageHistoryRecord[] => {
  const message = context.message;
  const directCandidates = [
    ...(message.sender_user_id
      ? (registry.messageHistoryByUserId.get(message.sender_user_id) ?? [])
      : []),
    ...(message.group_id
      ? (registry.messageHistoryByConversationKey.get(
          [
            message.user_id,
            message.conversation_type,
            message.group_id,
            message.business_id,
            message.sender_user_id,
          ].join("::"),
        ) ?? [])
      : []),
  ];

  return uniqueValues(
    directCandidates
      .filter((history) => history.message_id !== message.message_id)
      .sort((leftHistory, rightHistory) =>
        rightHistory.created_at.localeCompare(leftHistory.created_at),
      ),
  );
};

export const findEvidenceMessageIds = (
  registry: DatasetRegistry,
  context: MessageContext,
  decision: RoutingDecision,
): string[] => {
  const normalizedMessageText = normalizeText(
    context.message.message_text || context.media.extractedText,
  );
  const candidates = collectCandidateHistory(registry, context);

  const rankedCandidates = candidates
    .map((history) => ({
      messageId: history.message_id,
      score: rankHistoryEvidence(history, normalizedMessageText),
    }))
    .filter((candidate) => candidate.score > 0)
    .sort(
      (leftCandidate, rightCandidate) =>
        rightCandidate.score - leftCandidate.score,
    );

  const typeMatches = rankedCandidates.filter((candidate) => {
    const history = registry.messageHistoryById.get(candidate.messageId);
    if (!history) {
      return false;
    }

    if (decision.messageType === "scam" || decision.messageType === "spam") {
      return (
        normalizeText(history.message_text).includes("otp") ||
        normalizeText(history.message_text).includes("link") ||
        normalizeText(history.message_text).includes("offer")
      );
    }

    if (decision.messageType === "payment") {
      return (
        normalizeText(history.message_text).includes("payment") ||
        normalizeText(history.message_text).includes("delivery") ||
        normalizeText(history.message_text).includes("invoice")
      );
    }

    if (decision.messageType === "event") {
      return (
        normalizeText(history.message_text).includes("today") ||
        normalizeText(history.message_text).includes("schedule") ||
        normalizeText(history.message_text).includes("reminder")
      );
    }

    return tokenizeText(history.message_text).some((token) =>
      normalizedMessageText.includes(token),
    );
  });

  const selectedIds = (typeMatches.length > 0 ? typeMatches : rankedCandidates)
    .map((candidate) => candidate.messageId)
    .filter(Boolean)
    .slice(0, 3);

  return selectedIds.length > 0 ? uniqueValues(selectedIds) : ["none"];
};

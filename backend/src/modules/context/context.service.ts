import {
  getDateOnly,
  getTimeOfDay,
  isWithinQuietHours,
} from "../../shared/helpers/date.js";
import {
  containsAnyToken,
  countKeywordHits,
  normalizeText,
} from "../../shared/helpers/normalizer.js";
import { resolveMediaContext } from "../media/media.service.js";
import { getGroupMemberKey } from "../dataset/registry.js";
import type {
  DatasetRegistry,
  MessageContext,
  MessageRecord,
  MessageHistoryRecord,
} from "./context.types.js";

const URGENT_KEYWORDS = [
  "urgent",
  "asap",
  "now",
  "immediately",
  "today",
  "deadline",
  "last chance",
  "before eod",
  "join",
  "call",
  "payment failed",
];
const PAYMENT_KEYWORDS = [
  "payment",
  "pay",
  "invoice",
  "refund",
  "upi",
  "otp",
  "bank",
  "delivery failed",
  "account frozen",
  "verify",
  "transaction",
];
const PROMOTION_KEYWORDS = [
  "sale",
  "discount",
  "offer",
  "deal",
  "promo",
  "limited",
  "cashback",
  "clearance",
  "coupon",
];
const EVENT_KEYWORDS = [
  "event",
  "meeting",
  "schedule",
  "notice",
  "reminder",
  "bus",
  "class",
  "maintenance",
  "water",
  "update",
  "tomorrow",
  "today",
];

const buildSignalList = (
  messageText: string,
  keywordGroups: Array<{ label: string; keywords: string[] }>,
): string[] => {
  const signals: string[] = [];

  for (const group of keywordGroups) {
    if (containsAnyToken(messageText, group.keywords)) {
      signals.push(group.label);
    }
  }

  return signals;
};

const getRelatedHistory = (
  registry: DatasetRegistry,
  message: MessageRecord,
): MessageContext["relatedHistory"] => {
  const directHistory =
    registry.messageHistoryByUserId.get(message.user_id) ?? [];

  const groupHistory = message.group_id
    ? (registry.messageHistoryByConversationKey.get(
        [
          message.user_id,
          message.conversation_type,
          message.group_id,
          message.business_id,
          message.sender_user_id,
        ].join("::"),
      ) ?? [])
    : [];

  // Deduplicate history items safely
  const uniqueHistory = new Map<string, (typeof directHistory)[number]>();
  for (const item of [...directHistory, ...groupHistory]) {
    uniqueHistory.set(item.message_id, item);
  }

  // Sort by created_at descending safely and return top 15
  return [...uniqueHistory.values()]
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 15);
};

const getRelatedEvents = (
  registry: DatasetRegistry,
  history: MessageContext["relatedHistory"],
): MessageContext["relatedEvents"] => {
  const events = history.flatMap(
    (historyRow) =>
      registry.messageEventsByMessageId.get(historyRow.message_id) ?? [],
  );

  return events
    .sort((leftEvent, rightEvent) =>
      rightEvent.message_id.localeCompare(leftEvent.message_id),
    )
    .slice(0, 15);
};

const getNotificationSummary = (
  registry: DatasetRegistry,
  message: MessageRecord,
) => {
  const dateOnly = getDateOnly(message.created_at);
  return (
    registry.dailySummaryByUserDate.get(
      [message.user_id, dateOnly].join("::"),
    ) ??
    (registry.dailySummaryByUserId.get(message.user_id) ?? [])[0] ??
    null
  );
};

export const buildMessageContext = async (
  registry: DatasetRegistry,
  message: MessageRecord,
): Promise<MessageContext> => {
  const receiver = registry.usersById.get(message.user_id) ?? null;
  const group = message.group_id
    ? (registry.groupsById.get(message.group_id) ?? null)
    : null;
  const groupMember = message.group_id
    ? (registry.groupMembersByKey.get(
        getGroupMemberKey(message.group_id, message.user_id),
      ) ?? null)
    : null;
  const business = message.business_id
    ? (registry.businessAccountsById.get(message.business_id) ?? null)
    : null;

  const userBusinessHistory = message.business_id
    ? (registry.businessHistoryByUserId.get(message.user_id) ?? [])
    : [];

  const relatedHistory = getRelatedHistory(registry, message);
  const relatedEvents = getRelatedEvents(registry, relatedHistory);
  const notificationSummary = getNotificationSummary(registry, message);
  const media = await resolveMediaContext(registry, message);

  const messageText = normalizeText(
    [
      message.message_text,
      media.extractedText,
      business?.brand_name,
      group?.group_name,
    ]
      .filter(Boolean)
      .join(" "),
  );

  // Build base priority signals from text
  const prioritySignals = buildSignalList(messageText, [
    { label: "urgent", keywords: URGENT_KEYWORDS },
    { label: "payment", keywords: PAYMENT_KEYWORDS },
    { label: "event", keywords: EVENT_KEYWORDS },
    { label: "promotion", keywords: PROMOTION_KEYWORDS },
  ]);

  // Contextual Priority Signals
  if (message.conversation_type === "personal") {
    prioritySignals.push("direct_message");
  }
  if (groupMember?.role === "admin") {
    prioritySignals.push("group_admin");
  }
  if (business?.verified === "1") {
    prioritySignals.push("verified_business");
  }

  // Build base risk signals from text
  const riskSignals = buildSignalList(messageText, [
    {
      label: "scam",
      keywords: [
        "otp",
        "click here",
        "verify now",
        "account suspended",
        "wallet",
        "amazonpay-delivery",
        "banking",
        "gift card",
      ],
    },
    {
      label: "spam",
      keywords: [
        "send this to",
        "forward",
        "chain",
        "lottery",
        "winner",
        "free money",
        "guaranteed",
        "subscription",
      ],
    },
  ]);

  // Contextual Risk Signals
  if (Number(message.forwarded_count ?? 0) >= 5) {
    riskSignals.push("high_forward_count");
  }
  if (business && business.verified !== "1") {
    riskSignals.push("unverified_business");
  }
  if (groupMember?.group_muted_by_user === "1") {
    riskSignals.push("muted_group");
  }

  const quietHoursActive = receiver
    ? isWithinQuietHours(
        getTimeOfDay(message.created_at),
        receiver.do_not_disturb_window,
      )
    : false;

  const notificationLoad = notificationSummary
    ? Number.parseInt(notificationSummary.notifications_sent, 10) || 0
    : 0;
  return {
    message,
    receiver,
    senderMessageHistory:
      registry.messageHistoryByUserId.get(message.sender_user_id) ?? [],
    relatedHistory,
    relatedEvents,
    userBusinessHistory,
    group,
    groupMember,
    business,
    media,
    notificationSummary,
    quietHoursActive,
    notificationLoad,
    riskSignals,
    prioritySignals,
  };
};

export const hasRepeatedRepetition = (context: MessageContext): boolean => {
  const text = [context.message.message_text, context.media.extractedText]
    .filter(Boolean)
    .join(" ");
  const tokenHits = countKeywordHits(text, [
    "reminder",
    "update",
    "payment",
    "sale",
    "offer",
    "urgent",
  ]);
  return (
    tokenHits >= 3 ||
    Number.parseInt(context.message.forwarded_count || "0", 10) >= 5
  );
};

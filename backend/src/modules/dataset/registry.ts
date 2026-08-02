import type {
  DatasetBundle,
  DatasetRegistry,
  GroupMemberRecord,
  MessageEventRecord,
  MessageHistoryRecord,
} from "../context/context.types.js";

const KEY_SEPARATOR = "::";

const buildKey = (...parts: Array<string | undefined>): string => {
  return parts.map((part) => part ?? "").join(KEY_SEPARATOR);
};

const pushToMap = <T>(map: Map<string, T[]>, key: string, value: T): void => {
  const values = map.get(key) ?? [];
  values.push(value);
  map.set(key, values);
};

const createUniqueMap = <T, K extends keyof T>(
  items: T[],
  keyField: K,
  label: string,
): Map<string, T> => {
  const map = new Map<string, T>();

  for (const item of items) {
    const key = String(item[keyField]);
    if (map.has(key)) {
      console.warn(`[Registry] Duplicate ${label} found: ${key}`);
    }

    map.set(key, item);
  }

  return map;
};

export const createDatasetRegistry = (
  bundle: DatasetBundle,
): DatasetRegistry => {
  if (bundle.messages.length === 0) {
    throw new Error("Dataset Registry Error: No messages found.");
  }

  if (bundle.users.length === 0) {
    throw new Error("Dataset Registry Error: No users found.");
  }

  if (bundle.messageHistory.length === 0) {
    console.warn("[Registry] Warning: Message history is empty.");
  }

  const messagesById = createUniqueMap(
    bundle.messages,
    "message_id",
    "message_id",
  );
  const messagesByUserId = new Map<string, typeof bundle.messages>();
  const usersById = createUniqueMap(bundle.users, "user_id", "user_id");
  const groupsById = createUniqueMap(bundle.groups, "group_id", "group_id");
  const groupMembersByKey = new Map<string, GroupMemberRecord>();
  const groupMembersByUserId = new Map<string, GroupMemberRecord[]>();
  const businessAccountsById = createUniqueMap(
    bundle.businessAccounts,
    "business_id",
    "business_id",
  );
  const businessHistoryByKey = new Map(
    bundle.businessHistory.map((history) => [
      buildKey(history.user_id, history.business_id),
      history,
    ]),
  );
  const businessHistoryByUserId = new Map<
    string,
    typeof bundle.businessHistory
  >();
  const messageHistoryById = createUniqueMap(
    bundle.messageHistory,
    "message_id",
    "history message_id",
  );
  const messageHistoryByUserId = new Map<string, MessageHistoryRecord[]>();
  const messageHistoryByConversationKey = new Map<
    string,
    MessageHistoryRecord[]
  >();
  const messageEventsByMessageId = new Map<string, MessageEventRecord[]>();
  const messageEventsByUserId = new Map<string, MessageEventRecord[]>();
  const dailySummaryByUserDate = new Map(
    bundle.dailyNotificationSummary.map((summary) => [
      buildKey(summary.user_id, summary.date),
      summary,
    ]),
  );
  const dailySummaryByUserId = new Map<
    string,
    typeof bundle.dailyNotificationSummary
  >();
  const imagesById = createUniqueMap(bundle.images, "image_id", "image_id");
  const voiceNotesById = createUniqueMap(
    bundle.voiceNotes,
    "voice_note_id",
    "voice_note_id",
  );

  for (const message of bundle.messages) {
    pushToMap(messagesByUserId, message.user_id, message);
  }

  for (const groupMember of bundle.groupMembers) {
    groupMembersByKey.set(
      buildKey(groupMember.group_id, groupMember.user_id),
      groupMember,
    );
    pushToMap(groupMembersByUserId, groupMember.user_id, groupMember);
  }

  for (const businessHistory of bundle.businessHistory) {
    pushToMap(
      businessHistoryByUserId,
      businessHistory.user_id,
      businessHistory,
    );
  }

  for (const history of bundle.messageHistory) {
    pushToMap(messageHistoryByUserId, history.user_id, history);
    pushToMap(
      messageHistoryByConversationKey,
      buildKey(
        history.user_id,
        history.conversation_type,
        history.group_id,
        history.business_id,
        history.sender_user_id,
      ),
      history,
    );
  }

  for (const event of bundle.messageEvents) {
    pushToMap(messageEventsByMessageId, event.message_id, event);
    pushToMap(messageEventsByUserId, event.user_id, event);
  }

  for (const summary of bundle.dailyNotificationSummary) {
    pushToMap(dailySummaryByUserId, summary.user_id, summary);
  }

  return {
    bundle,
    messagesById,
    messagesByUserId,
    usersById,
    groupsById,
    groupMembersByKey,
    groupMembersByUserId,
    businessAccountsById,
    businessHistoryByKey,
    businessHistoryByUserId,
    messageHistoryById,
    messageHistoryByUserId,
    messageHistoryByConversationKey,
    messageEventsByMessageId,
    messageEventsByUserId,
    dailySummaryByUserDate,
    dailySummaryByUserId,
    imagesById,
    voiceNotesById,
  };
};

export const getGroupMemberKey = (groupId: string, userId: string): string =>
  buildKey(groupId, userId);
export const getBusinessHistoryKey = (
  userId: string,
  businessId: string,
): string => buildKey(userId, businessId);

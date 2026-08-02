export type ConversationType = "personal" | "group" | "business";
export type MediaType = "" | "image" | "voice";
export type Action = "notify" | "digest" | "mute";

export type MessageType =
  | "personal"
  | "urgent"
  | "event"
  | "payment"
  | "business_update"
  | "promotion"
  | "greeting"
  | "forward"
  | "spam"
  | "scam"
  | "unknown";

export interface MessageRecord {
  message_id: string;
  user_id: string;
  conversation_type: ConversationType;
  group_id: string;
  business_id: string;
  sender_user_id: string;
  created_at: string;
  message_text: string;
  media_type: MediaType;
  media_id: string;
  forwarded_count: string;
}

export interface UserRecord {
  user_id: string;
  do_not_disturb_window: string;
  messages_opened_30d: string;
  messages_replied_30d: string;
  notifications_dismissed_30d: string;
  messages_reported_30d: string;
}

export interface GroupRecord {
  group_id: string;
  group_name: string;
  group_type: string;
  member_count: string;
  admin_count: string;
  created_at: string;
  messages_30d: string;
}

export interface GroupMemberRecord {
  group_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  messages_sent_30d: string;
  messages_read_30d: string;
  replies_sent_30d: string;
  notifications_dismissed_30d: string;
  group_muted_by_user: string;
}

export interface BusinessAccountRecord {
  business_id: string;
  display_name: string;
  brand_name: string;
  category: string;
  verified: string;
  official_domain: string;
  domain_used_by_sender: string;
  account_age_days: string;
  messages_sent_30d: string;
  user_reports_30d: string;
  domain_used_by_sender_age_days: string;
}

export interface UserBusinessHistoryRecord {
  user_id: string;
  business_id: string;
  why_user_knows_account: string;
  last_activity_at: string;
  allows_promotions: string;
  promotions_opted_out_at: string;
  activity_count_180d: string;
  messages_opened_30d: string;
  messages_dismissed_30d: string;
  messages_replied_30d: string;
  last_reply_at: string;
}

export interface MessageHistoryRecord {
  message_id: string;
  user_id: string;
  conversation_type: ConversationType;
  group_id: string;
  business_id: string;
  sender_user_id: string;
  created_at: string;
  message_text: string;
  media_type: MediaType;
  media_id: string;
  forwarded_count: string;
}

export interface MessageEventRecord {
  user_id: string;
  message_id: string;
  message_opened: string;
  message_replied: string;
  reaction_time_minutes: string;
  notification_dismissed: string;
  muted_after_message: string;
  message_reported: string;
}

export interface DailyNotificationSummaryRecord {
  user_id: string;
  date: string;
  notifications_sent: string;
  notifications_dismissed: string;
}

export interface ImageRecord {
  image_id: string;
  file_path: string;
}

export interface VoiceNoteRecord {
  voice_note_id: string;
  file_path: string;
}

export interface DatasetBundle {
  messages: MessageRecord[];
  users: UserRecord[];
  groups: GroupRecord[];
  groupMembers: GroupMemberRecord[];
  businessAccounts: BusinessAccountRecord[];
  businessHistory: UserBusinessHistoryRecord[];
  messageHistory: MessageHistoryRecord[];
  messageEvents: MessageEventRecord[];
  dailyNotificationSummary: DailyNotificationSummaryRecord[];
  images: ImageRecord[];
  voiceNotes: VoiceNoteRecord[];
}

export interface MediaContext {
  mediaType: MediaType;
  mediaId: string;
  filePath: string;
  extractedText: string;
  source: "none" | "metadata" | "ocr" | "transcript";
  confidence: number;
}

export interface MessageContext {
  message: MessageRecord;
  receiver: UserRecord | null;
  senderMessageHistory: MessageHistoryRecord[];
  relatedHistory: MessageHistoryRecord[];
  relatedEvents: MessageEventRecord[];
  userBusinessHistory: UserBusinessHistoryRecord[];
  group: GroupRecord | null;
  groupMember: GroupMemberRecord | null;
  business: BusinessAccountRecord | null;
  media: MediaContext;
  notificationSummary: DailyNotificationSummaryRecord | null;
  quietHoursActive: boolean;
  notificationLoad: number;
  riskSignals: string[];
  prioritySignals: string[];
}

export interface ScoreBreakdown {
  priorityScore: number;
  trustScore: number;
  riskScore: number;
  historyScore: number;
  loadScore: number;
  personalizationScore: number;
  confidence: number;
}

export interface RoutingDecision {
  messageId: string;
  action: Action;
  messageType: MessageType;
  reason: string;
  confidence: number;
  evidenceMessageIds: string[];
  scores: ScoreBreakdown;
}

export interface DatasetRegistry {
  bundle: DatasetBundle;
  messagesById: Map<string, MessageRecord>;
  messagesByUserId: Map<string, MessageRecord[]>;
  usersById: Map<string, UserRecord>;
  groupsById: Map<string, GroupRecord>;
  groupMembersByKey: Map<string, GroupMemberRecord>;
  groupMembersByUserId: Map<string, GroupMemberRecord[]>;
  businessAccountsById: Map<string, BusinessAccountRecord>;
  businessHistoryByKey: Map<string, UserBusinessHistoryRecord>;
  businessHistoryByUserId: Map<string, UserBusinessHistoryRecord[]>;
  messageHistoryById: Map<string, MessageHistoryRecord>;
  messageHistoryByUserId: Map<string, MessageHistoryRecord[]>;
  messageHistoryByConversationKey: Map<string, MessageHistoryRecord[]>;
  messageEventsByMessageId: Map<string, MessageEventRecord[]>;
  messageEventsByUserId: Map<string, MessageEventRecord[]>;
  dailySummaryByUserDate: Map<string, DailyNotificationSummaryRecord>;
  dailySummaryByUserId: Map<string, DailyNotificationSummaryRecord[]>;
  imagesById: Map<string, ImageRecord>;
  voiceNotesById: Map<string, VoiceNoteRecord>;
}

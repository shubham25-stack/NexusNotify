import path from "path";

export const DATASET_PATH = path.join(process.cwd(), "src", "dataset");

export const DATASET_FILES = {
  messages: "messages.csv",
  users: "users.csv",
  groups: "groups.csv",
  groupMembers: "group_members.csv",
  businessAccounts: "business_accounts.csv",
  businessHistory: "user_business_history.csv",
  messageHistory: "message_history.csv",
  messageEvents: "message_events.csv",
  dailyNotificationSummary: "daily_notification_summary.csv",
  images: "images.csv",
  voiceNotes: "voice_notes.csv",
  output: "output.csv",
} as const;

export type IntentType =
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

export type UrgencyLevel = "low" | "medium" | "high";

export interface IntentResult {
  type: IntentType;
  intent: string;
  urgency: UrgencyLevel;
  confidence: number;
  explanation: string;
}

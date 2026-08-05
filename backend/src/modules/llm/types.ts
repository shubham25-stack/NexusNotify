import type { MessageContext, MediaContext } from "../context/context.types.js";

export type AIProvider = "gemini" | "groq" | "openrouter";

export type LlmTask =
  "routing" | "intent" | "media_ocr" | "media_transcription";

export interface AIClassification {
  provider: AIProvider;
  action: "notify" | "digest" | "mute";
  messageType:
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
  confidence: number;
  reason: string;
}

export interface IntentLLMResult {
  type: AIClassification["messageType"];
  intent: string;
  urgency: "low" | "medium" | "high";
  confidence: number;
  explanation: string;
  provider: AIProvider;
}

export interface MediaLLMResult {
  provider: AIProvider;
  extractedText: string;
  confidence: number;
  reason: string;
}

export interface ProviderCallContext {
  messageContext: MessageContext;
  task: LlmTask;
  mediaContext?: MediaContext;
}

export interface ProviderCallResult<T> {
  provider: AIProvider;
  value: T;
  rawText: string;
  latencyMs: number;
}

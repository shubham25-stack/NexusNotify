import type { MessageContext, MediaContext } from "../context/context.types.js";

const buildStructuredContext = (
  context: MessageContext,
): Record<string, unknown> => ({
  message: context.message,
  receiver: context.receiver,
  group: context.group,
  business: context.business,
  media: context.media,
  historyCount: context.relatedHistory.length,
  eventCount: context.relatedEvents.length,
  businessHistoryCount: context.userBusinessHistory.length,
  quietHours: context.quietHoursActive,
  notificationLoad: context.notificationLoad,
  prioritySignals: context.prioritySignals,
  riskSignals: context.riskSignals,
});

export const buildRoutingPrompt = (context: MessageContext): string => `
You are an AI Notification Router for WhatsApp.

Task:
Classify one incoming message into a final action and message type.

Return ONLY valid JSON with this exact schema:
{
	"action": "notify|digest|mute",
	"messageType": "personal|urgent|event|payment|business_update|promotion|greeting|forward|spam|scam|unknown",
	"confidence": 0.0,
	"reason": "short explanation"
}

Rules:
- Prefer notify for urgent, trusted, time-sensitive, direct-mention, or user-relevant messages.
- Prefer digest for useful but non-urgent updates.
- Prefer mute for repetitive, suspicious, scam-like, risky, or low-value messages.
- Use the supplied context. Do not invent facts.
- If uncertain, lower confidence rather than guessing.

Context:
${JSON.stringify(buildStructuredContext(context), null, 2)}
`;

export const buildIntentPrompt = (context: MessageContext): string => `
You are an intent classifier for WhatsApp messages.

Return ONLY valid JSON with this exact schema:
{
	"type": "personal|urgent|event|payment|business_update|promotion|greeting|forward|spam|scam|unknown",
	"intent": "short label",
	"urgency": "low|medium|high",
	"confidence": 0.0,
	"explanation": "short reason"
}

Classify the primary intent, urgency, and confidence using message text, media text, group/business context, and user history.

Context:
${JSON.stringify(buildStructuredContext(context), null, 2)}
`;

export const buildMediaPrompt = (
  mediaContext: MediaContext,
  messageContext: Pick<MessageContext, "message">,
): string => `
You are an OCR and speech-to-text engine for WhatsApp media.

Task:
Extract the exact visible text from the image or the exact spoken words from the voice note.

Return ONLY valid JSON with this exact schema:
{
	"extractedText": "plain text only",
	"confidence": 0.0,
	"reason": "short reason"
}

Rules:
- Do not summarize.
- Do not guess missing words.
- If the media is unreadable or unclear, return an empty string with low confidence.

Media Context:
${JSON.stringify(
  {
    messageId: messageContext.message.message_id,
    mediaType: mediaContext.mediaType,
    mediaId: mediaContext.mediaId,
    filePath: mediaContext.filePath,
    receiverId: messageContext.message.user_id,
    conversationType: messageContext.message.conversation_type,
  },
  null,
  2,
)}
`;

import { MessageApi } from "../api/message";

/**
 * Message type categories for filtering and visual distinction.
 * Uses numeric enum following codebase conventions.
 */
export enum MessageType {
  CHAT = 1,
  PLAYER_ACTION = 2,
  TURN_EVENT = 3,
  SYSTEM_EVENT = 4,
}

/**
 * Human-readable labels for each message type
 */
export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  [MessageType.CHAT]: "Chat",
  [MessageType.PLAYER_ACTION]: "Player Actions",
  [MessageType.TURN_EVENT]: "Turn Events",
  [MessageType.SYSTEM_EVENT]: "System",
};

/**
 * Patterns for detecting player actions in message text.
 * Format: <@user-123> (color) action
 */
const PLAYER_ACTION_PATTERN = /<@user-\d+> \([^)]+\)/;

/**
 * Keywords that indicate turn/round events
 */
const TURN_EVENT_KEYWORDS = [
  "start round",
  "passes",
  "game over",
  "turn order",
  "income phase",
  "expenses phase",
  "auction phase",
  "build phase",
  "movement phase",
  "shares phase",
  "end of round",
  "new turn order",
];

/**
 * Detects the type of a message based on its content and metadata.
 * 
 * Detection logic:
 * 1. If userId present → CHAT (user-sent message)
 * 2. If contains player action format → PLAYER_ACTION
 * 3. If contains turn/round keywords → TURN_EVENT
 * 4. Otherwise → SYSTEM_EVENT
 * 
 * @param message The message to analyze
 * @returns The detected message type
 */
export function detectMessageType(message: MessageApi): MessageType {
  // User messages are always chat
  if (message.userId != null) {
    return MessageType.CHAT;
  }

  const text = message.message.toLowerCase();

  // Check for player action pattern (e.g., "<@user-123> (red) builds track")
  if (PLAYER_ACTION_PATTERN.test(message.message)) {
    return MessageType.PLAYER_ACTION;
  }

  // Check for turn event keywords
  if (TURN_EVENT_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return MessageType.TURN_EVENT;
  }

  // Default to system event
  return MessageType.SYSTEM_EVENT;
}

/**
 * Checks if a message mentions a specific user.
 * Only checks for already-parsed mention format: <@user-{userId}>
 * 
 * @param messageText The message text to check
 * @param userId The user ID to look for, or undefined if no user logged in
 * @returns True if the message mentions the specified user
 */
export function containsMentionOfUser(
  messageText: string,
  userId: number | undefined,
): boolean {
  if (userId == null) {
    return false;
  }

  // Check for parsed mention format
  const mentionPattern = new RegExp(`<@user-${userId}>`);
  return mentionPattern.test(messageText);
}

/**
 * Get all message types as an array (useful for iteration)
 */
export function getAllMessageTypes(): MessageType[] {
  return [
    MessageType.CHAT,
    MessageType.PLAYER_ACTION,
    MessageType.TURN_EVENT,
    MessageType.SYSTEM_EVENT,
  ];
}

/**
 * Extracts the "actor" (user ID) responsible for a message.
 * Used for visual grouping of consecutive messages by the same actor.
 * 
 * Extraction logic:
 * 1. Chat messages → userId
 * 2. Player actions → parse userId from <@user-123> at start
 * 3. Turn/system events → null (no specific actor)
 * 
 * @param message The message to analyze
 * @returns The user ID of the actor, or null if no specific actor
 */
export function getMessageActor(message: MessageApi): number | null {
  // Chat messages have explicit userId
  if (message.userId != null) {
    return message.userId;
  }

  // Try to extract actor from player action format: <@user-123> ...
  const actorMatch = message.message.match(/^<@user-(\d+)>/);
  if (actorMatch) {
    return Number(actorMatch[1]);
  }

  // No specific actor for turn/system events
  return null;
}

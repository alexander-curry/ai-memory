export type ChannelId =
  | "instagram"
  | "facebook"
  | "messenger"
  | "telegram"
  | "whatsapp"
  | "imessage"
  | "google"
  | "gmail"
  | "yahoo"
  | "tiktok";

export type Category = "travel" | "food" | "work" | "shopping" | "home" | "events";

export type Tint = "green" | "blue" | "purple" | "neutral";

export type ItemType = "event" | "reservation" | "link" | "video" | "photo";

export interface Contact {
  id: string;
  name: string;
  fullName: string;
  relation: string;
  color: string;
  channels: ChannelId[];
  /** minutes since they were last active */
  activeMinsAgo: number;
  pinned?: boolean;
  custom?: boolean;
}

export interface PlanStep {
  title: string;
  detail: string;
  inDays?: number;
}

export interface Suggestion {
  title: string;
  subtitle: string;
  steps: PlanStep[];
}

export interface Collection {
  id: string;
  title: string;
  category: Category;
  tint: Tint;
  cover?: string;
  icon?: string;
  contactIds: string[];
  /** builds the summary text; d(offset) formats a date relative to today */
  summary: (d: (offsetDays: number) => string) => string;
  suggestion?: Suggestion;
  pinned?: boolean;
  custom?: boolean;
}

export interface Item {
  id: string;
  collectionId: string;
  type: ItemType;
  title: string;
  detail?: string;
  url?: string;
  image?: string;
  /** for events/reservations: days from today */
  eventInDays?: number;
  time?: string;
  channel: ChannelId;
  contactId: string;
  /** when it was shared, in minutes ago */
  sharedMinsAgo: number;
  /** the original message the item was found in */
  quote?: string;
  tags?: string[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  source?: "ai" | "local";
  createdAt: number;
}

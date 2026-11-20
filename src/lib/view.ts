import { COLLECTIONS, CONTACTS, ITEMS, channelName } from "./data";
import type { Category, ChannelId, Contact, Item, Suggestion, Tint } from "./types";

export interface ViewInput {
  connected: ChannelId[];
  deletedCollections: string[];
  deletedContacts: string[];
  renamed: Record<string, string>;
  pinnedCollections: Record<string, boolean>;
  pinnedContacts: Record<string, boolean>;
  customCollections: {
    id: string;
    title: string;
    category: Category;
    tint: Tint;
    cover?: string;
    contactIds: string[];
    itemIds: string[];
    createdAt: number;
  }[];
  customContacts: Contact[];
}

export interface ViewCollection {
  id: string;
  title: string;
  category: Category;
  tint: Tint;
  cover?: string;
  contactIds: string[];
  pinned: boolean;
  custom: boolean;
  items: Item[];
  updatedMinsAgo: number;
  summary: string;
  suggestion?: Suggestion;
  channels: ChannelId[];
}

export interface ViewContact extends Contact {
  pinned: boolean;
  collectionIds: string[];
  categories: Category[];
  foundChannels: ChannelId[];
}

export interface View {
  collections: ViewCollection[];
  contacts: ViewContact[];
  items: Item[];
  collection: (id: string) => ViewCollection | undefined;
  contact: (id: string) => ViewContact | undefined;
  item: (id: string) => Item | undefined;
}

const DAY = 24 * 60 * 60 * 1000;

export const dateFor = (offsetDays: number, now = Date.now()) => new Date(now + offsetDays * DAY);

export const formatDay = (offsetDays: number, now = Date.now()) => {
  const d = dateFor(offsetDays, now);
  const sameYear = d.getFullYear() === new Date(now).getFullYear();
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  });
};

export const formatLongDay = (offsetDays: number, now = Date.now()) =>
  dateFor(offsetDays, now).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

export const relativeDay = (offsetDays: number) => {
  if (offsetDays === 0) return "Today";
  if (offsetDays === 1) return "Tomorrow";
  if (offsetDays < 7) return `In ${offsetDays} days`;
  if (offsetDays < 14) return "Next week";
  if (offsetDays < 60) return `In ${Math.round(offsetDays / 7)} weeks`;
  return `In ${Math.round(offsetDays / 30)} months`;
};

export const ago = (mins: number) => {
  if (mins < 2) return "just now";
  if (mins < 60) return `${Math.round(mins)} min ago`;
  const h = mins / 60;
  if (h < 24) return `${Math.round(h)}h ago`;
  const d = h / 24;
  if (d < 2) return "yesterday";
  if (d < 7) return `${Math.round(d)}d ago`;
  if (d < 30) return `${Math.round(d / 7)} week${Math.round(d / 7) > 1 ? "s" : ""} ago`;
  return `${Math.round(d / 30)} month${Math.round(d / 30) > 1 ? "s" : ""} ago`;
};

export const activeLabel = (mins: number) => {
  if (mins < 5) return "Active just now";
  if (mins < 60) return `Active ${Math.round(mins)} min ago`;
  if (mins < 60 * 24) return `Active ${Math.round(mins / 60)}h ago`;
  if (mins < 60 * 48) return "Active yesterday";
  return `Active ${Math.round(mins / 1440)} days ago`;
};

export const listChannels = (ids: ChannelId[]) => {
  const names = ids.map(channelName);
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
};

export function computeView(input: ViewInput, now = Date.now()): View {
  const connected = new Set(input.connected);
  const deletedContacts = new Set(input.deletedContacts);
  const deletedCollections = new Set(input.deletedCollections);
  const d = (n: number) => formatDay(n, now);

  const items = ITEMS.filter((i) => connected.has(i.channel) && !deletedContacts.has(i.contactId));
  const itemById = new Map(items.map((i) => [i.id, i]));

  const seedCollections: ViewCollection[] = COLLECTIONS.filter((c) => !deletedCollections.has(c.id))
    .map((c) => {
      const its = items.filter((i) => i.collectionId === c.id);
      const contactIds = c.contactIds.filter(
        (id) => !deletedContacts.has(id) && its.some((i) => i.contactId === id),
      );
      return {
        id: c.id,
        title: input.renamed[c.id] ?? c.title,
        category: c.category,
        tint: c.tint,
        cover: c.cover,
        contactIds,
        pinned: input.pinnedCollections[c.id] ?? !!c.pinned,
        custom: false,
        items: its,
        updatedMinsAgo: its.length ? Math.min(...its.map((i) => i.sharedMinsAgo)) : 99999,
        summary: c.summary(d),
        suggestion: c.suggestion,
        channels: [...new Set(its.map((i) => i.channel))],
      };
    })
    .filter((c) => c.items.length > 0);

  const customCollections: ViewCollection[] = input.customCollections.map((c) => {
    const its = c.itemIds.map((id) => itemById.get(id)).filter(Boolean) as Item[];
    const contactIds = c.contactIds.filter((id) => !deletedContacts.has(id));
    const mins = Math.max(0, (now - c.createdAt) / 60000);
    const names = contactIds
      .map((id) => [...CONTACTS, ...input.customContacts].find((x) => x.id === id)?.name)
      .filter(Boolean) as string[];
    const withWho = names.length ? ` with ${names.join(", ")}` : "";
    return {
      id: c.id,
      title: input.renamed[c.id] ?? c.title,
      category: c.category,
      tint: c.tint,
      cover: c.cover,
      contactIds,
      pinned: input.pinnedCollections[c.id] ?? false,
      custom: true,
      items: its,
      updatedMinsAgo: its.length ? Math.min(mins, ...its.map((i) => i.sharedMinsAgo)) : mins,
      summary: its.length
        ? `Thera found ${its.length} item${its.length > 1 ? "s" : ""} about "${c.title}" in your chats${withWho}. New messages, links and plans on this topic will be added here automatically.`
        : `Thera is watching your chats${withWho} for anything about "${c.title}". Messages, links and plans on this topic will appear here as they come up.`,
      channels: [...new Set(its.map((i) => i.channel))],
    };
  });

  const collections = [...customCollections, ...seedCollections];

  const allContacts: Contact[] = [
    ...input.customContacts,
    ...CONTACTS.filter((c) => !deletedContacts.has(c.id)),
  ];

  const contacts: ViewContact[] = allContacts
    .filter((c) => c.custom || c.channels.some((ch) => connected.has(ch)))
    .map((c) => {
      const cols = collections.filter(
        (col) => col.contactIds.includes(c.id) || col.items.some((i) => i.contactId === c.id),
      );
      const own = items.filter((i) => i.contactId === c.id);
      const found = [...new Set(own.map((i) => i.channel))];
      return {
        ...c,
        pinned: input.pinnedContacts[c.id] ?? !!c.pinned,
        collectionIds: cols.map((x) => x.id),
        categories: [...new Set(cols.map((x) => x.category))],
        foundChannels: found.length ? found : c.channels.filter((ch) => connected.has(ch) || c.custom),
      };
    });

  return {
    collections,
    contacts,
    items,
    collection: (id) => collections.find((c) => c.id === id),
    contact: (id) => contacts.find((c) => c.id === id),
    item: (id) => itemById.get(id),
  };
}

/** Compact text description of everything the user can see, for the AI assistant. */
export function describeView(view: View, userName: string, now = Date.now()): string {
  const name = (id: string) => view.contact(id)?.fullName ?? id;
  const lines: string[] = [];
  lines.push(`Today is ${formatLongDay(0, now)}. The user is ${userName}.`);
  lines.push("");
  lines.push("CONTACTS");
  for (const c of view.contacts) {
    lines.push(
      `- [[contact:${c.id}]] ${c.fullName} (${c.relation}); topics: ${c.collectionIds.join(", ") || "none"}; apps: ${listChannels(c.foundChannels) || "none"}`,
    );
  }
  lines.push("");
  lines.push("COLLECTIONS AND ITEMS");
  for (const col of view.collections) {
    lines.push(
      `## [[collection:${col.id}]] ${col.title} (category ${col.category}; people: ${col.contactIds.map(name).join(", ") || "none"}; updated ${ago(col.updatedMinsAgo)})`,
    );
    lines.push(`Summary: ${col.summary}`);
    if (col.suggestion) {
      const steps = col.suggestion.steps
        .map((s) => `${s.inDays !== undefined ? formatDay(s.inDays, now) + ": " : ""}${s.title} (${s.detail})`)
        .join("; ");
      lines.push(`Suggestion: ${col.suggestion.title}. Plan: ${steps}`);
    }
    for (const i of col.items) {
      const when =
        i.eventInDays !== undefined
          ? ` | date ${formatDay(i.eventInDays, now)}${i.time ? " " + i.time : ""}`
          : "";
      const quote = i.quote ? ` | message: "${i.quote}"` : "";
      const url = i.url ? ` | url ${i.url}` : "";
      lines.push(
        `- [[item:${i.id}]] ${i.type}: ${i.title}${i.detail ? " (" + i.detail + ")" : ""}${when} | shared by ${name(i.contactId)} on ${channelName(i.channel)} ${ago(i.sharedMinsAgo)}${quote}${url}`,
      );
    }
  }
  return lines.join("\n");
}

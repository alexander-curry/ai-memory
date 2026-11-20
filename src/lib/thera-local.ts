import { channelName } from "./data";
import type { Item } from "./types";
import { formatDay, listChannels, type View, type ViewCollection, type ViewContact } from "./view";

/**
 * Scripted fallback for Thera. Answers from the same visible demo data
 * using keyword matching, so the assistant always replies even when
 * live AI is unavailable.
 */

const TOPIC_KEYWORDS: Record<string, string[]> = {
  "trip-italy": ["italy", "sicily", "taormina", "catania", "etna", "holiday", "trip", "flight"],
  "tokyo-food": ["tokyo", "japan", "ramen", "sushi"],
  "our-wedding": ["wedding", "venue", "florist", "flowers", "cake tasting", "hedsor", "olivia"],
  "house-hunting": ["house", "flat", "home", "viewing", "mortgage", "rightmove", "herne hill", "brockley"],
  "buying-car": ["car", "niro", "id.3", "test drive", "electric", "ev "],
  "work-project": ["work", "brightwave", "kickoff", "client", "project", "meeting", "deadline at work"],
  "gift-ideas": ["gift", "present", "birthday", "lens"],
};

const has = (q: string, words: string[]) => words.some((w) => q.includes(w));

const itemLines = (items: Item[]) => items.map((i) => `[[item:${i.id}]]`).join("\n");

const channelsOf = (items: Item[]) => listChannels([...new Set(items.map((i) => i.channel))]);

export function localAnswer(question: string, view: View, now = Date.now()): string {
  const q = ` ${question.toLowerCase().replace(/[?!.,]/g, " ")} `;

  const contacts: ViewContact[] = view.contacts.filter((c) => {
    const first = c.name.toLowerCase();
    const full = c.fullName.toLowerCase();
    return q.includes(` ${first} `) || q.includes(` ${first}'s `) || q.includes(full) || q.includes(` ${first}s `);
  });

  const collections: ViewCollection[] = view.collections.filter(
    (c) => q.includes(c.title.toLowerCase()) || has(q, TOPIC_KEYWORDS[c.id] ?? []),
  );

  const wantsHotels = has(q, ["hotel", "stay", "accommodation"]);
  const wantsFood = has(q, ["restaurant", "eat", "dinner", "lunch", "food", "ramen", "sushi"]);
  const wantsLinks = has(q, ["link", "url", "website"]);
  const wantsPhotos = has(q, ["photo", "picture", " pic", "image"]);
  const wantsVideos = has(q, ["video", "reel"]);
  const wantsGift = has(q, ["gift", "present", "get james", "buy james", "get him"]);
  const wantsWeek = has(q, ["this week", "next few days", "coming up", "upcoming", "soon"]);
  const wantsEvents =
    wantsWeek || has(q, ["event", "plan", "when ", "schedule", "calendar", "date", "deadline", "to do", "todo", "booking", "reservation", "booked"]);

  // Gift recommendation
  if (wantsGift) {
    const gift = view.collection("gift-ideas");
    if (gift?.suggestion) {
      const links = gift.items.filter((i) => i.type === "link").slice(0, 3);
      const hints = gift.items.filter((i) => i.tags?.includes("hint"));
      return [
        `**${gift.suggestion.title}.**`,
        hints.length
          ? `James shared ${hints.length} lens review${hints.length > 1 ? "s" : ""} on Instagram, and Sophia says it's the one he keeps looking at. Everyone is chipping in £25.`
          : "Sophia says it's the one he keeps looking at, and everyone is chipping in £25.",
        itemLines(links),
        `Want me to show the full plan? It's in [[collection:gift-ideas]].`,
      ].join("\n\n");
    }
  }

  let pool = view.items;
  if (contacts.length) {
    const ids = new Set(contacts.map((c) => c.id));
    pool = pool.filter(
      (i) => ids.has(i.contactId) || !!view.collection(i.collectionId)?.contactIds.some((id) => ids.has(id)),
    );
  }
  if (collections.length && !(wantsHotels || wantsFood)) pool = pool.filter((i) => collections.some((c) => c.id === i.collectionId));

  const who = contacts.length ? ` with ${contacts.map((c) => c.name).join(" and ")}` : "";
  const ids = new Set(contacts.map((c) => c.id));
  const strictPool = contacts.length ? view.items.filter((i) => ids.has(i.contactId)) : pool;

  // Hotels
  if (wantsHotels) {
    const hotels = pool.filter((i) => i.tags?.includes("hotel") && i.type === "link");
    if (hotels.length) {
      const fav = hotels.some((h) => h.id === "i4")
        ? `\n\nJames's favourite is Villa Carlotta, and you agreed to pick one by ${formatDay(7, now)}.`
        : "";
      return `I found ${hotels.length} hotel${hotels.length > 1 ? "s" : ""} in your ${channelsOf(hotels)} conversations${who}:\n\n${itemLines(hotels)}${fav}`;
    }
    return `I couldn't find any hotels in your connected chats${who}. If you talked about them on another app, connect it in Settings and I'll take another look.`;
  }

  // Restaurants and food
  if (wantsFood) {
    let food = pool.filter((i) => i.tags?.some((t) => ["restaurant", "food", "ramen", "sushi", "dinner", "lunch"].includes(t)));
    if (collections.length) {
      const scoped = food.filter((i) => collections.some((c) => c.id === i.collectionId));
      if (scoped.length) food = scoped;
    }
    if (food.length)
      return `Here ${food.length > 1 ? "are" : "is"} ${food.length} place${food.length > 1 ? "s" : ""} to eat from your chats${who}, shared on ${channelsOf(food)}:\n\n${itemLines(food.slice(0, 6))}`;
  }

  // Events and plans
  if (wantsEvents) {
    let events = pool.filter((i) => i.eventInDays !== undefined && i.eventInDays >= 0);
    if (wantsWeek) events = events.filter((i) => (i.eventInDays ?? 99) <= 7);
    events.sort((a, b) => (a.eventInDays ?? 0) - (b.eventInDays ?? 0));
    if (events.length) {
      const intro = wantsWeek
        ? `You have ${events.length} thing${events.length > 1 ? "s" : ""} coming up in the next 7 days${who}:`
        : `Here's what's planned${who}, soonest first:`;
      return `${intro}\n\n${itemLines(events.slice(0, 8))}${events.length > 8 ? `\n\nPlus ${events.length - 8} more later on.` : ""}`;
    }
    return `Nothing is scheduled${who} ${wantsWeek ? "in the next 7 days" : "right now"}. Enjoy the quiet!`;
  }

  if (wantsLinks || wantsPhotos || wantsVideos) {
    const type = wantsLinks ? "link" : wantsPhotos ? "photo" : "video";
    let found = strictPool.filter((i) => i.type === type);
    if (collections.length) found = found.filter((i) => collections.some((c) => c.id === i.collectionId));
    const from = contacts.length ? ` shared by ${contacts.map((c) => c.name).join(" and ")}` : "";
    if (found.length)
      return `I found ${found.length} ${type}${found.length > 1 ? "s" : ""}${from}${collections.length ? ` in ${collections.map((c) => c.title).join(" and ")}` : ""}:\n\n${itemLines(found.slice(0, 8))}`;
  }

  // A topic on its own
  if (collections.length) {
    const col = collections[0];
    const key = col.items
      .filter((i) => i.type === "event" || i.type === "reservation" || i.type === "link")
      .slice(0, 4);
    return `${col.summary}\n\n${itemLines(key)}\n\nEverything is in [[collection:${col.id}]].`;
  }

  // A person on their own
  if (contacts.length) {
    const c = contacts[0];
    const cols = c.collectionIds.map((id) => view.collection(id)).filter(Boolean) as ViewCollection[];
    if (!cols.length) return `I haven't found any topics with ${c.name} yet. I'll keep an eye on your chats with them.`;
    const upcoming = view.items
      .filter((i) => i.eventInDays !== undefined && cols.some((col) => col.id === i.collectionId))
      .sort((a, b) => (a.eventInDays ?? 0) - (b.eventInDays ?? 0))
      .slice(0, 3);
    return `You and ${c.name} share ${cols.length} topic${cols.length > 1 ? "s" : ""} across ${listChannels(c.foundChannels)}:\n\n${cols.map((x) => `[[collection:${x.id}]]`).join("\n")}${upcoming.length ? `\n\nComing up next:\n\n${itemLines(upcoming)}` : ""}`;
  }

  if (has(q, ["hello", " hi ", "hey", "thanks", "thank you"])) {
    return q.includes("thank")
      ? "You're welcome! Ask me anything else about your chats."
      : "Hi there! I can find plans, links, places and photos from your chats. Try asking what's coming up this week.";
  }

  if (has(q, ["who ", "contacts", "people"])) {
    return `You have ${view.contacts.length} people in your memory. The ones you talk to most are:\n\n${view.contacts
      .slice(0, 4)
      .map((c) => `[[contact:${c.id}]]`)
      .join("\n")}`;
  }

  return `I couldn't find anything about that in your connected chats. Try asking about hotels, restaurants, gift ideas or what's coming up this week. You can also connect more apps in Settings so I can search further.`;
}

export const channelLabel = channelName;

import { generateText } from "ai";
import { computeView, describeView, type ViewInput } from "@/lib/view";
import type { Category, ChannelId, Contact, Tint } from "@/lib/types";

export const maxDuration = 30;

// Free-tier friendly models, tried in order. Override with THERA_MODELS="a,b,c".
const MODELS = (process.env.THERA_MODELS ?? "google/gemini-2.5-flash,openai/gpt-5.4-mini,openai/gpt-oss-120b")
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const CHANNELS: ChannelId[] = [
  "instagram", "facebook", "messenger", "telegram", "whatsapp", "imessage", "google", "gmail", "yahoo", "tiktok",
];
const CATEGORIES: Category[] = ["travel", "food", "work", "shopping", "home", "events"];
const TINTS: Tint[] = ["green", "blue", "purple", "neutral"];

const str = (v: unknown, max = 80) => (typeof v === "string" ? v.slice(0, max) : "");
const strArr = (v: unknown, max = 60) =>
  Array.isArray(v) ? v.filter((x) => typeof x === "string").slice(0, max).map((x) => (x as string).slice(0, 60)) : [];

function sanitizeState(raw: unknown): { input: ViewInput; userName: string } {
  const s = (raw ?? {}) as Record<string, unknown>;
  const customCollections = (Array.isArray(s.customCollections) ? s.customCollections : [])
    .slice(0, 20)
    .map((c: Record<string, unknown>) => ({
      id: str(c.id, 40),
      title: str(c.title, 60),
      category: (CATEGORIES.includes(c.category as Category) ? c.category : "events") as Category,
      tint: (TINTS.includes(c.tint as Tint) ? c.tint : "neutral") as Tint,
      contactIds: strArr(c.contactIds, 20),
      itemIds: strArr(c.itemIds, 60),
      createdAt: typeof c.createdAt === "number" ? c.createdAt : Date.now(),
    }));
  const customContacts: Contact[] = (Array.isArray(s.customContacts) ? s.customContacts : [])
    .slice(0, 20)
    .map((c: Record<string, unknown>) => ({
      id: str(c.id, 40),
      name: str(c.name, 40),
      fullName: str(c.fullName, 60),
      relation: str(c.relation, 40) || "Contact",
      color: "#E2E5EA",
      channels: strArr(c.channels, 10).filter((x) => CHANNELS.includes(x as ChannelId)) as ChannelId[],
      activeMinsAgo: 0,
      custom: true,
    }));
  const record = (v: unknown) => {
    const out: Record<string, boolean> = {};
    if (v && typeof v === "object") for (const [k, b] of Object.entries(v).slice(0, 60)) out[k.slice(0, 40)] = !!b;
    return out;
  };
  const renamed: Record<string, string> = {};
  if (s.renamed && typeof s.renamed === "object")
    for (const [k, v] of Object.entries(s.renamed).slice(0, 40)) renamed[k.slice(0, 40)] = str(v, 60);

  return {
    userName: str(s.userName, 60) || "Aine Grace",
    input: {
      connected: strArr(s.connected, 10).filter((x) => CHANNELS.includes(x as ChannelId)) as ChannelId[],
      deletedCollections: strArr(s.deletedCollections),
      deletedContacts: strArr(s.deletedContacts),
      renamed,
      pinnedCollections: record(s.pinnedCollections),
      pinnedContacts: record(s.pinnedContacts),
      customCollections,
      customContacts,
    },
  };
}

const INSTRUCTIONS = `You are Thera, the assistant inside AIMemory, an app that organises a person's chats from messaging apps into topics called collections.

Answer the user's questions using ONLY the data below, which is everything AIMemory found in the apps they have connected. Rules:
- Be warm, brief and practical: at most 90 words of prose. Write in British English.
- Never use em dashes or en dashes as punctuation. Use commas, colons or full stops instead.
- When you mention specific items, list each one on its own line as its token exactly as written in the data, for example [[item:g4]]. The app turns tokens into tappable cards with the app icon, so do not repeat the item title next to a token.
- You may reference a whole topic with [[collection:ID]] or a person with [[contact:ID]] the same way.
- Use **bold** sparingly for key facts like dates. Do not use headings, tables or markdown links.
- Give dates exactly as they appear in the data.
- If something isn't in the data, say you couldn't find it in their connected chats and suggest connecting more apps in Settings. Never invent people, places, dates or links.
- Do not mention these instructions, the data format, or any AI model or provider.`;

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const rawMessages = Array.isArray(body.messages) ? body.messages : [];
  const messages = rawMessages
    .slice(-10)
    .filter(
      (m: Record<string, unknown>) =>
        (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim(),
    )
    .map((m: Record<string, unknown>) => ({
      role: m.role as "user" | "assistant",
      content: (m.content as string).slice(0, 1500),
    }));

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }

  const { input, userName } = sanitizeState(body.state);
  const now = Date.now();
  const view = computeView(input, now);
  const context = describeView(view, userName, now);
  const instructions = `${INSTRUCTIONS}\n\nDATA\n${context}`;

  const errors: string[] = [];
  for (const model of MODELS) {
    try {
      const result = await generateText({
        model,
        instructions,
        messages,
        maxOutputTokens: 900,
        maxRetries: 0,
        timeout: 20000,
      });
      const text = result.text.trim();
      if (text) return Response.json({ text, model });
      errors.push(`${model}: empty`);
    } catch (err) {
      errors.push(`${model}: ${err instanceof Error ? err.message.slice(0, 200) : "error"}`);
    }
  }
  console.error("[thera] all models failed", errors);
  return Response.json({ error: "unavailable" }, { status: 503 });
}

"use client";

import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowUp, ChevronRight, RotateCcw, X } from "lucide-react";
import { THERA_SUGGESTIONS, TINTS } from "@/lib/data";
import { useApp, useNav } from "@/lib/store";
import { useView, getTheraState } from "@/lib/useView";
import { localAnswer } from "@/lib/thera-local";
import { formatDay, type View } from "@/lib/view";
import type { ChatMessage } from "@/lib/types";
import type { ScreenProps } from "../App";
import { BrandIcon, LogoMark } from "../icons";
import { Avatar, CircleButton, Img, cx } from "../ui";

const TOKEN = /\[\[(item|collection|contact):([\w-]+)\]\]/g;

function ItemCard({ id, view }: { id: string; view: View }) {
  const push = useNav((s) => s.push);
  const item = view.item(id);
  if (!item) return null;
  const col = view.collection(item.collectionId);
  return (
    <button
      onClick={() => push("collection", { id: item.collectionId, item: item.id })}
      className="press flex w-full items-center gap-2.5 rounded-[12px] bg-[#f6f6f7] px-2.5 py-2 text-left"
    >
      {item.image ? (
        <Img src={item.image} alt={item.title} className="h-8 w-8 shrink-0 rounded-[8px]" />
      ) : (
        <BrandIcon id={item.channel} size={20} className="mx-1.5 shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium text-ink">{item.title}</div>
        <div className="truncate text-[11px] text-ink-2">
          {item.eventInDays !== undefined ? `${formatDay(item.eventInDays)}${item.time ? " · " + item.time : ""} · ` : ""}
          {col?.title}
        </div>
      </div>
      {item.image && <BrandIcon id={item.channel} size={16} className="shrink-0" />}
      <ChevronRight size={15} className="shrink-0 text-ink-3" />
    </button>
  );
}

function CollectionCardMini({ id, view }: { id: string; view: View }) {
  const push = useNav((s) => s.push);
  const col = view.collection(id);
  if (!col) return null;
  return (
    <button
      onClick={() => push("collection", { id })}
      className="press flex w-full items-center gap-2.5 rounded-[12px] px-2.5 py-2 text-left"
      style={{ background: TINTS[col.tint] }}
    >
      <Img src={col.cover} alt={col.title} className="h-8 w-8 shrink-0 rounded-[8px]" tint="#fff" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium text-ink">{col.title}</div>
        <div className="text-[11px] text-ink-2">{col.items.length} items</div>
      </div>
      <ChevronRight size={15} className="text-ink-3" />
    </button>
  );
}

function ContactMini({ id, view }: { id: string; view: View }) {
  const push = useNav((s) => s.push);
  const c = view.contact(id);
  if (!c) return null;
  return (
    <button onClick={() => push("contact", { id })} className="press flex w-full items-center gap-2.5 rounded-[12px] bg-[#f6f6f7] px-2.5 py-2 text-left">
      <Avatar contact={c} size={30} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium text-ink">{c.fullName}</div>
        <div className="text-[11px] text-ink-2">{c.relation}</div>
      </div>
      <ChevronRight size={15} className="text-ink-3" />
    </button>
  );
}

function inline(text: string, view: View, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const parts = text.split(/(\*\*[^*]+\*\*|\[\[(?:item|collection|contact):[\w-]+\]\])/g);
  parts.forEach((p, i) => {
    if (!p) return;
    const bold = p.match(/^\*\*([^*]+)\*\*$/);
    if (bold) {
      out.push(<strong key={`${key}-${i}`} className="font-semibold text-ink">{bold[1]}</strong>);
      return;
    }
    const tok = p.match(/^\[\[(item|collection|contact):([\w-]+)\]\]$/);
    if (tok) {
      const label =
        tok[1] === "item" ? view.item(tok[2])?.title : tok[1] === "collection" ? view.collection(tok[2])?.title : view.contact(tok[2])?.name;
      out.push(
        <span key={`${key}-${i}`} className="font-medium text-brand">
          {label ?? ""}
        </span>,
      );
      return;
    }
    out.push(<Fragment key={`${key}-${i}`}>{p}</Fragment>);
  });
  return out;
}

export function RichText({ text, view }: { text: string; view: View }) {
  const clean = text.replace(/\s*[—–]\s*/g, ", ");
  const lines = clean.split("\n");
  const blocks: ReactNode[] = [];
  let cards: ReactNode[] = [];
  const flush = (k: number) => {
    if (cards.length) {
      blocks.push(
        <div key={`cards-${k}`} className="my-2 space-y-1.5">
          {cards}
        </div>,
      );
      cards = [];
    }
  };
  lines.forEach((raw, idx) => {
    const line = raw.trim().replace(/^[-*•]\s+(?=\[\[)/, "");
    const tokens = [...line.matchAll(TOKEN)];
    const rest = line.replace(TOKEN, "").replace(/^[-*•\d.)\s]+$/, "").trim();
    if (tokens.length && !rest) {
      tokens.forEach((t, j) => {
        const k = `${idx}-${j}`;
        if (t[1] === "item") cards.push(<ItemCard key={k} id={t[2]} view={view} />);
        else if (t[1] === "collection") cards.push(<CollectionCardMini key={k} id={t[2]} view={view} />);
        else cards.push(<ContactMini key={k} id={t[2]} view={view} />);
      });
      return;
    }
    flush(idx);
    if (!line) return;
    const bullet = line.match(/^[-*•]\s+(.*)$/);
    if (bullet) {
      blocks.push(
        <div key={idx} className="flex gap-2">
          <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-ink-2" />
          <span>{inline(bullet[1], view, String(idx))}</span>
        </div>,
      );
    } else {
      blocks.push(<p key={idx}>{inline(line, view, String(idx))}</p>);
    }
  });
  flush(lines.length);
  return <div className="space-y-1.5">{blocks}</div>;
}

function AssistantBubble({ children }: { children: ReactNode }) {
  return (
    <div className="animate-rise flex items-start gap-2">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white bg-white shadow-sm">
        <LogoMark size={20} />
      </span>
      <div className="max-w-[86%] rounded-[18px] rounded-tl-[6px] border border-white bg-white px-3.5 py-2.5 text-[14px] leading-[20px] text-ink-2 shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
        {children}
      </div>
    </div>
  );
}

export function Thera({ route }: ScreenProps) {
  const view = useView();
  const pop = useNav((s) => s.pop);
  const chat = useApp((s) => s.chat);
  const addChat = useApp((s) => s.addChat);
  const clearChat = useApp((s) => s.clearChat);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const sentInitial = useRef(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [chat.length, loading]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setInput("");
    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: "user", content: q, createdAt: Date.now() };
    addChat(userMsg);
    setLoading(true);
    const started = Date.now();
    const history = [...useApp.getState().chat].slice(-10).map((m) => ({ role: m.role, content: m.content }));

    let answer = "";
    let source: ChatMessage["source"] = "ai";
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 25000);
      const res = await fetch("/api/thera", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, state: getTheraState() }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        answer = typeof data.text === "string" ? data.text : "";
      }
    } catch {
      answer = "";
    }
    if (!answer) {
      source = "local";
      answer = localAnswer(q, view);
      const wait = 700 - (Date.now() - started);
      if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    }
    addChat({ id: `a${Date.now()}`, role: "assistant", content: answer, source, createdAt: Date.now() });
    setLoading(false);
  };

  useEffect(() => {
    const q = route.params?.q;
    if (q && !sentInitial.current) {
      sentInitial.current = true;
      setTimeout(() => send(q), 350);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col bg-app">
      <div className="flex items-start justify-between px-4 pb-3 pt-[calc(var(--sat)+10px)]">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">Ask Thera</h1>
          <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-2">
            <span className="h-2 w-2 rounded-full bg-success" />
            {loading ? "Thinking..." : "Online · Analysing your chats"}
          </div>
        </div>
        <div className="flex gap-2">
          {chat.length > 0 && <CircleButton icon={RotateCcw} label="New chat" onClick={() => clearChat()} />}
          <CircleButton icon={X} label="Close" onClick={pop} />
        </div>
      </div>

      <div ref={scroller} className="no-scrollbar flex-1 space-y-4 overflow-y-auto px-4 pb-4 pt-2">
        <AssistantBubble>
          Hi {useApp.getState().user.name.split(" ")[0]}! I&apos;m Thera. Ask me anything about your conversations.
        </AssistantBubble>

        {chat.length === 0 && !loading && (
          <div className="animate-rise space-y-2 pl-10" style={{ animationDelay: "120ms" }}>
            {THERA_SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="press block rounded-full border border-white bg-white/70 px-3.5 py-2 text-left text-[13px] font-medium text-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {chat.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="animate-rise flex justify-end">
              <div className="max-w-[80%] rounded-[18px] rounded-tr-[6px] bg-[#d9d3fb] px-3.5 py-2.5 text-[14px] leading-[20px] text-ink">
                {m.content}
              </div>
            </div>
          ) : (
            <AssistantBubble key={m.id}>
              <RichText text={m.content} view={view} />
            </AssistantBubble>
          ),
        )}

        {loading && (
          <AssistantBubble>
            <span className="typing flex h-5 items-center">
              <span />
              <span />
              <span />
            </span>
          </AssistantBubble>
        )}

        {chat.length > 0 && !loading && chat[chat.length - 1].role === "assistant" && (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pl-14">
            {THERA_SUGGESTIONS.filter((s) => !chat.some((m) => m.content === s))
              .slice(0, 3)
              .map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="press shrink-0 rounded-full border border-white bg-white/70 px-3 py-1.5 text-[12px] font-medium text-ink-2"
                >
                  {s}
                </button>
              ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-end gap-2.5 px-4 pb-[calc(var(--sab)+10px)] pt-2"
      >
        <textarea
          ref={inputRef}
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          placeholder="Message..."
          className="no-scrollbar max-h-28 min-h-12 flex-1 resize-none rounded-[24px] border border-white bg-white/90 px-4 py-3 text-[16px] leading-[22px] text-ink outline-none placeholder:text-ink-3 focus:border-brand/50"
        />
        <button
          type="submit"
          aria-label="Send"
          disabled={!input.trim() || loading}
          className={cx(
            "press flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand text-white shadow-[0_8px_20px_-8px_rgba(104,82,250,0.8)] transition-opacity",
            (!input.trim() || loading) && "opacity-50",
          )}
        >
          <ArrowUp size={22} strokeWidth={2.4} />
        </button>
      </form>
    </div>
  );
}

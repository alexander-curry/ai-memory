"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarCheck,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  MessageCircle,
  Pause,
  Play,
  X,
} from "lucide-react";
import { channelName } from "@/lib/data";
import { useApp, useNav, toast } from "@/lib/store";
import { ago, formatLongDay, relativeDay, type View } from "@/lib/view";
import type { Item } from "@/lib/types";
import { BrandIcon, LogoMark } from "./icons";
import { Avatar, Button, Img, Sheet, cx } from "./ui";

const TYPE_LABEL: Record<Item["type"], string> = {
  event: "Event",
  reservation: "Reservation",
  link: "Link",
  video: "Video",
  photo: "Photo",
};

export function SourceLine({ item, view }: { item: Item; view: View }) {
  const who = view.contact(item.contactId);
  return (
    <div className="flex items-center gap-1.5 text-[13px] text-ink-2">
      <BrandIcon id={item.channel} size={16} />
      <span>
        Shared by {who?.name ?? "someone"} on {channelName(item.channel)} · {ago(item.sharedMinsAgo)}
      </span>
    </div>
  );
}

export function ItemSheet({ item, view, onClose }: { item: Item | null; view: View; onClose: () => void }) {
  const calendarAdded = useApp((s) => s.calendarAdded);
  const addToCalendar = useApp((s) => s.addToCalendar);
  const push = useNav((s) => s.push);
  const [shown, setShown] = useState<Item | null>(item);
  if (item && item !== shown) setShown(item);

  const it = item ?? shown;
  if (!it) return null;
  const who = view.contact(it.contactId);
  const isEvent = it.eventInDays !== undefined;
  const added = calendarAdded.includes(it.id);

  return (
    <Sheet open={!!item} onClose={onClose}>
      <div className="pt-4">
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-brand-subtle px-2.5 py-1 text-[12px] font-medium text-brand">{TYPE_LABEL[it.type]}</span>
          <button aria-label="Close" onClick={onClose} className="press flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink">
            <X size={16} />
          </button>
        </div>
        <h3 className="mt-3 text-[21px] font-semibold leading-[27px] text-ink">{it.title}</h3>
        {it.detail && <p className="mt-1 text-[14px] text-ink-2">{it.detail}</p>}

        {isEvent && (
          <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-white bg-white/80 px-3.5 py-3">
            <div className="flex h-12 w-12 flex-col items-center justify-center rounded-[12px] bg-brand-subtle text-brand">
              <span className="text-[18px] font-semibold leading-5">{new Date(Date.now() + it.eventInDays! * 864e5).getDate()}</span>
              <span className="text-[10px] font-medium uppercase">
                {new Date(Date.now() + it.eventInDays! * 864e5).toLocaleDateString("en-GB", { month: "short" })}
              </span>
            </div>
            <div>
              <div className="text-[15px] font-medium text-ink">{formatLongDay(it.eventInDays!)}</div>
              <div className="text-[13px] text-ink-2">
                {relativeDay(it.eventInDays!)}
                {it.time ? ` at ${it.time}` : ""}
              </div>
            </div>
          </div>
        )}

        {it.url && (
          <div className="mt-4 flex items-center gap-3 rounded-[16px] border border-white bg-white/80 px-3.5 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f1f2f4] text-ink-2">
              <ExternalLink size={18} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-medium text-ink">{new URL(it.url).hostname.replace("www.", "")}</div>
              <div className="truncate text-[12px] text-ink-3">{it.url}</div>
            </div>
          </div>
        )}

        <div className="mt-5">
          <div className="mb-2 text-[12px] font-medium uppercase tracking-wide text-ink-3">Found in</div>
          <div className="flex items-start gap-2.5">
            {who && <Avatar contact={who} size={32} />}
            <div className="min-w-0 flex-1">
              {it.quote && (
                <div className="mb-1.5 w-fit max-w-full rounded-[16px] rounded-tl-[4px] bg-white px-3.5 py-2.5 text-[14px] leading-5 text-ink shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
                  {it.quote}
                </div>
              )}
              <SourceLine item={it} view={view} />
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-2.5">
          {isEvent && (
            <Button
              variant={added ? "secondary" : "primary"}
              onClick={() => {
                if (!added) {
                  addToCalendar(it.id);
                  toast("Added to your calendar", "success");
                } else toast("Already in your calendar");
              }}
            >
              {added ? <CalendarCheck size={18} className="text-success" /> : <CalendarPlus size={18} />}
              {added ? "Added to calendar" : "Add to calendar"}
            </Button>
          )}
          {it.url && (
            <div className="flex gap-2.5">
              <Button onClick={() => window.open(it.url, "_blank", "noopener")}>
                <ExternalLink size={18} /> Open link
              </Button>
              <button
                aria-label="Copy link"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(it.url!);
                    toast("Link copied", "success");
                  } catch {
                    toast("Couldn't copy the link");
                  }
                }}
                className="press flex h-12 w-14 shrink-0 items-center justify-center rounded-full border border-white bg-white/90 text-ink"
              >
                <Copy size={18} />
              </button>
            </div>
          )}
          <Button
            variant="secondary"
            onClick={() => toast(`In the real app this opens your ${channelName(it.channel)} chat with ${who?.name ?? "them"}`)}
          >
            <MessageCircle size={18} /> Open in {channelName(it.channel)}
          </Button>
          <button
            onClick={() => {
              onClose();
              setTimeout(() => push("thera", { q: `Tell me more about "${it.title}"` }), 200);
            }}
            className="press flex w-full items-center justify-center gap-2 py-2 text-[14px] font-medium text-brand"
          >
            <LogoMark size={20} /> Ask Thera about this
          </button>
        </div>
      </div>
    </Sheet>
  );
}

export function MediaViewer({
  items,
  index,
  view,
  onClose,
  onIndex,
}: {
  items: Item[];
  index: number | null;
  view: View;
  onClose: () => void;
  onIndex: (i: number) => void;
}) {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);

  useEffect(() => setRoot(document.getElementById("overlay-root")), []);

  const item = index !== null ? items[index] : null;

  useEffect(() => {
    setProgress(0);
    setPlaying(true);
  }, [index]);

  useEffect(() => {
    if (!item || item.type !== "video" || !playing) return;
    const t = setInterval(() => setProgress((p) => (p >= 1 ? 0 : p + 0.01)), 150);
    return () => clearInterval(t);
  }, [item, playing]);

  if (!item || !root || index === null) return null;
  const go = (d: number) => onIndex((index + d + items.length) % items.length);

  return createPortal(
    <div
      className="animate-fade pointer-events-auto absolute inset-0 z-[55] flex flex-col bg-black"
      onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX === null) return;
        const dx = e.changedTouches[0].clientX - touchX;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        setTouchX(null);
      }}
    >
      <div className="flex items-center justify-between px-4 pt-[calc(var(--sat)+6px)] text-white">
        <span className="text-[13px] text-white/70">
          {index + 1} of {items.length}
        </span>
        <button aria-label="Close" onClick={onClose} className="press flex h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <X size={18} />
        </button>
      </div>
      <div className="relative flex flex-1 items-center justify-center">
        <Img key={item.id} src={item.image?.replace("--square", "--card-landscape")} alt={item.title} className="animate-fade max-h-full w-full object-contain" />
        {item.type === "video" && (
          <button
            aria-label={playing ? "Pause" : "Play"}
            onClick={() => setPlaying((p) => !p)}
            className={cx(
              "absolute flex h-16 w-16 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-opacity",
              playing ? "opacity-0 hover:opacity-100" : "opacity-100",
            )}
          >
            {playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
          </button>
        )}
        {items.length > 1 && (
          <>
            <button aria-label="Previous" onClick={() => go(-1)} className="absolute left-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
              <ChevronLeft size={22} />
            </button>
            <button aria-label="Next" onClick={() => go(1)} className="absolute right-2 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>
      <div className="px-5 pb-[calc(var(--sab)+18px)] pt-3 text-white">
        {item.type === "video" && (
          <div className="mb-3 h-1 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
        <div className="text-[16px] font-medium">{item.title}</div>
        <div className="mt-1 flex items-center gap-1.5 text-[13px] text-white/70">
          <BrandIcon id={item.channel} size={15} />
          Shared by {view.contact(item.contactId)?.name} on {channelName(item.channel)} · {ago(item.sharedMinsAgo)}
        </div>
        {item.quote && <p className="mt-2 text-[14px] text-white/85">&ldquo;{item.quote}&rdquo;</p>}
      </div>
    </div>,
    root,
  );
}

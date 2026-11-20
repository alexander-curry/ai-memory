"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarCheck, Ellipsis, Link2, Play, SlidersHorizontal, X } from "lucide-react";
import { TINTS, channelName } from "@/lib/data";
import { useApp, useNav } from "@/lib/store";
import { useView } from "@/lib/useView";
import { ago, formatDay, listChannels, type ViewCollection } from "@/lib/view";
import type { ChannelId, Item, ItemType } from "@/lib/types";
import type { ScreenProps } from "../App";
import { BrandIcon, CATEGORY_META, LogoMark } from "../icons";
import { AvatarStack, Button, Checkbox, Chip, CircleButton, EmptyState, Img, SearchField, Sheet, cx } from "../ui";
import { useCollectionMenu } from "../cards";
import { ItemSheet, MediaViewer } from "../ItemSheets";

type Range = "any" | "today" | "week" | "month" | "custom";

interface Filters {
  contacts: string[];
  sections: ItemType[];
  channels: ChannelId[];
  range: Range;
  from: string;
  to: string;
}

const EMPTY: Filters = { contacts: [], sections: [], channels: [], range: "any", from: "", to: "" };

const SECTION_OPTIONS: { id: ItemType; label: string; plural: string }[] = [
  { id: "link", label: "Links", plural: "links" },
  { id: "photo", label: "Photos", plural: "photos" },
  { id: "video", label: "Videos", plural: "videos" },
  { id: "event", label: "Events", plural: "events" },
  { id: "reservation", label: "Reservations", plural: "reservations" },
];

const RANGE_LABEL: Record<Range, string> = {
  any: "Any time",
  today: "Today",
  week: "Last week",
  month: "Last month",
  custom: "Custom",
};

const filterCount = (f: Filters) =>
  f.contacts.length + f.sections.length + f.channels.length + (f.range !== "any" ? 1 : 0);

function applyFilters(items: Item[], f: Filters, q: string) {
  const query = q.trim().toLowerCase();
  const now = Date.now();
  return items.filter((i) => {
    if (f.contacts.length && !f.contacts.includes(i.contactId)) return false;
    if (f.sections.length && !f.sections.includes(i.type)) return false;
    if (f.channels.length && !f.channels.includes(i.channel)) return false;
    if (f.range === "today" && i.sharedMinsAgo > 1440) return false;
    if (f.range === "week" && i.sharedMinsAgo > 1440 * 7) return false;
    if (f.range === "month" && i.sharedMinsAgo > 1440 * 30) return false;
    if (f.range === "custom") {
      const shared = now - i.sharedMinsAgo * 60000;
      if (f.from && shared < new Date(f.from).getTime()) return false;
      if (f.to && shared > new Date(f.to).getTime() + 864e5) return false;
    }
    if (query) {
      const hay = `${i.title} ${i.detail ?? ""} ${i.quote ?? ""} ${(i.tags ?? []).join(" ")}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
}

function DateBlock({ days }: { days: number }) {
  const parts = formatDay(days).split(" ");
  return (
    <div className="w-9 shrink-0 text-center">
      <div className="text-[18px] font-medium leading-5 text-ink">{parts[1]}</div>
      <div className="text-[11px] text-ink-2">{parts[2]}</div>
    </div>
  );
}

function EventRow({ item, onOpen }: { item: Item; onOpen: () => void }) {
  const added = useApp((s) => s.calendarAdded.includes(item.id));
  return (
    <button onClick={onOpen} className="press flex w-full items-start gap-3 py-2.5 text-left">
      <DateBlock days={item.eventInDays ?? 0} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-[14px] font-medium text-ink">{item.title}</span>
          {added && <CalendarCheck size={13} className="shrink-0 text-success" />}
        </div>
        <div className="text-[12px] leading-[17px] text-ink-2">
          {item.time ? `${item.time} · ` : ""}
          {item.detail}
        </div>
      </div>
      <BrandIcon id={item.channel} size={18} className="mt-0.5" />
    </button>
  );
}

function LinkRow({ item, onOpen }: { item: Item; onOpen: () => void }) {
  return (
    <button onClick={onOpen} className="press flex w-full items-center gap-3 py-2.5 text-left">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1f2f4] text-ink-2">
        <Link2 size={15} strokeWidth={2.2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[14px] font-medium text-ink">{item.title}</div>
        <div className="truncate text-[12px] text-ink-2">{item.detail ?? item.url?.replace(/^https?:\/\/(www\.)?/, "")}</div>
      </div>
      <BrandIcon id={item.channel} size={18} />
    </button>
  );
}

function MediaGrid({ items, onOpen }: { items: Item[]; onOpen: (i: number) => void }) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {items.map((m, i) => (
        <button key={m.id} onClick={() => onOpen(i)} className="press relative aspect-square overflow-hidden rounded-[10px]">
          <Img src={m.image} alt={m.title} className="h-full w-full" />
          {m.type === "video" && (
            <span className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-ink shadow">
                <Play size={12} fill="currentColor" className="ml-0.5" />
              </span>
            </span>
          )}
          <span className="absolute bottom-1 right-1">
            <BrandIcon id={m.channel} size={14} />
          </span>
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 first:mt-0">
      <h2 className="mb-2 text-[16px] font-medium text-ink">{title}</h2>
      {children}
    </section>
  );
}

export function CollectionDetail({ route }: ScreenProps) {
  const view = useView();
  const pop = useNav((s) => s.pop);
  const push = useNav((s) => s.push);
  const col = view.collection(route.params?.id ?? "");
  const menu = useCollectionMenu();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY);
  const [filterOpen, setFilterOpen] = useState(false);
  const [openItem, setOpenItem] = useState<Item | null>(null);
  const [media, setMedia] = useState<{ list: Item[]; index: number } | null>(null);

  // Deep link to an item (from Home or Thera)
  useEffect(() => {
    const id = route.params?.item;
    if (!id) return;
    const it = view.item(id);
    if (!it) return;
    const t = setTimeout(() => {
      if (it.type === "photo" || it.type === "video") setMedia({ list: [it], index: 0 });
      else setOpenItem(it);
    }, 380);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route.params?.item]);

  if (!col) {
    return (
      <div className="absolute inset-0 bg-app px-4 pt-[calc(var(--sat)+8px)]">
        <CircleButton icon={X} label="Close" onClick={pop} />
        <EmptyState title="Collection unavailable" body="It may have been deleted, or it comes from an app you've disconnected." action="Go back" onAction={pop} />
      </div>
    );
  }

  const contacts = col.contactIds.map((id) => view.contact(id)).filter(Boolean) as NonNullable<ReturnType<typeof view.contact>>[];
  const active = filterCount(filters) > 0 || q.trim().length > 0;

  return (
    <div className="no-scrollbar absolute inset-0 flex flex-col overflow-y-auto" style={{ background: TINTS[col.tint] }}>
      <div className="shrink-0 px-4 pb-4 pt-[calc(var(--sat)+10px)]">
        <div className="flex items-start gap-3">
          <Img
            src={col.cover}
            alt={col.title}
            tint="#ffffff"
            fallbackIcon={CATEGORY_META[col.category].icon}
            className="h-[52px] w-[52px] shrink-0 rounded-[14px] border-2 border-white"
          />
          <div className="min-w-0 flex-1 pt-0.5">
            <h1 className="truncate text-[22px] font-semibold leading-7 tracking-[-0.01em] text-ink">{col.title}</h1>
            <div className="mt-0.5 flex items-center gap-1.5 text-[13px] text-ink-2">
              {contacts.length > 0 && <AvatarStack contacts={contacts} size={20} />}
              <span className="truncate">
                {contacts.length ? `${contacts.length} contact${contacts.length > 1 ? "s" : ""} · ` : "Updated "}{ago(col.updatedMinsAgo)}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <CircleButton icon={Ellipsis} label="More" onClick={() => menu.open(col)} />
            <CircleButton icon={X} label="Close" onClick={pop} />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <SearchField value={q} onChange={setQ} placeholder="Search this collection" className="flex-1 bg-white/90" />
          <button
            onClick={() => setFilterOpen(true)}
            className={cx(
              "press flex h-11 shrink-0 items-center gap-1.5 rounded-[14px] px-3.5 text-[14px] font-medium",
              filterCount(filters) ? "bg-ink text-white" : "bg-white/90 text-ink",
            )}
          >
            <SlidersHorizontal size={16} />
            Filter{filterCount(filters) ? ` (${filterCount(filters)})` : ""}
          </button>
        </div>

        {filterCount(filters) > 0 && (
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            {filters.contacts.map((id) => (
              <Chip key={id} selected onRemove={() => setFilters((f) => ({ ...f, contacts: f.contacts.filter((x) => x !== id) }))}>
                {view.contact(id)?.name}
              </Chip>
            ))}
            {filters.range !== "any" && (
              <Chip selected onRemove={() => setFilters((f) => ({ ...f, range: "any", from: "", to: "" }))}>
                {filters.range === "custom" && (filters.from || filters.to)
                  ? `${filters.from ? new Date(filters.from).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "…"} to ${filters.to ? new Date(filters.to).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "now"}`
                  : RANGE_LABEL[filters.range]}
              </Chip>
            )}
            {filters.sections.map((s) => (
              <Chip key={s} selected onRemove={() => setFilters((f) => ({ ...f, sections: f.sections.filter((x) => x !== s) }))}>
                {SECTION_OPTIONS.find((o) => o.id === s)?.label}
              </Chip>
            ))}
            {filters.channels.map((c) => (
              <Chip
                key={c}
                selected
                icon={<BrandIcon id={c} size={15} />}
                onRemove={() => setFilters((f) => ({ ...f, channels: f.channels.filter((x) => x !== c) }))}
              >
                {channelName(c)}
              </Chip>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 rounded-t-[28px] bg-white px-4 pb-[calc(var(--sab)+28px)] pt-6">
        {active ? (
          <Results col={col} filters={filters} q={q} onItem={setOpenItem} onMedia={(list, index) => setMedia({ list, index })} onClear={() => { setFilters(EMPTY); setQ(""); }} />
        ) : (
          <Overview col={col} onItem={setOpenItem} onMedia={(list, index) => setMedia({ list, index })} />
        )}

        <button
          onClick={() => push("thera", { q: `What's the latest on ${col.title}?` })}
          className="press mt-8 flex w-full items-center gap-3 rounded-[18px] border border-[#ecebfd] bg-[#f6f5ff] px-4 py-3.5 text-left"
        >
          <LogoMark size={30} />
          <div className="flex-1">
            <div className="text-[15px] font-medium text-ink">Ask Thera about {col.title}</div>
            <div className="text-[12px] text-ink-2">Plans, people, dates and links in this collection</div>
          </div>
        </button>
        {col.channels.length > 0 && (
          <div className="mt-4 flex items-center justify-center gap-1.5 text-[12px] text-ink-3">
            <span>Found in</span>
            {col.channels.map((c) => (
              <BrandIcon key={c} id={c} size={14} />
            ))}
            <span>{listChannels(col.channels)}</span>
          </div>
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        col={col}
        value={filters}
        onApply={(f) => {
          setFilters(f);
          setFilterOpen(false);
        }}
      />
      <ItemSheet item={openItem} view={view} onClose={() => setOpenItem(null)} />
      <MediaViewer
        items={media?.list ?? []}
        index={media?.index ?? null}
        view={view}
        onClose={() => setMedia(null)}
        onIndex={(index) => setMedia((m) => (m ? { ...m, index } : m))}
      />
      {menu.node}
    </div>
  );
}

function Overview({
  col,
  onItem,
  onMedia,
}: {
  col: ViewCollection;
  onItem: (i: Item) => void;
  onMedia: (list: Item[], index: number) => void;
}) {
  const events = col.items
    .filter((i) => i.type === "event" || i.type === "reservation")
    .sort((a, b) => (a.eventInDays ?? 0) - (b.eventInDays ?? 0));
  const links = col.items.filter((i) => i.type === "link");
  const videos = col.items.filter((i) => i.type === "video");
  const photos = col.items.filter((i) => i.type === "photo");

  return (
    <>
      <Section title="Summary">
        <p className="text-[14px] leading-[21px] text-ink-2">{col.summary}</p>
      </Section>

      {events.length > 0 && (
        <Section title="Reservations & events">
          <div className="-my-1">
            {events.map((e) => (
              <EventRow key={e.id} item={e} onOpen={() => onItem(e)} />
            ))}
          </div>
        </Section>
      )}

      {col.suggestion && (
        <Section title="AI suggestion">
          <div className="flex items-center gap-3 rounded-[16px] bg-[#e7e3fd] px-3.5 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white">
              <LogoMark size={24} />
            </span>
            <div>
              <div className="text-[14px] font-medium text-ink">{col.suggestion.title}</div>
              <div className="text-[12px] text-ink-2">{col.suggestion.subtitle}</div>
            </div>
          </div>
          <ol className="relative ml-[9px] mt-4 space-y-4 border-l-2 border-[#d8d2fb] pl-5">
            {col.suggestion.steps.map((s, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[27px] top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#d8d2fb]">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                </span>
                <div className="text-[13px] font-medium text-ink">
                  {s.inDays !== undefined ? formatDay(s.inDays) : `Step ${i + 1}`} · {s.title}
                </div>
                <div className="text-[12px] leading-[17px] text-ink-2">{s.detail}</div>
              </li>
            ))}
          </ol>
        </Section>
      )}

      {links.length > 0 && (
        <Section title="Important links">
          <div className="-my-1">
            {links.map((l) => (
              <LinkRow key={l.id} item={l} onOpen={() => onItem(l)} />
            ))}
          </div>
        </Section>
      )}

      {videos.length > 0 && (
        <Section title="Reels & videos">
          <MediaGrid items={videos} onOpen={(i) => onMedia(videos, i)} />
        </Section>
      )}

      {photos.length > 0 && (
        <Section title="Photos">
          <MediaGrid items={photos} onOpen={(i) => onMedia(photos, i)} />
        </Section>
      )}

      {col.items.length === 0 && (
        <div className="mt-4 rounded-[16px] bg-[#f6f6f7] px-4 py-5 text-center text-[13px] leading-5 text-ink-2">
          Nothing yet. As soon as this topic comes up in your chats, Thera will add it here.
        </div>
      )}
    </>
  );
}

function Results({
  col,
  filters,
  q,
  onItem,
  onMedia,
  onClear,
}: {
  col: ViewCollection;
  filters: Filters;
  q: string;
  onItem: (i: Item) => void;
  onMedia: (list: Item[], index: number) => void;
  onClear: () => void;
}) {
  const results = useMemo(() => applyFilters(col.items, filters, q), [col.items, filters, q]);
  const push = useNav((s) => s.push);

  if (!results.length) {
    return (
      <EmptyState
        compact
        title="No matching items"
        body={q ? `Nothing about "${q}" in ${col.title} with these filters.` : "Try removing a filter or two."}
        action={q ? "Ask Thera instead" : "Clear filters"}
        onAction={q ? () => push("thera", { q: `Find anything about ${q} in ${col.title}` }) : onClear}
      />
    );
  }

  const groups = SECTION_OPTIONS.map((s) => ({
    ...s,
    items: results
      .filter((i) => i.type === s.id)
      .sort((a, b) => (a.eventInDays ?? 0) - (b.eventInDays ?? 0)),
  })).filter((g) => g.items.length);

  return (
    <>
      {groups.map((g) => (
        <Section key={g.id} title={`${g.items.length} ${g.items.length === 1 ? g.plural.replace(/s$/, "") : g.plural}`}>
          {g.id === "photo" || g.id === "video" ? (
            <MediaGrid items={g.items} onOpen={(i) => onMedia(g.items, i)} />
          ) : (
            <div className="-my-1">
              {g.items.map((i) =>
                g.id === "link" ? (
                  <LinkRow key={i.id} item={i} onOpen={() => onItem(i)} />
                ) : (
                  <EventRow key={i.id} item={i} onOpen={() => onItem(i)} />
                ),
              )}
            </div>
          )}
        </Section>
      ))}
    </>
  );
}

function FilterSheet({
  open,
  onClose,
  col,
  value,
  onApply,
}: {
  open: boolean;
  onClose: () => void;
  col: ViewCollection;
  value: Filters;
  onApply: (f: Filters) => void;
}) {
  const view = useView();
  const [f, setF] = useState<Filters>(value);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setF(value);
  }

  const people = [...new Set([...col.contactIds, ...col.items.map((i) => i.contactId)])]
    .map((id) => view.contact(id))
    .filter(Boolean) as NonNullable<ReturnType<typeof view.contact>>[];
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const matches = applyFilters(col.items, f, "").length;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filter"
      left={<CircleButton icon={X} label="Close" onClick={onClose} size={32} />}
      right={
        <button onClick={() => setF(EMPTY)} className="press text-[15px] font-medium text-brand">
          Clear all
        </button>
      }
    >
      <div className="pt-2">
        <h3 className="mb-2 text-[15px] text-ink-2">Contacts</h3>
        <div className="space-y-1">
          {people.map((p) => (
            <button
              key={p.id}
              onClick={() => setF((x) => ({ ...x, contacts: toggle(x.contacts, p.id) }))}
              className="press flex w-full items-center gap-3 py-1.5 text-left"
            >
              <Checkbox checked={f.contacts.includes(p.id)} />
              <AvatarStack contacts={[p]} size={34} />
              <span className="text-[15px] font-medium text-ink">{p.fullName}</span>
            </button>
          ))}
        </div>

        <div className="my-4 h-px bg-[#0f172a]/[0.07]" />
        <h3 className="mb-2.5 text-[15px] text-ink-2">Section</h3>
        <div className="flex flex-wrap gap-2">
          <Chip selected={!f.sections.length} onClick={() => setF((x) => ({ ...x, sections: [] }))}>
            All
          </Chip>
          {SECTION_OPTIONS.filter((s) => col.items.some((i) => i.type === s.id)).map((s) => (
            <Chip key={s.id} selected={f.sections.includes(s.id)} onClick={() => setF((x) => ({ ...x, sections: toggle(x.sections, s.id) }))}>
              {s.label}
            </Chip>
          ))}
        </div>

        <div className="my-4 h-px bg-[#0f172a]/[0.07]" />
        <h3 className="mb-2.5 text-[15px] text-ink-2">Channel</h3>
        <div className="flex flex-wrap gap-2">
          <Chip selected={!f.channels.length} onClick={() => setF((x) => ({ ...x, channels: [] }))}>
            All
          </Chip>
          {col.channels.map((c) => (
            <Chip
              key={c}
              selected={f.channels.includes(c)}
              icon={<BrandIcon id={c} size={16} />}
              onClick={() => setF((x) => ({ ...x, channels: toggle(x.channels, c) }))}
            >
              {channelName(c)}
            </Chip>
          ))}
        </div>

        <div className="my-4 h-px bg-[#0f172a]/[0.07]" />
        <h3 className="mb-2.5 text-[15px] text-ink-2">Date shared</h3>
        <div className="flex flex-wrap gap-2">
          {(["today", "week", "month", "custom"] as Range[]).map((r) => (
            <Chip key={r} selected={f.range === r} onClick={() => setF((x) => ({ ...x, range: x.range === r ? "any" : r }))}>
              {RANGE_LABEL[r]}
            </Chip>
          ))}
        </div>
        {f.range === "custom" && (
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            {(["from", "to"] as const).map((k) => (
              <label key={k} className="block">
                <span className="mb-1 block text-[12px] font-medium capitalize text-ink-2">{k}</span>
                <input
                  type="date"
                  value={f[k]}
                  onChange={(e) => setF((x) => ({ ...x, [k]: e.target.value }))}
                  className="h-11 w-full rounded-[12px] border border-brand/50 bg-white px-3 text-[15px] text-ink outline-none"
                />
              </label>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Button onClick={() => onApply(f)}>
            {filterCount(f) ? `Show ${matches} item${matches === 1 ? "" : "s"}` : "Save"}
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

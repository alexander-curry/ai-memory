"use client";

import { useMemo, useState } from "react";
import { ChevronRight, X } from "lucide-react";
import { CATEGORIES } from "@/lib/data";
import { useApp, useNav } from "@/lib/store";
import { useView } from "@/lib/useView";
import { formatDay, relativeDay } from "@/lib/view";
import type { Category } from "@/lib/types";
import { CATEGORY_META, CategoryIcon, LogoMark, BrandIcon } from "../icons";
import { Chip, EmptyState, SearchButton, SectionHeader } from "../ui";
import { CollectionTile, ContactRow, useCollectionMenu, useContactMenu } from "../cards";

export function CategoryChips({
  value,
  onChange,
  available,
}: {
  value: Category | "all";
  onChange: (c: Category | "all") => void;
  available: Category[];
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
      <Chip selected={value === "all"} onClick={() => onChange("all")}>
        All
      </Chip>
      {CATEGORIES.filter((c) => available.includes(c.id)).map((c) => (
        <Chip
          key={c.id}
          selected={value === c.id}
          onClick={() => onChange(value === c.id ? "all" : c.id)}
          icon={<CategoryIcon category={c.id} size={15} colored={value === c.id} />}
        >
          {c.label}
        </Chip>
      ))}
    </div>
  );
}

export function Home() {
  const view = useView();
  const push = useNav((s) => s.push);
  const reset = useNav((s) => s.reset);
  const user = useApp((s) => s.user);
  const bannerDismissed = useApp((s) => s.bannerDismissed);
  const dismissBanner = useApp((s) => s.dismissBanner);
  const [cat, setCat] = useState<Category | "all">("all");
  const colMenu = useCollectionMenu();
  const contactMenu = useContactMenu();

  const available = useMemo(() => [...new Set(view.collections.map((c) => c.category))], [view.collections]);

  const collections = useMemo(
    () =>
      view.collections
        .filter((c) => cat === "all" || c.category === cat)
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.updatedMinsAgo - b.updatedMinsAgo),
    [view.collections, cat],
  );

  const contacts = useMemo(
    () =>
      view.contacts
        .filter((c) => cat === "all" || c.categories.includes(cat))
        .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.activeMinsAgo - b.activeMinsAgo)
        .slice(0, 4),
    [view.contacts, cat],
  );

  const upcoming = useMemo(() => {
    const ids = new Set(collections.map((c) => c.id));
    return view.items
      .filter((i) => i.eventInDays !== undefined && i.eventInDays >= 0 && i.eventInDays <= 21 && ids.has(i.collectionId))
      .sort((a, b) => (a.eventInDays ?? 0) - (b.eventInDays ?? 0))
      .slice(0, 3);
  }, [view.items, collections]);

  const firstName = user.name.split(" ")[0];

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto bg-app px-4 pb-[150px] pt-[calc(var(--sat)+10px)]">
      {!bannerDismissed && (
        <div className="animate-rise mb-4 flex items-start gap-3 rounded-[18px] border border-white bg-white/85 p-3.5 shadow-[0_4px_20px_rgba(15,23,42,0.06)]">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-brand-subtle">
            <LogoMark size={26} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-ink">Welcome, {firstName}</div>
            <p className="mt-0.5 text-[13px] leading-[18px] text-ink-2">
              Thera organised {view.collections.length} collections from your chats. Tap a card to explore, or ask Thera anything.
            </p>
          </div>
          <button aria-label="Dismiss" onClick={dismissBanner} className="press -mr-1 -mt-1 p-1 text-ink-3">
            <X size={18} />
          </button>
        </div>
      )}

      <SearchButton onClick={() => push("search")} />

      <div className="mt-3">
        <CategoryChips value={cat} onChange={setCat} available={available} />
      </div>

      <section className="mt-6">
        <SectionHeader title="My collections" action="View all" onAction={() => push("collections")} />
        {collections.length ? (
          <div className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1">
            {collections.map((c) => (
              <CollectionTile
                key={c.id}
                col={c}
                className="w-[166px] shrink-0 snap-start"
                imageClass="h-[62px]"
                onOpen={() => push("collection", { id: c.id })}
                onMenu={() => colMenu.open(c)}
              />
            ))}
          </div>
        ) : (
          <div className="card px-4 py-5 text-center text-[14px] text-ink-2">
            No {cat !== "all" ? CATEGORY_META[cat as Category].label.toLowerCase() + " " : ""}collections yet.
          </div>
        )}
      </section>

      <section className="mt-6">
        <SectionHeader title="Contacts" action="View all" onAction={() => reset("contacts")} />
        {contacts.length ? (
          <div className="space-y-2.5">
            {contacts.map((c) => (
              <ContactRow
                key={c.id}
                contact={c}
                onOpen={() => push("contact", { id: c.id })}
                onMenu={() => contactMenu.open(c)}
              />
            ))}
          </div>
        ) : (
          <div className="card px-4 py-5 text-center text-[14px] text-ink-2">No contacts in this category yet.</div>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="mt-6">
          <SectionHeader title="Coming up" />
          <div className="card divide-y divide-[#0f172a]/[0.06] px-3.5">
            {upcoming.map((i) => {
              const col = view.collection(i.collectionId);
              return (
                <button
                  key={i.id}
                  onClick={() => push("collection", { id: i.collectionId, item: i.id })}
                  className="press flex w-full items-center gap-3 py-3 text-left"
                >
                  <div className="w-11 shrink-0 text-center">
                    <div className="text-[18px] font-semibold leading-5 text-ink">{formatDay(i.eventInDays!).split(" ")[1]}</div>
                    <div className="text-[11px] text-ink-2">{formatDay(i.eventInDays!).split(" ")[2]}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-medium text-ink">{i.title}</div>
                    <div className="truncate text-[12px] text-ink-2">
                      {relativeDay(i.eventInDays!)}
                      {i.time ? ` · ${i.time}` : ""} · {col?.title}
                    </div>
                  </div>
                  <BrandIcon id={i.channel} size={18} />
                  <ChevronRight size={16} className="text-ink-3" />
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!view.collections.length && (
        <EmptyState
          title="Nothing here yet"
          body="Connect more apps in Settings and Thera will start organising your chats."
          action="Go to Settings"
          onAction={() => reset("settings")}
        />
      )}

      {colMenu.node}
      {contactMenu.node}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { CalendarDays, ChevronRight, Image as ImageIcon, Link2, Play } from "lucide-react";
import { useNav } from "@/lib/store";
import { useView } from "@/lib/useView";
import { formatDay } from "@/lib/view";
import type { Item } from "@/lib/types";
import { BrandIcon, LogoMark } from "../icons";
import { BackButton, Chip, EmptyState, SearchField } from "../ui";
import { ContactRow, TopicRow } from "../cards";

const QUICK = ["Hotels", "Birthday", "Viewing", "Restaurants", "Wedding", "Lens"];

const ICON: Record<Item["type"], typeof Link2> = {
  link: Link2,
  event: CalendarDays,
  reservation: CalendarDays,
  photo: ImageIcon,
  video: Play,
};

export function SearchScreen() {
  const view = useView();
  const pop = useNav((s) => s.pop);
  const push = useNav((s) => s.push);
  const [q, setQ] = useState("");

  const results = useMemo(() => {
    const query = q.trim().toLowerCase().replace(/s$/, "");
    if (!query) return null;
    return {
      collections: view.collections.filter(
        (c) => c.title.toLowerCase().includes(query) || c.summary.toLowerCase().includes(query),
      ),
      contacts: view.contacts.filter(
        (c) => c.fullName.toLowerCase().includes(query) || c.relation.toLowerCase().includes(query),
      ),
      items: view.items
        .filter((i) =>
          `${i.title} ${i.detail ?? ""} ${i.quote ?? ""} ${(i.tags ?? []).join(" ")}`.toLowerCase().includes(query),
        )
        .slice(0, 12),
    };
  }, [q, view]);

  const total = results ? results.collections.length + results.contacts.length + results.items.length : 0;

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto bg-app px-4 pb-10 pt-[calc(var(--sat)+8px)]">
      <div className="flex items-center gap-2.5">
        <BackButton onClick={pop} />
        <SearchField value={q} onChange={setQ} placeholder="Search topics, people, links..." autoFocus className="flex-1" />
      </div>

      {!results && (
        <div className="mt-6 animate-fade">
          <div className="mb-2.5 text-[13px] font-medium text-ink-2">Try searching for</div>
          <div className="flex flex-wrap gap-2">
            {QUICK.map((w) => (
              <Chip key={w} onClick={() => setQ(w)}>
                {w}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {results && (
        <>
          <button
            onClick={() => push("thera", { q })}
            className="press mt-4 flex w-full items-center gap-3 rounded-[16px] border border-[#ecebfd] bg-[#f6f5ff] px-3.5 py-3 text-left"
          >
            <LogoMark size={28} />
            <span className="flex-1 truncate text-[15px] text-ink">
              Ask Thera: <span className="font-medium">&ldquo;{q}&rdquo;</span>
            </span>
            <ChevronRight size={18} className="text-ink-3" />
          </button>

          {results.collections.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">Collections</h2>
              <div className="space-y-2.5">
                {results.collections.map((c) => (
                  <TopicRow key={c.id} col={c} onOpen={() => push("collection", { id: c.id })} />
                ))}
              </div>
            </section>
          )}

          {results.contacts.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">People</h2>
              <div className="space-y-2.5">
                {results.contacts.map((c) => (
                  <ContactRow key={c.id} contact={c} onOpen={() => push("contact", { id: c.id })} />
                ))}
              </div>
            </section>
          )}

          {results.items.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-[13px] font-medium uppercase tracking-wide text-ink-3">From your chats</h2>
              <div className="card divide-y divide-[#0f172a]/[0.06] px-3.5">
                {results.items.map((i) => {
                  const Icon = ICON[i.type];
                  const col = view.collection(i.collectionId);
                  return (
                    <button
                      key={i.id}
                      onClick={() => push("collection", { id: i.collectionId, item: i.id })}
                      className="press flex w-full items-center gap-3 py-3 text-left"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink-2">
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-medium text-ink">{i.title}</div>
                        <div className="truncate text-[12px] text-ink-2">
                          {i.eventInDays !== undefined ? `${formatDay(i.eventInDays)} · ` : ""}
                          {col?.title}
                        </div>
                      </div>
                      <BrandIcon id={i.channel} size={18} />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {total === 0 && (
            <EmptyState
              compact
              title="No results"
              body={`Nothing matches "${q}" in your connected chats. Thera might still find it.`}
              action="Ask Thera"
              onAction={() => push("thera", { q })}
            />
          )}
        </>
      )}
    </div>
  );
}

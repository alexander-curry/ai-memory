"use client";

import { useMemo, useState } from "react";
import { EllipsisVertical } from "lucide-react";
import { useNav } from "@/lib/store";
import { useView } from "@/lib/useView";
import { listChannels } from "@/lib/view";
import type { Category } from "@/lib/types";
import type { ScreenProps } from "../App";
import { BrandIcon } from "../icons";
import { Avatar, BackButton, CircleButton, EmptyState, SearchField } from "../ui";
import { TopicRow, useContactMenu } from "../cards";
import { CategoryChips } from "./Home";

export function ContactDetail({ route }: ScreenProps) {
  const view = useView();
  const pop = useNav((s) => s.pop);
  const push = useNav((s) => s.push);
  const contact = view.contact(route.params?.id ?? "");
  const menu = useContactMenu();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Category | "all">("all");

  const topics = useMemo(() => {
    if (!contact) return [];
    const query = q.trim().toLowerCase();
    return contact.collectionIds
      .map((id) => view.collection(id)!)
      .filter(Boolean)
      .filter((c) => cat === "all" || c.category === cat)
      .filter(
        (c) =>
          !query ||
          c.title.toLowerCase().includes(query) ||
          c.items.some((i) => `${i.title} ${(i.tags ?? []).join(" ")}`.toLowerCase().includes(query)),
      )
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.updatedMinsAgo - b.updatedMinsAgo);
  }, [contact, view, q, cat]);

  if (!contact) {
    return (
      <div className="absolute inset-0 bg-app px-4 pt-[calc(var(--sat)+8px)]">
        <BackButton onClick={pop} />
        <EmptyState title="Contact unavailable" body="They may have been removed, or only chat with you on an app you've disconnected." action="Go back" onAction={pop} />
      </div>
    );
  }

  const available = [...new Set(contact.collectionIds.map((id) => view.collection(id)?.category).filter(Boolean))] as Category[];
  const shared = view.items.filter((i) => i.contactId === contact.id).length;

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto bg-app px-4 pb-[150px] pt-[calc(var(--sat)+8px)]">
      <div className="flex items-start justify-between">
        <BackButton onClick={pop} />
        <div className="flex flex-col items-center pt-1">
          <Avatar contact={contact} size={64} ring />
          <h1 className="mt-2.5 text-[22px] font-semibold text-ink">{contact.fullName}</h1>
          <p className="mt-0.5 text-center text-[13px] text-ink-2">
            {contact.relation} · {contact.collectionIds.length} topic{contact.collectionIds.length === 1 ? "" : "s"}
            {contact.foundChannels.length ? ` across ${listChannels(contact.foundChannels)}` : ""}
          </p>
          <div className="mt-2 flex gap-1.5">
            {contact.foundChannels.map((c) => (
              <BrandIcon key={c} id={c} size={18} />
            ))}
          </div>
        </div>
        <CircleButton icon={EllipsisVertical} label="More" onClick={() => menu.open(contact)} />
      </div>

      <SearchField value={q} onChange={setQ} placeholder="Search topics..." className="mt-5" />
      {available.length > 1 && (
        <div className="mt-3">
          <CategoryChips value={cat} onChange={setCat} available={available} />
        </div>
      )}

      {topics.length ? (
        <div className="mt-4 space-y-2.5">
          {topics.map((c, i) => (
            <div key={c.id} className="animate-rise" style={{ animationDelay: `${i * 35}ms` }}>
              <TopicRow col={c} onOpen={() => push("collection", { id: c.id })} />
            </div>
          ))}
          <p className="pt-2 text-center text-[12px] text-ink-3">
            {shared} item{shared === 1 ? "" : "s"} shared by {contact.name} so far
          </p>
        </div>
      ) : (
        <EmptyState
          title="No topics found"
          body={
            q
              ? `Nothing about "${q}" with ${contact.name} yet. Try a different filter or ask Thera to search.`
              : contact.collectionIds.length
                ? `No ${cat} topics with ${contact.name} yet. Try a different filter or ask Thera to search.`
                : `Thera hasn't found any topics with ${contact.name} yet. They'll appear here as you chat.`
          }
          action="Ask Thera"
          onAction={() => push("thera", { q: q ? `Did ${contact.name} and I talk about ${q}?` : `What have ${contact.name} and I been talking about?` })}
        />
      )}
      {menu.node}
    </div>
  );
}

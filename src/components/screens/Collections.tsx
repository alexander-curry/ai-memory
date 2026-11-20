"use client";

import { useMemo, useState } from "react";
import { ArrowDownAZ, Pin, Plus } from "lucide-react";
import { CATEGORIES, DEFAULT_COVERS } from "@/lib/data";
import { useApp, useNav, toast } from "@/lib/store";
import { useView } from "@/lib/useView";
import type { Category, Tint } from "@/lib/types";
import type { View } from "@/lib/view";
import { CategoryIcon } from "../icons";
import { Avatar, BackButton, Button, Chip, EmptyState, SearchField, Sheet, TextField, cx } from "../ui";
import { CollectionTile, useCollectionMenu } from "../cards";

type Sort = "all" | "pinned" | "az";

export function SortChips({ value, onChange }: { value: Sort; onChange: (s: Sort) => void }) {
  return (
    <div className="flex gap-2">
      <Chip selected={value === "all"} onClick={() => onChange("all")}>
        All
      </Chip>
      <Chip selected={value === "pinned"} onClick={() => onChange(value === "pinned" ? "all" : "pinned")} icon={<Pin size={14} className="rotate-45" />}>
        Pinned
      </Chip>
      <Chip selected={value === "az"} onClick={() => onChange(value === "az" ? "all" : "az")} icon={<ArrowDownAZ size={15} />}>
        Alphabet
      </Chip>
    </div>
  );
}

export function Collections() {
  const view = useView();
  const push = useNav((s) => s.push);
  const pop = useNav((s) => s.pop);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("all");
  const [creating, setCreating] = useState(false);
  const menu = useCollectionMenu();

  const list = useMemo(() => {
    let l = view.collections.filter((c) => c.title.toLowerCase().includes(q.trim().toLowerCase()));
    if (sort === "pinned") l = l.filter((c) => c.pinned);
    if (sort === "az") l = [...l].sort((a, b) => a.title.localeCompare(b.title));
    else l = [...l].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.updatedMinsAgo - b.updatedMinsAgo);
    return l;
  }, [view.collections, q, sort]);

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto bg-app px-4 pb-[150px] pt-[calc(var(--sat)+8px)]">
      <BackButton onClick={pop} />
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">My collections</h1>
        <button onClick={() => setCreating(true)} className="press flex items-center gap-1 text-[15px] font-medium text-brand">
          <Plus size={16} strokeWidth={2.4} /> Add new
        </button>
      </div>
      <SearchField value={q} onChange={setQ} placeholder="Search collections" className="mt-3" />
      <div className="mt-3">
        <SortChips value={sort} onChange={setSort} />
      </div>
      {list.length ? (
        <div className="mt-4 grid grid-cols-2 gap-2.5">
          {list.map((c, i) => (
            <div key={c.id} className="animate-rise" style={{ animationDelay: `${i * 30}ms` }}>
              <CollectionTile
                col={c}
                className="w-full"
                imageClass="h-[64px]"
                onOpen={() => push("collection", { id: c.id })}
                onMenu={() => menu.open(c)}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          title={sort === "pinned" ? "No pinned collections" : "No collections found"}
          body={
            sort === "pinned"
              ? "Press and hold a collection to pin it here."
              : q
                ? `Nothing matches "${q}". Create a collection and Thera will gather everything about it.`
                : "Create a collection and Thera will gather everything about it."
          }
          action="Create collection"
          onAction={() => setCreating(true)}
        />
      )}
      <p className="mt-6 text-center text-[12px] text-ink-3">Tip: press and hold a collection to pin, rename or delete it.</p>
      <CreateCollectionSheet open={creating} onClose={() => setCreating(false)} view={view} initialTitle={q} />
      {menu.node}
    </div>
  );
}

const TINT_CYCLE: Tint[] = ["green", "blue", "purple", "neutral"];

export function CreateCollectionSheet({
  open,
  onClose,
  view,
  initialTitle = "",
}: {
  open: boolean;
  onClose: () => void;
  view: View;
  initialTitle?: string;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setTitle(initialTitle);
  }
  const [category, setCategory] = useState<Category>("events");
  const [people, setPeople] = useState<string[]>([]);
  const addCollection = useApp((s) => s.addCollection);
  const count = useApp((s) => s.customCollections.length);
  const push = useNav((s) => s.push);

  const create = () => {
    const name = title.trim();
    if (!name) return;
    const words = name
      .toLowerCase()
      .split(/[^a-z0-9']+/)
      .filter((w) => w.length >= 3 && !["the", "and", "for", "our", "with", "ideas", "trip"].includes(w));
    const matches = view.items.filter((i) => {
      const hay = `${i.title} ${i.detail ?? ""} ${i.quote ?? ""} ${(i.tags ?? []).join(" ")}`.toLowerCase();
      const wordHit = words.some((w) => hay.includes(w) || hay.includes(w.replace(/s$/, "")));
      const personHit = people.length > 0 && people.includes(i.contactId) && words.length === 0;
      return (wordHit && (people.length === 0 || people.includes(i.contactId))) || personHit;
    });
    const id = `custom-${Date.now().toString(36)}`;
    const cover = matches.find((m) => m.image)?.image ?? DEFAULT_COVERS[count % DEFAULT_COVERS.length];
    addCollection({
      id,
      title: name,
      category,
      tint: TINT_CYCLE[count % TINT_CYCLE.length],
      cover,
      contactIds: people,
      itemIds: matches.map((m) => m.id),
      createdAt: Date.now(),
    });
    toast(matches.length ? `Thera found ${matches.length} item${matches.length > 1 ? "s" : ""} for "${name}"` : "Collection created", "success");
    onClose();
    setTitle("");
    setPeople([]);
    setTimeout(() => push("collection", { id }), 250);
  };

  return (
    <Sheet open={open} onClose={onClose} title="New collection">
      <div className="space-y-5 pt-3">
        <TextField label="What's it about?" value={title} onChange={setTitle} placeholder="e.g. Restaurants, Camera, Wedding" />
        <div>
          <div className="mb-2 text-[13px] font-medium text-ink-2">Category</div>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                selected={category === c.id}
                onClick={() => setCategory(c.id)}
                icon={<CategoryIcon category={c.id} size={15} colored={category === c.id} />}
              >
                {c.label}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-2 text-[13px] font-medium text-ink-2">People (optional)</div>
          <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
            {view.contacts.map((c) => {
              const on = people.includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => setPeople((p) => (on ? p.filter((x) => x !== c.id) : [...p, c.id]))}
                  className="press flex w-14 shrink-0 flex-col items-center gap-1"
                >
                  <span className={cx("rounded-full p-[2px] transition-colors", on ? "bg-brand" : "bg-transparent")}>
                    <Avatar contact={c} size={46} ring />
                  </span>
                  <span className={cx("w-full truncate text-center text-[12px]", on ? "font-medium text-brand" : "text-ink-2")}>
                    {c.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <p className="rounded-[14px] bg-white/70 px-3.5 py-3 text-[13px] leading-[18px] text-ink-2">
          Thera will look through your connected chats for anything about this topic and keep the collection up to date.
        </p>
        <Button onClick={create} disabled={!title.trim()}>
          Create collection
        </Button>
      </div>
    </Sheet>
  );
}

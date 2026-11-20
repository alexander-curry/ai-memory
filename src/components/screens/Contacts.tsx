"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { CHANNELS } from "@/lib/data";
import { useApp, useNav, toast } from "@/lib/store";
import { useView } from "@/lib/useView";
import type { ChannelId } from "@/lib/types";
import { BrandIcon } from "../icons";
import { Button, Chip, EmptyState, SearchField, Sheet, TextField } from "../ui";
import { ContactRow, useContactMenu } from "../cards";
import { SortChips } from "./Collections";

const PALETTE = ["#F6D2DB", "#CFE0FB", "#D8F0DC", "#E6DAF7", "#FBE3C8", "#D4EEF2", "#FCEFC4"];

export function Contacts() {
  const view = useView();
  const push = useNav((s) => s.push);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"all" | "pinned" | "az">("all");
  const [adding, setAdding] = useState(false);
  const menu = useContactMenu();

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    let l = view.contacts.filter((c) => !query || c.fullName.toLowerCase().includes(query) || c.relation.toLowerCase().includes(query));
    if (sort === "pinned") l = l.filter((c) => c.pinned);
    if (sort === "az") l = [...l].sort((a, b) => a.fullName.localeCompare(b.fullName));
    else l = [...l].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.activeMinsAgo - b.activeMinsAgo);
    return l;
  }, [view.contacts, q, sort]);

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto bg-app px-4 pb-[150px] pt-[calc(var(--sat)+14px)]">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">Contacts</h1>
        <button onClick={() => setAdding(true)} className="press flex items-center gap-1 text-[15px] font-medium text-brand">
          <Plus size={16} strokeWidth={2.4} /> Add new
        </button>
      </div>
      <SearchField value={q} onChange={setQ} placeholder="Search contacts" className="mt-3" />
      <div className="mt-3">
        <SortChips value={sort} onChange={setSort} />
      </div>
      {list.length ? (
        <div className="mt-4 space-y-2.5">
          {list.map((c, i) => (
            <div key={c.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 8) * 30}ms` }}>
              <ContactRow contact={c} onOpen={() => push("contact", { id: c.id })} onMenu={() => menu.open(c)} />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          compact
          title={sort === "pinned" ? "No pinned contacts" : "No contacts found"}
          body={sort === "pinned" ? "Press and hold a contact to pin them." : `No one matches "${q}".`}
        />
      )}
      <p className="mt-6 text-center text-[12px] text-ink-3">Tip: press and hold a contact to pin, mute or remove them.</p>
      <AddContactSheet open={adding} onClose={() => setAdding(false)} />
      {menu.node}
    </div>
  );
}

function AddContactSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [channels, setChannels] = useState<ChannelId[]>([]);
  const connected = useApp((s) => s.connected);
  const addContact = useApp((s) => s.addContact);
  const count = useApp((s) => s.customContacts.length);
  const push = useNav((s) => s.push);

  const save = () => {
    const full = name.trim();
    if (!full) return;
    const id = `person-${Date.now().toString(36)}`;
    addContact({
      id,
      name: full.split(" ")[0],
      fullName: full,
      relation: "Contact",
      color: PALETTE[count % PALETTE.length],
      channels: channels.length ? channels : connected.slice(0, 1),
      activeMinsAgo: 0,
      custom: true,
    });
    toast(`${full} added`, "success");
    setName("");
    setChannels([]);
    onClose();
    setTimeout(() => push("contact", { id }), 250);
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add contact">
      <div className="space-y-5 pt-3">
        <TextField label="Name" value={name} onChange={setName} placeholder="e.g. Chloe Martin" />
        <div>
          <div className="mb-2 text-[13px] font-medium text-ink-2">Where do you chat?</div>
          <div className="flex flex-wrap gap-2">
            {CHANNELS.filter((c) => connected.includes(c.id)).map((c) => (
              <Chip
                key={c.id}
                selected={channels.includes(c.id)}
                icon={<BrandIcon id={c.id} size={16} />}
                onClick={() => setChannels((x) => (x.includes(c.id) ? x.filter((y) => y !== c.id) : [...x, c.id]))}
              >
                {c.name}
              </Chip>
            ))}
          </div>
        </div>
        <p className="rounded-[14px] bg-white/70 px-3.5 py-3 text-[13px] leading-[18px] text-ink-2">
          Thera will start building topics with this person as soon as you chat on the apps you pick.
        </p>
        <Button onClick={save} disabled={!name.trim()}>
          Add contact
        </Button>
      </div>
    </Sheet>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { BellOff, Bell, Pencil, Pin, PinOff, Share2, Trash2 } from "lucide-react";
import { TINTS } from "@/lib/data";
import { useApp, useNav, toast } from "@/lib/store";
import { activeLabel, ago, type ViewCollection, type ViewContact } from "@/lib/view";
import { CategoryBadges, CATEGORY_META } from "./icons";
import { ActionSheet, Avatar, Button, ConfirmSheet, Img, Sheet, TextField, cx, useLongPress } from "./ui";

export function PinMark({ className = "" }: { className?: string }) {
  return <Pin size={13} strokeWidth={2.4} className={cx("shrink-0 rotate-45 fill-current text-ink-3", className)} />;
}

export function CollectionTile({
  col,
  onOpen,
  onMenu,
  className = "",
  imageClass = "h-[64px]",
}: {
  col: ViewCollection;
  onOpen: () => void;
  onMenu: () => void;
  className?: string;
  imageClass?: string;
}) {
  const press = useLongPress(onMenu, onOpen);
  return (
    <button
      {...press}
      className={cx(
        "press flex select-none flex-col overflow-hidden rounded-[16px] border border-white text-left shadow-[0_2px_10px_rgba(15,23,42,0.04)]",
        className,
      )}
      style={{ background: TINTS[col.tint] }}
    >
      <Img
        src={col.cover}
        alt={col.title}
        tint={TINTS[col.tint]}
        fallbackIcon={CATEGORY_META[col.category].icon}
        className={cx("w-full shrink-0", imageClass)}
      />
      <div className="w-full px-3 pb-3 pt-2.5">
        <div className="flex items-center gap-1">
          <span className="truncate text-[16px] font-medium text-ink">{col.title}</span>
          {col.pinned && <PinMark />}
        </div>
        <div className="mt-0.5 text-[12px] text-ink-2">Updated {ago(col.updatedMinsAgo)}</div>
      </div>
    </button>
  );
}

export function ContactRow({
  contact,
  onOpen,
  onMenu,
  right,
}: {
  contact: ViewContact;
  onOpen: () => void;
  onMenu?: () => void;
  right?: ReactNode;
}) {
  const press = useLongPress(onMenu ?? (() => {}), onOpen);
  const muted = useApp((s) => s.mutedContacts.includes(contact.id));
  return (
    <button {...press} className="press card flex w-full select-none items-center gap-3 px-3.5 py-3 text-left">
      <Avatar contact={contact} size={42} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[17px] font-medium text-ink">{contact.fullName}</span>
          {contact.pinned && <PinMark />}
          {muted && <BellOff size={13} className="shrink-0 text-ink-3" />}
        </div>
        <div className="mt-0.5 text-[13px] text-ink-2">{activeLabel(contact.activeMinsAgo)}</div>
      </div>
      {right ?? <CategoryBadges categories={contact.categories} />}
    </button>
  );
}

export function TopicRow({ col, onOpen }: { col: ViewCollection; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="press flex w-full items-center gap-3 rounded-[16px] border border-white px-3.5 py-3 text-left"
      style={{ background: TINTS[col.tint] }}
    >
      <Img
        src={col.cover}
        alt={col.title}
        tint="#ffffff"
        fallbackIcon={CATEGORY_META[col.category].icon}
        className="h-10 w-10 shrink-0 rounded-[10px]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <span className="truncate text-[16px] font-medium text-ink">{col.title}</span>
          {col.pinned && <PinMark />}
        </div>
        <div className="text-[12px] text-ink-2">Updated {ago(col.updatedMinsAgo)}</div>
      </div>
    </button>
  );
}

/* ---------------- Menus ---------------- */

export function useCollectionMenu() {
  const [target, setTarget] = useState<ViewCollection | null>(null);
  const [renaming, setRenaming] = useState<ViewCollection | null>(null);
  const [deleting, setDeleting] = useState<ViewCollection | null>(null);
  const [name, setName] = useState("");
  const togglePin = useApp((s) => s.togglePinCollection);
  const rename = useApp((s) => s.renameCollection);
  const del = useApp((s) => s.deleteCollection);
  const stack = useNav((s) => s.stack);
  const pop = useNav((s) => s.pop);

  const node = (
    <>
      <ActionSheet
        open={!!target}
        onClose={() => setTarget(null)}
        header={
          target && (
            <div className="flex items-center gap-3">
              <Img src={target.cover} alt={target.title} className="h-11 w-11 rounded-[12px]" tint={TINTS[target.tint]} />
              <div>
                <div className="text-[16px] font-medium">{target.title}</div>
                <div className="text-[13px] text-ink-2">
                  {target.items.length} items · Updated {ago(target.updatedMinsAgo)}
                </div>
              </div>
            </div>
          )
        }
        actions={
          target
            ? [
                {
                  label: target.pinned ? "Unpin collection" : "Pin collection",
                  icon: target.pinned ? PinOff : Pin,
                  onClick: () => {
                    togglePin(target.id, target.pinned);
                    toast(target.pinned ? "Unpinned" : "Pinned to the top", "success");
                  },
                },
                {
                  label: "Rename",
                  icon: Pencil,
                  onClick: () => {
                    setName(target.title);
                    setRenaming(target);
                  },
                },
                {
                  label: "Share summary",
                  icon: Share2,
                  onClick: async () => {
                    const text = `${target.title}: ${target.summary}`;
                    try {
                      await navigator.clipboard.writeText(text);
                      toast("Summary copied to clipboard", "success");
                    } catch {
                      toast("Summary ready to share");
                    }
                  },
                },
                {
                  label: "Delete collection",
                  icon: Trash2,
                  danger: true,
                  onClick: () => setDeleting(target),
                },
              ]
            : []
        }
      />
      <Sheet open={!!renaming} onClose={() => setRenaming(null)} title="Rename collection">
        <form
          className="space-y-4 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (renaming && name.trim()) {
              rename(renaming.id, name.trim());
              toast("Collection renamed", "success");
            }
            setRenaming(null);
          }}
        >
          <TextField label="Name" value={name} onChange={setName} autoFocus />
          <Button type="submit" disabled={!name.trim()}>
            Save
          </Button>
        </form>
      </Sheet>
      <ConfirmSheet
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Delete "${deleting?.title}"?`}
        body="The collection and its summary will be removed from AIMemory. Your original messages are not affected."
        confirmLabel="Delete collection"
        onConfirm={() => {
          if (!deleting) return;
          const top = stack[stack.length - 1];
          del(deleting.id);
          toast("Collection deleted");
          if (top.name === "collection" && top.params?.id === deleting.id) pop();
        }}
      />
    </>
  );

  return { open: setTarget, node };
}

export function useContactMenu() {
  const [target, setTarget] = useState<ViewContact | null>(null);
  const [deleting, setDeleting] = useState<ViewContact | null>(null);
  const togglePin = useApp((s) => s.togglePinContact);
  const toggleMute = useApp((s) => s.toggleMute);
  const muted = useApp((s) => s.mutedContacts);
  const del = useApp((s) => s.deleteContact);
  const stack = useNav((s) => s.stack);
  const pop = useNav((s) => s.pop);

  const node = (
    <>
      <ActionSheet
        open={!!target}
        onClose={() => setTarget(null)}
        header={
          target && (
            <div className="card flex items-center gap-3 border-white bg-white/80 px-3.5 py-3">
              <Avatar contact={target} size={42} />
              <div className="flex-1">
                <div className="text-[17px] font-medium">{target.fullName}</div>
                <div className="text-[13px] text-ink-2">{activeLabel(target.activeMinsAgo)}</div>
              </div>
              <CategoryBadges categories={target.categories} />
            </div>
          )
        }
        actions={
          target
            ? [
                {
                  label: target.pinned ? "Unpin contact" : "Pin contact",
                  icon: target.pinned ? PinOff : Pin,
                  onClick: () => {
                    togglePin(target.id, target.pinned);
                    toast(target.pinned ? "Contact unpinned" : "Contact pinned", "success");
                  },
                },
                {
                  label: muted.includes(target.id) ? "Unmute notifications" : "Mute notifications",
                  icon: muted.includes(target.id) ? Bell : BellOff,
                  onClick: () => {
                    toggleMute(target.id);
                    toast(muted.includes(target.id) ? "Notifications on" : `You won't get alerts about ${target.name}`);
                  },
                },
                { label: "Delete", icon: Trash2, danger: true, onClick: () => setDeleting(target) },
              ]
            : []
        }
      />
      <ConfirmSheet
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={`Remove ${deleting?.fullName}?`}
        body={`AIMemory will stop tracking topics with ${deleting?.name}, and items they shared will be hidden. Your chats are not affected.`}
        confirmLabel="Remove contact"
        onConfirm={() => {
          if (!deleting) return;
          const top = stack[stack.length - 1];
          del(deleting.id);
          toast(`${deleting.name} removed`);
          if (top.name === "contact" && top.params?.id === deleting.id) pop();
        }}
      />
    </>
  );

  return { open: setTarget, node };
}

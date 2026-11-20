"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  ChevronRight,
  Download,
  HardDrive,
  LogOut,
  Pencil,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Star,
  Trash2,
} from "lucide-react";
import { CHANNELS, ITEMS, channelName } from "@/lib/data";
import { useApp, useNav, toast, type SyncFrequency } from "@/lib/store";
import { ago } from "@/lib/view";
import type { ChannelId } from "@/lib/types";
import { BrandIcon, LogoMark } from "../icons";
import { Avatar, Button, ConfirmSheet, Radio, Sheet, TextField, Toggle, cx } from "../ui";
import { ConnectSheet } from "../ConnectSheet";

const FREQ: { id: SyncFrequency; label: string; long: string }[] = [
  { id: "1h", label: "Every 1h", long: "Every hour" },
  { id: "6h", label: "Every 6h", long: "Every 6 hours" },
  { id: "12h", label: "Every 12h", long: "Every 12 hours" },
  { id: "24h", label: "Daily", long: "Once a day" },
  { id: "manual", label: "Manual", long: "Only when I tap Sync now" },
];

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 px-1 text-[15px] font-medium text-ink">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Row({
  icon,
  label,
  sub,
  right,
  onClick,
  danger,
}: {
  icon?: ReactNode;
  label: string;
  sub?: string;
  right?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp onClick={onClick} className={cx("card flex min-h-[52px] w-full items-center gap-3 px-3.5 py-2.5 text-left", onClick && "press")}>
      {icon}
      <div className="min-w-0 flex-1">
        <div className={cx("text-[15px]", danger ? "font-medium text-error" : "text-ink")}>{label}</div>
        {sub && <div className="text-[12px] text-ink-2">{sub}</div>}
      </div>
      {right}
    </Comp>
  );
}

export function Settings() {
  const user = useApp((s) => s.user);
  const setUser = useApp((s) => s.setUser);
  const connected = useApp((s) => s.connected);
  const connect = useApp((s) => s.connect);
  const disconnect = useApp((s) => s.disconnect);
  const mainMemory = useApp((s) => s.mainMemory);
  const setMainMemory = useApp((s) => s.setMainMemory);
  const prefs = useApp((s) => s.prefs);
  const setPrefs = useApp((s) => s.setPrefs);
  const lastSyncedAt = useApp((s) => s.lastSyncedAt);
  const markSynced = useApp((s) => s.markSynced);
  const setStage = useApp((s) => s.setStage);
  const resetAll = useApp((s) => s.resetAll);
  const reset = useNav((s) => s.reset);

  const [pending, setPending] = useState<ChannelId | null>(null);
  const [disconnecting, setDisconnecting] = useState<ChannelId | null>(null);
  const [editing, setEditing] = useState(false);
  const [freqOpen, setFreqOpen] = useState(false);
  const [mainOpen, setMainOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [confirm, setConfirm] = useState<"signout" | "reset" | "restart" | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const onConnected = useCallback(
    (c: ChannelId) => {
      connect(c);
      const n = ITEMS.filter((i) => i.channel === c).length;
      setTimeout(() => toast(n ? `${n} new item${n > 1 ? "s" : ""} added from ${channelName(c)}` : `${channelName(c)} connected`, "success"), 400);
    },
    [connect],
  );
  const closeConnect = useCallback(() => setPending(null), []);

  const sync = () => {
    if (syncing) return;
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      markSynced();
      const total = CHANNELS.filter((c) => connected.includes(c.id)).length;
      toast(total ? `Up to date. Checked ${total} app${total > 1 ? "s" : ""}` : "Connect an app to sync", "success");
    }, 1600);
  };

  const minsSinceSync = lastSyncedAt ? (Date.now() - lastSyncedAt) / 60000 : null;

  return (
    <div className="no-scrollbar absolute inset-0 overflow-y-auto bg-app px-4 pb-[150px] pt-[calc(var(--sat)+10px)]">
      <div className="relative flex flex-col items-center pt-2">
        <button
          onClick={() => {
            setName(user.name);
            setEmail(user.email);
            setEditing(true);
          }}
          className="press absolute right-0 top-0 flex items-center gap-1 text-[14px] font-medium text-brand"
        >
          Edit profile <Pencil size={14} />
        </button>
        <Avatar name={user.name} color="#D3E5FD" size={72} ring />
        <h1 className="mt-2.5 text-[20px] font-semibold text-ink">{user.name}</h1>
        <p className="text-[13px] text-ink-2">{user.email}</p>
      </div>

      <Group title="Connected memories">
        {CHANNELS.map((c) => {
          const on = connected.includes(c.id);
          return (
            <Row
              key={c.id}
              icon={<BrandIcon id={c.id} size={24} />}
              label={c.name}
              sub={on ? (mainMemory === c.id ? "Main memory · " : "") + `${c.messages.toLocaleString("en-GB")} messages` : undefined}
              right={
                <Toggle
                  on={on}
                  label={`Connect ${c.name}`}
                  onChange={(v) => (v ? setPending(c.id) : setDisconnecting(c.id))}
                />
              }
            />
          );
        })}
      </Group>

      <Group title="Preferences">
        <Row
          label="Main memory"
          onClick={() => (connected.length ? setMainOpen(true) : toast("Connect an app first"))}
          right={
            <span className="flex items-center gap-1 text-[14px] font-medium text-brand">
              {mainMemory ? channelName(mainMemory) : "None"} <ChevronRight size={16} />
            </span>
          }
        />
        <Row
          label="Auto-sync frequency"
          onClick={() => setFreqOpen(true)}
          right={
            <span className="flex items-center gap-1 text-[14px] font-medium text-brand">
              {FREQ.find((f) => f.id === prefs.syncFrequency)?.label} <ChevronRight size={16} />
            </span>
          }
        />
        <Row
          label="Sync now"
          sub={minsSinceSync !== null ? `Last synced ${ago(minsSinceSync)}` : "Never synced"}
          onClick={sync}
          right={<RefreshCw size={18} className={cx("text-brand", syncing && "spin-slow")} />}
        />
        <Row
          label="Location access"
          sub="Adds nearby places to your plans"
          right={
            <Toggle
              on={prefs.location}
              label="Location access"
              onChange={(v) => {
                setPrefs({ location: v });
                toast(v ? "Location access on" : "Location access off");
              }}
            />
          }
        />
        <Row
          label="Push notifications"
          sub="Reminders for plans and new topics"
          right={
            <Toggle
              on={prefs.notifications}
              label="Push notifications"
              onChange={(v) => {
                setPrefs({ notifications: v });
                toast(v ? "Notifications on" : "Notifications off");
              }}
            />
          }
        />
      </Group>

      <Group title="Privacy">
        <Row
          icon={<ShieldCheck size={20} className="text-brand" />}
          label="How AIMemory handles your data"
          onClick={() => setPrivacyOpen(true)}
          right={<ChevronRight size={16} className="text-ink-3" />}
        />
        <Row
          icon={<Download size={20} className="text-ink-2" />}
          label="Download my data"
          onClick={() => toast("We'll email you a copy within 24 hours", "success")}
          right={<ChevronRight size={16} className="text-ink-3" />}
        />
      </Group>

      <Group title="Demo">
        <Row
          icon={<RotateCcw size={20} className="text-ink-2" />}
          label="Replay onboarding"
          sub="Start again from the welcome screen"
          onClick={() => setConfirm("restart")}
        />
        <Row
          icon={<Trash2 size={20} className="text-error" />}
          label="Reset demo data"
          sub="Undo every change you've made"
          danger
          onClick={() => setConfirm("reset")}
        />
        <Row icon={<LogOut size={20} className="text-ink-2" />} label="Sign out" onClick={() => setConfirm("signout")} />
      </Group>

      <div className="mt-8 flex flex-col items-center gap-1 text-[12px] text-ink-3">
        <LogoMark size={28} />
        AIMemory 1.0 · Interactive demo
      </div>

      <ConnectSheet channel={pending} onClose={closeConnect} onConnected={onConnected} />

      <ConfirmSheet
        open={!!disconnecting}
        onClose={() => setDisconnecting(null)}
        title={`Disconnect ${disconnecting ? channelName(disconnecting) : ""}?`}
        body={`Items found in ${disconnecting ? channelName(disconnecting) : ""} will be removed from your collections. You can reconnect at any time.`}
        confirmLabel="Disconnect"
        onConfirm={() => {
          if (!disconnecting) return;
          disconnect(disconnecting);
          toast(`${channelName(disconnecting)} disconnected`);
        }}
      />

      <Sheet open={editing} onClose={() => setEditing(false)} title="Edit profile">
        <form
          className="space-y-4 pt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            setUser({ name: name.trim(), email: email.trim() });
            setEditing(false);
            toast("Profile updated", "success");
          }}
        >
          <div className="flex justify-center">
            <Avatar name={name || "?"} color="#D3E5FD" size={64} ring />
          </div>
          <TextField label="Name" value={name} onChange={setName} />
          <TextField label="Email" type="email" value={email} onChange={setEmail} />
          <Button type="submit" disabled={!name.trim()}>
            Save
          </Button>
        </form>
      </Sheet>

      <Sheet open={freqOpen} onClose={() => setFreqOpen(false)} title="Auto-sync frequency">
        <div className="space-y-2 pt-3">
          {FREQ.map((f) => (
            <button
              key={f.id}
              onClick={() => {
                setPrefs({ syncFrequency: f.id });
                setFreqOpen(false);
                toast(`Sync set to ${f.long.toLowerCase()}`);
              }}
              className="press card flex w-full items-center gap-3 border-white bg-white/80 px-4 py-3.5 text-left"
            >
              <Radio checked={prefs.syncFrequency === f.id} />
              <span className="text-[15px] text-ink">{f.long}</span>
            </button>
          ))}
          <p className="px-1 pt-1 text-[12px] leading-[17px] text-ink-3">
            More frequent syncing keeps collections fresh but uses a little more battery.
          </p>
        </div>
      </Sheet>

      <Sheet open={mainOpen} onClose={() => setMainOpen(false)} title="Main memory">
        <div className="space-y-2 pt-3">
          {connected.map((c) => (
            <button
              key={c}
              onClick={() => {
                setMainMemory(c);
                setMainOpen(false);
                toast(`${channelName(c)} is now your main memory`, "success");
              }}
              className="press card flex w-full items-center gap-3 border-white bg-white/80 px-4 py-3 text-left"
            >
              <Radio checked={mainMemory === c} />
              <BrandIcon id={c} size={32} />
              <span className="flex-1 text-[15px] font-medium text-ink">{channelName(c)}</span>
              {mainMemory === c && <Star size={16} className="fill-warning text-warning" />}
            </button>
          ))}
        </div>
      </Sheet>

      <Sheet open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Your data">
        <div className="space-y-3 pt-3">
          {[
            { icon: HardDrive, title: "Processed on your device", body: "Messages are analysed on your phone. Raw messages are never uploaded to our servers." },
            { icon: ShieldCheck, title: "Only summaries are kept", body: "AIMemory stores the summaries, plans and links you see, encrypted with a key only your devices hold." },
            { icon: Trash2, title: "Delete anything, any time", body: "Remove a collection, a contact or a whole app, and its summaries are deleted straight away." },
          ].map((r) => (
            <div key={r.title} className="flex gap-3 rounded-[16px] border border-white bg-white/80 p-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand">
                <r.icon size={18} />
              </span>
              <div>
                <div className="text-[15px] font-medium text-ink">{r.title}</div>
                <div className="mt-0.5 text-[13px] leading-[18px] text-ink-2">{r.body}</div>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={() => setPrivacyOpen(false)}>
            Got it
          </Button>
        </div>
      </Sheet>

      <ConfirmSheet
        open={confirm === "signout"}
        onClose={() => setConfirm(null)}
        title="Sign out?"
        body="Your memory stays saved. Sign back in any time to restore it."
        confirmLabel="Sign out"
        danger={false}
        onConfirm={() => {
          setStage("welcome");
          reset("welcome");
        }}
      />
      <ConfirmSheet
        open={confirm === "restart"}
        onClose={() => setConfirm(null)}
        title="Replay onboarding?"
        body="You'll go back to the welcome screen and connect your apps again. Pinned items and new collections are kept."
        confirmLabel="Replay onboarding"
        danger={false}
        onConfirm={() => {
          useApp.setState({ connected: [], mainMemory: null });
          setStage("welcome");
          reset("welcome");
        }}
      />
      <ConfirmSheet
        open={confirm === "reset"}
        onClose={() => setConfirm(null)}
        title="Reset the demo?"
        body="This clears everything you've changed in this browser and starts the demo from scratch."
        confirmLabel="Reset demo"
        onConfirm={() => {
          resetAll();
          reset("welcome");
        }}
      />
    </div>
  );
}

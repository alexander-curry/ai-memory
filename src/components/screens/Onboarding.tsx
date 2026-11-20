"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowRight, Check, CloudCog, Lock, ShieldCheck, Smartphone, Unplug } from "lucide-react";
import { CHANNELS, ITEMS } from "@/lib/data";
import { useApp, useNav, toast } from "@/lib/store";
import { computeView } from "@/lib/view";
import type { ChannelId } from "@/lib/types";
import type { ScreenProps } from "../App";
import { BrandIcon, LogoMark } from "../icons";
import { ActionSheet, Avatar, BackButton, Button, Radio, TextField, cx } from "../ui";
import { ConnectSheet } from "../ConnectSheet";

/* ---------------- Shared layout ---------------- */

function Frame({
  children,
  footer,
  back,
  className = "",
}: {
  children: ReactNode;
  footer?: ReactNode;
  back?: boolean;
  className?: string;
}) {
  const pop = useNav((s) => s.pop);
  return (
    <div className={cx("onboarding-bg absolute inset-0 flex flex-col pt-[var(--sat)]", className)}>
      {back && (
        <div className="absolute left-4 top-[calc(var(--sat)+8px)] z-20">
          <BackButton onClick={pop} />
        </div>
      )}
      <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>
      {footer && <div className="shrink-0 space-y-2.5 px-4 pb-[calc(var(--sab)+12px)] pt-3">{footer}</div>}
    </div>
  );
}

function Copy({ title, body }: { title: ReactNode; body: ReactNode }) {
  return (
    <div className="animate-rise px-6 text-center" style={{ animationDelay: "120ms" }}>
      <h1 className="text-[28px] font-semibold leading-[34px] tracking-[-0.02em] text-ink">{title}</h1>
      <p className="mx-auto mt-3 max-w-[330px] text-[14px] leading-[21px] text-ink-2">{body}</p>
    </div>
  );
}

/* ---------------- 1. Welcome ---------------- */

const ORBIT: { id: ChannelId; x: number; y: number; halo: string }[] = [
  { id: "imessage", x: 58, y: 44, halo: "#e5e7eb" },
  { id: "instagram", x: 150, y: 58, halo: "#fbcfe8" },
  { id: "tiktok", x: 214, y: 46, halo: "#cffafe" },
  { id: "facebook", x: 300, y: 100, halo: "#bfdbfe" },
  { id: "whatsapp", x: 44, y: 128, halo: "#bbf7d0" },
  { id: "gmail", x: 306, y: 182, halo: "#fecaca" },
  { id: "telegram", x: 38, y: 222, halo: "#bae6fd" },
  { id: "messenger", x: 128, y: 284, halo: "#ddd6fe" },
  { id: "google", x: 244, y: 274, halo: "#fef3c7" },
];

const MESH = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 137.5) % 360,
  y: ((i * 89.3) % 300) + 20,
}));

function NetworkIllustration() {
  const cx0 = 180;
  const cy0 = 165;
  return (
    <div className="relative mx-auto h-[330px] w-[360px] max-w-full">
      <svg viewBox="0 0 360 330" className="absolute inset-0 h-full w-full">
        {MESH.map((p, i) => {
          const q = MESH[(i * 7 + 3) % MESH.length];
          return <line key={`m${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#0f172a" strokeOpacity="0.05" />;
        })}
        {MESH.map((p, i) => (
          <circle key={`c${i}`} cx={p.x} cy={p.y} r={i % 4 === 0 ? 6 : 3} fill="#0f172a" fillOpacity="0.06" />
        ))}
        {ORBIT.map((o) => (
          <line key={o.id} x1={cx0} y1={cy0} x2={o.x} y2={o.y} stroke="#ffffff" strokeWidth="2" />
        ))}
      </svg>
      <div
        className="animate-fade absolute flex h-[116px] w-[116px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[6px] border-white/70 bg-[#f4f4f6] shadow-[0_10px_40px_rgba(104,82,250,0.18)]"
        style={{ left: `${(cx0 / 360) * 100}%`, top: `${(cy0 / 330) * 100}%` }}
      >
        <LogoMark size={70} />
      </div>
      {ORBIT.map((o, i) => (
        <div
          key={o.id}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${(o.x / 360) * 100}%`, top: `${(o.y / 330) * 100}%` }}
        >
          <div className="animate-float" style={{ animationDelay: `${i * 0.45}s` }}>
            <div
              className="animate-rise flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white"
              style={{ boxShadow: `0 0 0 5px ${o.halo}`, animationDelay: `${120 + i * 50}ms` }}
            >
              <BrandIcon id={o.id} size={22} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function Welcome() {
  const push = useNav((s) => s.push);
  return (
    <Frame
      footer={
        <>
          <Button onClick={() => push("ob-ai")}>
            Get started <ArrowRight size={18} />
          </Button>
          <Button variant="secondary" onClick={() => push("signin")}>
            I have an account
          </Button>
        </>
      }
    >
      <div className="flex flex-1 flex-col justify-center pt-4">
        <NetworkIllustration />
        <div className="mt-4">
          <Copy
            title={
              <>
                Your conversations,
                <br />
                finally organised
              </>
            }
            body="You share links, plans and ideas every day. AIMemory connects them all and automatically organises your chats in one place."
          />
        </div>
      </div>
    </Frame>
  );
}

/* ---------------- 2. AI organisation ---------------- */

function Bubble({ text, tag, tagColor, side, delay, avatar }: { text: string; tag: string; tagColor: string; side: "left" | "right"; delay: number; avatar: { name: string; color: string } }) {
  return (
    <div
      className={cx("animate-rise flex items-start gap-2", side === "right" && "flex-row-reverse")}
      style={{ animationDelay: `${delay}ms` }}
    >
      <Avatar name={avatar.name} color={avatar.color} size={38} ring />
      <div className={cx("relative max-w-[210px]", side === "left" ? "rotate-[2.5deg]" : "-rotate-[2.5deg]")}>
        <div className="rounded-[16px] bg-[#d9d3fb] px-3.5 py-2.5 text-[13px] leading-[18px] text-ink shadow-sm">{text}</div>
        <span
          className={cx("absolute -bottom-3 rounded-full px-2.5 py-1 text-[12px] font-medium text-ink shadow-sm", side === "left" ? "right-4" : "left-6")}
          style={{ background: tagColor }}
        >
          {tag}
        </span>
      </div>
    </div>
  );
}

export function ObAI() {
  const push = useNav((s) => s.push);
  return (
    <Frame
      back
      footer={
        <Button onClick={() => push("ob-privacy")}>
          Continue <ArrowRight size={18} />
        </Button>
      }
    >
      <div className="flex flex-1 flex-col justify-center px-5 pt-14">
        <div className="relative mx-auto w-full max-w-[340px]">
          <div className="animate-rise w-fit rounded-[14px] rounded-bl-[4px] bg-white/90 px-3.5 py-2 text-[13px] leading-[18px] text-ink-2 shadow-sm">
            Hi! Ask me anything about
            <br />
            your conversations.
          </div>
          <div className="mx-auto -mt-2 flex h-[104px] w-[104px] items-center justify-center rounded-full border-[5px] border-white/80 bg-[#f4f4f6] shadow-[0_10px_30px_rgba(104,82,250,0.15)]">
            <LogoMark size={60} />
          </div>
          <div className="mt-6 space-y-9">
            <div className="flex justify-end">
              <Bubble side="left" delay={250} text="Show me all hotels James and I discussed" tag="Trip to Italy" tagColor="#d3e5fd" avatar={{ name: "Sophia Bennett", color: "#F6D2DB" }} />
            </div>
            <div className="flex justify-start">
              <Bubble side="right" delay={420} text="Find all restaurants we saved for Tokyo" tag="Restaurants" tagColor="#dcf2e0" avatar={{ name: "Lisa Williams", color: "#E6DAF7" }} />
            </div>
          </div>
        </div>
        <div className="mt-14">
          <Copy
            title={
              <>
                AI that reads
                <br />
                between the messages
              </>
            }
            body="Connect your apps once. AIMemory quietly analyses your conversations in the background and groups everything into topics, like trips, house hunting, restaurants and work."
          />
        </div>
      </div>
    </Frame>
  );
}

/* ---------------- 3. Privacy ---------------- */

export function ObPrivacy() {
  const push = useNav((s) => s.push);
  return (
    <Frame
      back
      footer={
        <Button onClick={() => push("ob-connect")}>
          Connect my apps <ArrowRight size={18} />
        </Button>
      }
    >
      <div className="flex flex-1 flex-col justify-center">
        <div className="dot-grid relative mx-auto h-[330px] w-full max-w-[380px]">
          <svg viewBox="0 0 360 330" className="absolute inset-0 h-full w-full">
            <ellipse cx="180" cy="160" rx="160" ry="62" fill="none" stroke="#fff" strokeWidth="2" transform="rotate(-28 180 160)" />
          </svg>
          <div className="absolute left-1/2 top-[48%] -translate-x-1/2 -translate-y-1/2">
            <div className="animate-rise">
              <LogoMark size={170} />
            </div>
          </div>
          {[
            { icon: Smartphone, x: "79%", y: "18%", d: "0s" },
            { icon: CloudCog, x: "20%", y: "74%", d: "1.2s" },
          ].map((b, i) => (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: b.x, top: b.y }}>
              <div className="animate-float" style={{ animationDelay: b.d }}>
                <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-white text-brand shadow-[0_0_0_7px_rgba(203,213,225,0.55)]">
                  <b.icon size={26} />
                </div>
              </div>
            </div>
          ))}
          <div className="absolute left-[73%] top-[64%] flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[12px] font-medium text-ink shadow-sm">
            <Lock size={13} className="text-success" /> On-device
          </div>
        </div>
        <div className="mt-6">
          <Copy
            title="Your chats stay yours"
            body="AIMemory never stores your raw messages on a server. Processing happens on your device, and we only keep the summaries you see. Nothing else leaves your phone without your consent."
          />
        </div>
      </div>
    </Frame>
  );
}

/* ---------------- 4. Connect ---------------- */

export function ObConnect() {
  const push = useNav((s) => s.push);
  const connected = useApp((s) => s.connected);
  const connect = useApp((s) => s.connect);
  const disconnect = useApp((s) => s.disconnect);
  const [pending, setPending] = useState<ChannelId | null>(null);
  const [manage, setManage] = useState<ChannelId | null>(null);
  const onConnected = useCallback((c: ChannelId) => connect(c), [connect]);
  const closeSheet = useCallback(() => setPending(null), []);

  const tiles = CHANNELS.filter((c) => c.inOnboarding);
  const totalMessages = CHANNELS.filter((c) => connected.includes(c.id)).reduce((n, c) => n + c.messages, 0);

  return (
    <Frame
      back
      footer={
        <>
          <p className="pb-1 text-center text-[13px] text-ink-2">
            {connected.length
              ? `${connected.length} app${connected.length > 1 ? "s" : ""} connected, ${totalMessages.toLocaleString("en-GB")} messages`
              : "Connect at least one app to continue"}
          </p>
          <Button disabled={!connected.length} onClick={() => push("ob-main")}>
            Continue <ArrowRight size={18} />
          </Button>
        </>
      }
    >
      <div className="px-4 pb-4 pt-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">Connect your memory</h1>
        <p className="mt-1.5 text-[14px] leading-5 text-ink-2">
          AIMemory reads your conversations to build smart collections, so you never lose track of what matters.
        </p>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {tiles.map((c, i) => {
            const on = connected.includes(c.id);
            return (
              <button
                key={c.id}
                onClick={() => (on ? setManage(c.id) : setPending(c.id))}
                className={cx(
                  "press animate-rise card relative flex h-[132px] flex-col items-center justify-center gap-2.5",
                  on && "border-brand/40 bg-white",
                )}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <BrandIcon id={c.id} size={54} />
                <span className="text-[15px] font-medium text-ink">{c.name}</span>
                {on && (
                  <span className="-mt-1.5 flex items-center gap-1 text-[12px] text-ink-2">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-success text-white">
                      <Check size={9} strokeWidth={3.5} />
                    </span>
                    Connected
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <ConnectSheet channel={pending} onClose={closeSheet} onConnected={onConnected} />
      <ActionSheet
        open={!!manage}
        onClose={() => setManage(null)}
        header={
          manage && (
            <div className="flex items-center gap-3">
              <BrandIcon id={manage} size={36} />
              <div>
                <div className="text-[16px] font-medium">{CHANNELS.find((c) => c.id === manage)?.name}</div>
                <div className="text-[13px] text-ink-2">Connected</div>
              </div>
            </div>
          )
        }
        actions={[
          {
            label: "Disconnect",
            icon: Unplug,
            danger: true,
            onClick: () => {
              if (manage) {
                disconnect(manage);
                toast(`${CHANNELS.find((c) => c.id === manage)?.name} disconnected`);
              }
            },
          },
        ]}
      />
    </Frame>
  );
}

/* ---------------- 5. Main memory ---------------- */

export function ObMain() {
  const push = useNav((s) => s.push);
  const connected = useApp((s) => s.connected);
  const mainMemory = useApp((s) => s.mainMemory);
  const setMainMemory = useApp((s) => s.setMainMemory);
  const selected = mainMemory && connected.includes(mainMemory) ? mainMemory : connected[0];

  return (
    <Frame
      back
      footer={
        <Button
          disabled={!selected}
          onClick={() => {
            setMainMemory(selected ?? null);
            push("ob-building");
          }}
        >
          Continue <ArrowRight size={18} />
        </Button>
      }
    >
      <div className="px-4 pt-14">
        <h1 className="text-[28px] font-semibold tracking-[-0.02em] text-ink">Your main memory</h1>
        <p className="mt-1.5 text-[14px] leading-5 text-ink-2">
          Pick your main memory stream. This becomes your primary account, and Thera checks it first.
        </p>
        <div className="mt-5 space-y-3">
          {connected.map((id, i) => {
            const c = CHANNELS.find((x) => x.id === id)!;
            const on = selected === id;
            return (
              <button
                key={id}
                onClick={() => setMainMemory(id)}
                className={cx(
                  "press card animate-rise flex w-full items-center gap-3 px-4 py-4 text-left",
                  on && "border-brand/40 bg-white",
                )}
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <Radio checked={on} />
                <BrandIcon id={id} size={48} />
                <div>
                  <div className="text-[16px] font-medium text-ink">{c.name}</div>
                  <div className="mt-0.5 flex items-center gap-1 text-[12px] text-ink-2">
                    <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#5b6472] text-white">
                      <Check size={9} strokeWidth={3.5} />
                    </span>
                    Connected · {c.messages.toLocaleString("en-GB")} messages
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </Frame>
  );
}

/* ---------------- 6. Building ---------------- */

export function ObBuilding({ route }: ScreenProps) {
  const reset = useNav((s) => s.reset);
  const setStage = useApp((s) => s.setStage);
  const connected = useApp((s) => s.connected);
  const restoring = route.params?.restore === "1";
  const [step, setStep] = useState(0);

  const stats = useMemo(() => {
    const s = useApp.getState();
    const view = computeView({ ...s });
    return {
      messages: CHANNELS.filter((c) => connected.includes(c.id)).reduce((n, c) => n + c.messages, 0),
      collections: view.collections.length,
      people: view.contacts.length,
      items: ITEMS.filter((i) => connected.includes(i.channel)).length,
    };
  }, [connected]);

  const steps = [
    `Reading ${stats.messages.toLocaleString("en-GB")} messages`,
    "Finding plans, links and places",
    `Linking ${stats.people} people`,
    `Creating ${stats.collections} collections`,
  ];

  useEffect(() => {
    if (step >= steps.length) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 900 : 750);
    return () => clearTimeout(t);
  }, [step, steps.length]);

  const done = step >= steps.length;

  const finish = () => {
    useApp.setState({ bannerDismissed: false, lastSyncedAt: Date.now() });
    setStage("app");
    reset("home");
  };

  return (
    <Frame
      footer={
        <Button disabled={!done} onClick={finish}>
          {done ? "Open my memory" : "Building..."}
          {done && <ArrowRight size={18} />}
        </Button>
      }
    >
      <div className="flex flex-1 flex-col items-center justify-center px-6">
        <div className="relative flex h-[150px] w-[150px] items-center justify-center">
          {!done && (
            <>
              <span className="pulse-ring absolute inset-0 rounded-full border-2 border-brand/30" />
              <span className="pulse-ring absolute inset-0 rounded-full border-2 border-brand/20" style={{ animationDelay: "1.2s" }} />
            </>
          )}
          <div className="flex h-[120px] w-[120px] items-center justify-center rounded-full border-[6px] border-white/80 bg-[#f4f4f6] shadow-[0_10px_40px_rgba(104,82,250,0.2)]">
            <LogoMark size={70} />
          </div>
        </div>
        <h1 className="mt-6 text-center text-[26px] font-semibold tracking-[-0.02em] text-ink">
          {done ? "Your memory is ready" : restoring ? "Restoring your memory" : "Building your memory"}
        </h1>
        <p className="mt-2 text-center text-[14px] text-ink-2">
          {done
            ? `${stats.collections} collections, ${stats.people} people and ${stats.items} items, organised for you.`
            : "This only takes a moment. Everything stays on your device."}
        </p>
        <div className="mt-7 w-full max-w-[300px] space-y-3">
          {steps.map((label, i) => (
            <div key={label} className={cx("flex items-center gap-3 transition-opacity", i > step && "opacity-35")}>
              <span
                className={cx(
                  "flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                  i < step ? "bg-success text-white" : "bg-white",
                )}
              >
                {i < step ? (
                  <Check size={14} strokeWidth={3} />
                ) : i === step ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-brand/30 border-t-brand spin-slow" />
                ) : null}
              </span>
              <span className="text-[15px] text-ink">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
}

/* ---------------- Sign in ---------------- */

export function SignIn() {
  const push = useNav((s) => s.push);
  const user = useApp((s) => s.user);
  const setUser = useApp((s) => s.setUser);
  const setConnected = useApp((s) => s.setConnected);
  const setMainMemory = useApp((s) => s.setMainMemory);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState("demo-password");
  const [loading, setLoading] = useState(false);

  const submit = () => {
    if (!email.includes("@")) {
      toast("Enter an email address");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setUser({ email });
      setConnected(["instagram", "whatsapp", "telegram", "facebook"]);
      setMainMemory("instagram");
      push("ob-building", { restore: "1" });
      setLoading(false);
    }, 900);
  };

  return (
    <Frame
      back
      footer={
        <>
          <Button onClick={submit} disabled={loading}>
            {loading ? <span className="h-5 w-5 rounded-full border-2 border-white/40 border-t-white spin-slow" /> : "Sign in"}
          </Button>
          <p className="text-center text-[12px] text-ink-3">Demo account: any email and password will work.</p>
        </>
      }
    >
      <div className="px-5 pt-20">
        <div className="flex h-[76px] w-[76px] items-center justify-center rounded-[22px] border border-white bg-white/80 shadow-sm">
          <LogoMark size={46} />
        </div>
        <h1 className="mt-5 text-[28px] font-semibold tracking-[-0.02em] text-ink">Welcome back</h1>
        <p className="mt-1.5 text-[14px] text-ink-2">Sign in to restore your memory on this device.</p>
        <form
          className="mt-6 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <TextField label="Email" type="email" value={email} onChange={setEmail} />
          <TextField label="Password" type="password" value={password} onChange={setPassword} />
          <button type="button" onClick={() => toast("We've sent a reset link to your email")} className="text-[14px] font-medium text-brand">
            Forgot password?
          </button>
          <button type="submit" className="hidden" />
        </form>
        <div className="mt-8 flex items-center gap-3 rounded-[16px] border border-white bg-white/60 p-3.5 text-[13px] leading-5 text-ink-2">
          <ShieldCheck size={20} className="shrink-0 text-brand" />
          Your summaries are end-to-end encrypted and only decrypted on your devices.
        </div>
      </div>
    </Frame>
  );
}

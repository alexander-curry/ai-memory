"use client";

import { useEffect, useState } from "react";
import { BookOpenText, Check, HardDrive, ShieldCheck } from "lucide-react";
import { CHANNELS, ITEMS, channelName } from "@/lib/data";
import type { ChannelId } from "@/lib/types";
import { BrandIcon, LogoMark } from "./icons";
import { Button, Sheet } from "./ui";

type Step = "consent" | "importing" | "done";

export function ConnectSheet({
  channel,
  onClose,
  onConnected,
}: {
  channel: ChannelId | null;
  onClose: () => void;
  onConnected: (c: ChannelId) => void;
}) {
  const [step, setStep] = useState<Step>("consent");
  const [count, setCount] = useState(0);
  const [shown, setShown] = useState<ChannelId | null>(channel);

  useEffect(() => {
    if (channel) {
      setShown(channel);
      setStep("consent");
      setCount(0);
    }
  }, [channel]);

  const meta = CHANNELS.find((c) => c.id === shown);
  const found = ITEMS.filter((i) => i.channel === shown).length;

  useEffect(() => {
    if (step !== "importing" || !meta) return;
    const total = meta.messages;
    const started = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - started) / 2200);
      setCount(Math.round(total * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(() => setStep("done"), 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [step, meta]);

  useEffect(() => {
    if (step !== "done" || !shown) return;
    const t = setTimeout(() => {
      onConnected(shown);
      onClose();
    }, 1100);
    return () => clearTimeout(t);
  }, [step, shown, onConnected, onClose]);

  if (!meta) return null;
  const progress = meta.messages ? count / meta.messages : 0;

  return (
    <Sheet open={!!channel} onClose={step === "importing" ? () => {} : onClose}>
      <div className="pt-6">
        <div className="flex items-center justify-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-white bg-white shadow-sm">
            <LogoMark size={38} />
          </div>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-brand/40"
                style={{ animation: step === "importing" ? `typing 1s ${i * 0.15}s infinite` : undefined }}
              />
            ))}
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-white bg-white shadow-sm">
            <BrandIcon id={meta.id} size={36} />
          </div>
        </div>

        {step === "consent" && (
          <div className="animate-fade">
            <h3 className="mt-5 text-center text-[20px] font-semibold text-ink">Connect {meta.name}</h3>
            <p className="mx-auto mt-1.5 max-w-[290px] text-center text-[14px] leading-5 text-ink-2">
              AIMemory would like to access your {meta.name} conversations.
            </p>
            <div className="mt-5 space-y-3 rounded-[20px] border border-white bg-white/70 p-4">
              {[
                { icon: BookOpenText, text: "Read your message history to find plans, links, places and photos" },
                { icon: HardDrive, text: "Process everything on this device and keep only the summaries" },
                { icon: ShieldCheck, text: "Never post, send or delete anything on your behalf" },
              ].map((r) => (
                <div key={r.text} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-brand">
                    <r.icon size={16} />
                  </span>
                  <span className="pt-1 text-[14px] leading-5 text-ink">{r.text}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 space-y-2.5">
              <Button onClick={() => setStep("importing")}>Allow access</Button>
              <Button variant="secondary" onClick={onClose}>
                Not now
              </Button>
            </div>
            <p className="mt-3 text-center text-[12px] text-ink-3">
              Demo mode: no real {channelName(meta.id)} account is accessed.
            </p>
          </div>
        )}

        {step === "importing" && (
          <div className="animate-fade pb-6 text-center">
            <h3 className="mt-5 text-[20px] font-semibold text-ink">Reading your {meta.name} chats</h3>
            <p className="mt-1.5 text-[14px] text-ink-2">{count.toLocaleString("en-GB")} messages analysed</p>
            <div className="mx-auto mt-6 h-2 w-full overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-brand transition-[width] duration-100" style={{ width: `${progress * 100}%` }} />
            </div>
            <p className="mt-3 text-[13px] text-ink-3">
              {progress < 0.45 ? "Finding links and places..." : progress < 0.85 ? "Spotting plans and dates..." : "Grouping into topics..."}
            </p>
          </div>
        )}

        {step === "done" && (
          <div className="animate-fade pb-6 text-center">
            <div className="mx-auto mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-success text-white">
              <Check size={26} strokeWidth={3} />
            </div>
            <h3 className="mt-3 text-[20px] font-semibold text-ink">{meta.name} connected</h3>
            <p className="mt-1 text-[14px] text-ink-2">
              {meta.messages.toLocaleString("en-GB")} messages analysed, {found} item{found === 1 ? "" : "s"} found
            </p>
          </div>
        )}
      </div>
    </Sheet>
  );
}

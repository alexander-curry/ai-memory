"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, Search, X, Check, ImageOff, type LucideIcon } from "lucide-react";
import { useToast } from "@/lib/store";
import { LogoMark } from "./icons";
import type { Contact } from "@/lib/types";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/* ---------------- Buttons ---------------- */

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  className = "",
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  const styles = {
    primary:
      "bg-brand text-white shadow-[0_10px_24px_-10px_rgba(104,82,250,0.75)] hover:bg-brand-dark disabled:shadow-none",
    secondary: "bg-white/90 text-ink border border-white shadow-[0_2px_10px_rgba(15,23,42,0.06)]",
    danger: "bg-error text-white",
    ghost: "bg-transparent text-brand",
  }[variant];
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "press flex h-12 w-full items-center justify-center gap-1.5 rounded-full px-5 text-[16px] font-medium disabled:opacity-40",
        styles,
        className,
      )}
    >
      {children}
    </button>
  );
}

export function CircleButton({
  icon: Icon,
  onClick,
  label,
  className = "",
  size = 36,
}: {
  icon: LucideIcon;
  onClick?: () => void;
  label: string;
  className?: string;
  size?: number;
}) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{ width: size, height: size }}
      className={cx(
        "press flex shrink-0 items-center justify-center rounded-full bg-white/90 text-ink shadow-[0_1px_4px_rgba(15,23,42,0.08)]",
        className,
      )}
    >
      <Icon size={18} strokeWidth={2.2} />
    </button>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return <CircleButton icon={ChevronLeft} onClick={onClick} label="Back" />;
}

/* ---------------- Chips ---------------- */

export function Chip({
  children,
  selected,
  onClick,
  icon,
  className = "",
  onRemove,
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
  className?: string;
  onRemove?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        "press flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-medium",
        selected
          ? "border-white bg-white text-ink shadow-[0_2px_8px_rgba(15,23,42,0.08)]"
          : "border-white/80 bg-[#efeff0]/80 text-ink-2",
        className,
      )}
    >
      {icon}
      {children}
      {onRemove && (
        <span
          role="button"
          aria-label="Remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="-mr-1 ml-0.5 flex h-5 w-5 items-center justify-center rounded-full text-ink-3 hover:bg-black/5"
        >
          <X size={13} strokeWidth={2.4} />
        </span>
      )}
    </button>
  );
}

/* ---------------- Inputs ---------------- */

export function SearchField({
  value,
  onChange,
  placeholder = "Search topics...",
  autoFocus,
  onFocus,
  className = "",
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  onFocus?: () => void;
  className?: string;
  onSubmit?: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) setTimeout(() => ref.current?.focus(), 250);
  }, [autoFocus]);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        ref.current?.blur();
        onSubmit?.();
      }}
      className={cx(
        "flex h-11 items-center gap-2 rounded-[14px] border border-transparent bg-field px-3.5 transition-colors focus-within:border-brand/70 focus-within:bg-white",
        className,
      )}
    >
      <Search size={18} className="shrink-0 text-ink-2" strokeWidth={2} />
      <input
        ref={ref}
        value={value}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        enterKeyHint="search"
        className="min-w-0 flex-1 bg-transparent text-[16px] text-ink outline-none placeholder:text-[15px] placeholder:text-ink-3"
      />
      {value && (
        <button type="button" aria-label="Clear" onClick={() => onChange("")} className="text-ink-3">
          <X size={16} />
        </button>
      )}
    </form>
  );
}

export function SearchButton({ placeholder = "Search topics...", onClick }: { placeholder?: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="press flex h-11 w-full items-center gap-2 rounded-[14px] bg-field px-3.5 text-left text-[15px] text-ink-3"
    >
      <Search size={18} className="text-ink-2" strokeWidth={2} />
      {placeholder}
    </button>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  autoFocus?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-medium text-ink-2">{label}</span>
      <input
        type={type}
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-[14px] border border-line bg-white px-4 text-[16px] text-ink outline-none transition-colors placeholder:text-ink-3 focus:border-brand"
      />
    </label>
  );
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cx(
        "relative h-[30px] w-[50px] shrink-0 rounded-full transition-colors duration-200",
        on ? "bg-brand" : "bg-[#dcdde0]",
      )}
    >
      <span
        className={cx(
          "absolute left-0 top-[3px] h-6 w-6 rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.18)] transition-transform duration-200",
          on ? "translate-x-[23px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

export function Checkbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={cx(
        "flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] border transition-colors",
        checked ? "border-brand bg-brand text-white" : "border-[#cfd2d8] bg-white",
      )}
    >
      {checked && <Check size={13} strokeWidth={3} />}
    </span>
  );
}

export function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={cx(
        "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-colors",
        checked ? "border-brand bg-brand text-white" : "border-[#cfd2d8] bg-white",
      )}
    >
      {checked && <Check size={13} strokeWidth={3} />}
    </span>
  );
}

/* ---------------- People ---------------- */

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

export function Avatar({
  contact,
  name,
  color,
  size = 40,
  ring = false,
}: {
  contact?: Pick<Contact, "fullName" | "color">;
  name?: string;
  color?: string;
  size?: number;
  ring?: boolean;
}) {
  const label = contact?.fullName ?? name ?? "?";
  return (
    <span
      className={cx(
        "flex shrink-0 items-center justify-center rounded-full font-semibold text-ink-2",
        ring && "ring-2 ring-white",
      )}
      style={{
        width: size,
        height: size,
        background: contact?.color ?? color ?? "#E2E5EA",
        fontSize: Math.max(10, size * 0.36),
      }}
    >
      {initials(label)}
    </span>
  );
}

export function AvatarStack({ contacts, size = 22 }: { contacts: Pick<Contact, "fullName" | "color" | "id">[]; size?: number }) {
  return (
    <span className="flex items-center">
      {contacts.slice(0, 4).map((c, i) => (
        <span key={c.id} style={{ marginLeft: i ? -size * 0.32 : 0 }}>
          <Avatar contact={c} size={size} ring />
        </span>
      ))}
    </span>
  );
}

/* ---------------- Media ---------------- */

export function Img({
  src,
  alt,
  className = "",
  fallbackIcon: FallbackIcon = ImageOff,
  tint = "#e8dcf7",
}: {
  src?: string;
  alt: string;
  className?: string;
  fallbackIcon?: LucideIcon;
  tint?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return (
      <div
        className={cx("flex items-center justify-center text-ink-2/60", className)}
        style={{ background: `linear-gradient(135deg, ${tint}, #ffffff)` }}
        aria-label={alt}
      >
        <FallbackIcon size={22} strokeWidth={1.8} />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      draggable={false}
      onError={() => setFailed(true)}
      className={cx("object-cover", className)}
    />
  );
}

/* ---------------- Layout ---------------- */

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[16px] font-medium text-ink">{title}</h2>
      {action && (
        <button onClick={onAction} className="press text-[15px] font-medium text-brand">
          {action}
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
  onAction,
  compact,
}: {
  title: string;
  body: string;
  action?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={cx("flex flex-col items-center text-center animate-rise", compact ? "py-6" : "py-10")}>
      <div className="mb-5 flex h-[92px] w-[92px] items-center justify-center rounded-full border border-white bg-white/80 shadow-[0_6px_24px_rgba(15,23,42,0.06)]">
        <LogoMark size={52} />
      </div>
      <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-[280px] text-[14px] leading-[20px] text-ink-2">{body}</p>
      {action && (
        <div className="mt-6 w-full">
          <Button onClick={onAction}>{action}</Button>
        </div>
      )}
    </div>
  );
}

/* ---------------- Overlays ---------------- */

function useOverlayRoot() {
  const [root, setRoot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setRoot(document.getElementById("overlay-root"));
  }, []);
  return root;
}

export function Sheet({
  open,
  onClose,
  children,
  title,
  left,
  right,
  className = "",
  bodyClassName = "",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const root = useOverlayRoot();
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const t = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, 220);
    return () => clearTimeout(t);
  }, [open, mounted]);

  if (!mounted || !root) return null;

  return createPortal(
    <div className="pointer-events-auto absolute inset-0 z-50">
      <div
        onClick={onClose}
        className={cx(
          "absolute inset-0 bg-[#0f172a]/25 transition-opacity duration-200",
          closing ? "opacity-0" : "animate-fade",
        )}
      />
      <div
        role="dialog"
        className={cx(
          "sheet-bg absolute inset-x-0 bottom-0 flex max-h-[90%] flex-col rounded-t-[32px] shadow-[0_-12px_40px_rgba(15,23,42,0.12)]",
          closing ? "translate-y-full transition-transform duration-200 ease-in" : "animate-sheet",
          className,
        )}
      >
        <div className="mx-auto mt-2.5 h-[5px] w-10 shrink-0 rounded-full bg-[#0f172a]/12" />
        {(title || left || right) && (
          <div className="relative flex shrink-0 items-center justify-between px-4 pb-2 pt-3">
            <div className="z-10 min-w-[36px]">{left}</div>
            <div className="absolute inset-x-16 text-center text-[17px] font-medium text-ink">{title}</div>
            <div className="z-10 flex min-w-[36px] justify-end">{right}</div>
          </div>
        )}
        <div className={cx("no-scrollbar overflow-y-auto px-4 pb-[calc(var(--sab)+16px)]", bodyClassName)}>
          {children}
        </div>
      </div>
    </div>,
    root,
  );
}

export interface SheetAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  danger?: boolean;
}

export function ActionSheet({
  open,
  onClose,
  header,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  header?: ReactNode;
  actions: SheetAction[];
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="pt-4">
        {header && <div className="mb-3">{header}</div>}
        <div className="divide-y divide-[#0f172a]/[0.06]">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => {
                onClose();
                setTimeout(a.onClick, 120);
              }}
              className={cx(
                "press flex w-full items-center gap-3 py-3.5 text-left text-[16px] font-medium",
                a.danger ? "text-error" : "text-ink",
              )}
            >
              <a.icon size={20} strokeWidth={2} />
              {a.label}
            </button>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

export function ConfirmSheet({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  onConfirm,
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: string;
  confirmLabel: string;
  onConfirm: () => void;
  danger?: boolean;
}) {
  return (
    <Sheet open={open} onClose={onClose}>
      <div className="pt-5 text-center">
        <h3 className="text-[18px] font-semibold text-ink">{title}</h3>
        <p className="mx-auto mt-2 max-w-[300px] text-[14px] leading-[20px] text-ink-2">{body}</p>
        <div className="mt-6 space-y-2.5">
          <Button
            variant={danger ? "danger" : "primary"}
            onClick={() => {
              onClose();
              onConfirm();
            }}
          >
            {confirmLabel}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Sheet>
  );
}

export function Toaster() {
  const toasts = useToast((s) => s.toasts);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[calc(var(--sat)+8px)] z-[60] flex flex-col items-center gap-2 px-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="animate-rise flex max-w-full items-center gap-2 rounded-full bg-[#0f172a]/90 px-4 py-2.5 text-[14px] font-medium text-white shadow-lg backdrop-blur"
        >
          {t.tone === "success" && (
            <span className="flex h-[18px] w-[18px] items-center justify-center rounded-full bg-success">
              <Check size={12} strokeWidth={3} />
            </span>
          )}
          <span className="truncate">{t.text}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Long press ---------------- */

export function useLongPress(onLongPress: () => void, onClick?: () => void, ms = 480) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fired = useRef(false);
  const start = useRef<{ x: number; y: number } | null>(null);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  return {
    onPointerDown: (e: React.PointerEvent) => {
      fired.current = false;
      start.current = { x: e.clientX, y: e.clientY };
      clear();
      timer.current = setTimeout(() => {
        fired.current = true;
        if (navigator.vibrate) navigator.vibrate(12);
        onLongPress();
      }, ms);
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!start.current) return;
      if (Math.abs(e.clientX - start.current.x) > 8 || Math.abs(e.clientY - start.current.y) > 8) clear();
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onContextMenu: (e: React.MouseEvent) => {
      e.preventDefault();
      clear();
      if (!fired.current) {
        fired.current = true;
        onLongPress();
      }
    },
    onClick: () => {
      if (fired.current) {
        fired.current = false;
        return;
      }
      onClick?.();
    },
  };
}

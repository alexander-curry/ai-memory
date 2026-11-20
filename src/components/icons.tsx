"use client";

import { useId } from "react";
import {
  siInstagram,
  siFacebook,
  siTelegram,
  siWhatsapp,
  siMessenger,
  siApple,
  siTiktok,
  siGmail,
} from "simple-icons";
import {
  Globe,
  UtensilsCrossed,
  BriefcaseBusiness,
  ShoppingCart,
  House,
  PartyPopper,
  type LucideIcon,
} from "lucide-react";
import type { Category, ChannelId } from "@/lib/types";

export function LogoMark({ size = 48, className = "" }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      width={size}
      height={(size * 80) / 100}
      viewBox="0 0 100 80"
      fill="none"
      className={className}
      aria-label="AIMemory"
    >
      <defs>
        <linearGradient id={`lg-${id}`} x1="8" y1="40" x2="94" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6A3BF6" />
          <stop offset="0.5" stopColor="#2F6CF3" />
          <stop offset="1" stopColor="#17C3CB" />
        </linearGradient>
        <linearGradient id={`ln-${id}`} x1="64" y1="48" x2="94" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#2F6CF3" />
          <stop offset="1" stopColor="#17C3CB" />
        </linearGradient>
      </defs>
      <path
        d="M12 62 V30 Q12 13 27 15.5 Q35 17 42 30 L50 44 L58 30 Q65 17 73 15.5 Q88 13 88 30 V44"
        stroke={`url(#lg-${id})`}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g stroke={`url(#ln-${id})`} strokeWidth="2.6" strokeLinecap="round">
        <line x1="78" y1="57" x2="69" y2="67" />
        <line x1="78" y1="57" x2="90" y2="65" />
        <line x1="78" y1="57" x2="80" y2="46" />
      </g>
      <circle cx="78" cy="57" r="5.2" fill="#2F6CF3" />
      <circle cx="69" cy="67.5" r="3.8" fill="#2F6CF3" />
      <circle cx="90.5" cy="65.5" r="3.8" fill="#17C3CB" />
    </svg>
  );
}

const GooglePaths = () => (
  <>
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
  </>
);

export function BrandIcon({ id, size = 20, className = "" }: { id: ChannelId; size?: number; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const common = { width: size, height: size, className, "aria-hidden": true } as const;

  switch (id) {
    case "instagram":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <defs>
            <radialGradient id={`ig-${uid}`} cx="30%" cy="107%" r="150%">
              <stop offset="0" stopColor="#FDF497" />
              <stop offset="0.08" stopColor="#FDF497" />
              <stop offset="0.45" stopColor="#FD5949" />
              <stop offset="0.6" stopColor="#D6249F" />
              <stop offset="0.9" stopColor="#285AEB" />
            </radialGradient>
          </defs>
          <circle cx="12" cy="12" r="12" fill={`url(#ig-${uid})`} />
          <g transform="translate(5.4 5.4) scale(0.55)">
            <path d={siInstagram.path} fill="#fff" />
          </g>
        </svg>
      );
    case "facebook":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="#fff" />
          <path d={siFacebook.path} fill="#0866FF" />
        </svg>
      );
    case "telegram":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="11" fill="#fff" />
          <path d={siTelegram.path} fill="#26A5E4" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" fill="#fff" />
          <path d={siWhatsapp.path} fill="#25D366" />
        </svg>
      );
    case "messenger":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <defs>
            <linearGradient id={`ms-${uid}`} x1="0" y1="1" x2="1" y2="0">
              <stop offset="0" stopColor="#0099FF" />
              <stop offset="0.6" stopColor="#A033FF" />
              <stop offset="1" stopColor="#FF5C87" />
            </linearGradient>
          </defs>
          <path d={siMessenger.path} fill={`url(#ms-${uid})`} />
        </svg>
      );
    case "imessage":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d={siApple.path} fill="#000" />
        </svg>
      );
    case "tiktok":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="12" fill="#000" />
          <g transform="translate(6 6) scale(0.5)">
            <path d={siTiktok.path} fill="#fff" />
          </g>
        </svg>
      );
    case "gmail":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <path d={siGmail.path} fill="#EA4335" />
        </svg>
      );
    case "google":
      return (
        <svg {...common} viewBox="0 0 48 48">
          <GooglePaths />
        </svg>
      );
    case "yahoo":
      return (
        <svg {...common} viewBox="0 0 24 24">
          <rect width="24" height="24" rx="6" fill="#6001D2" />
          <text x="12" y="16.5" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff" fontFamily="Arial, sans-serif">
            Y!
          </text>
        </svg>
      );
  }
}

export const CATEGORY_META: Record<Category, { icon: LucideIcon; color: string; label: string }> = {
  travel: { icon: Globe, color: "#2563EB", label: "Travel" },
  food: { icon: UtensilsCrossed, color: "#16A34A", label: "Food" },
  work: { icon: BriefcaseBusiness, color: "#9333EA", label: "Work" },
  shopping: { icon: ShoppingCart, color: "#EA580C", label: "Shopping" },
  home: { icon: House, color: "#0891B2", label: "Home" },
  events: { icon: PartyPopper, color: "#DB2777", label: "Events" },
};

export function CategoryIcon({ category, size = 14, colored = false }: { category: Category; size?: number; colored?: boolean }) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return <Icon size={size} strokeWidth={2.2} color={colored ? meta.color : "currentColor"} />;
}

export function CategoryBadges({ categories, max = 3 }: { categories: Category[]; max?: number }) {
  if (!categories.length) return null;
  return (
    <div className="flex items-center rounded-full bg-white px-1 py-1 shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
      {categories.slice(0, max).map((c) => (
        <span key={c} className="flex h-[18px] w-[18px] items-center justify-center" title={CATEGORY_META[c].label}>
          <CategoryIcon category={c} size={12} colored />
        </span>
      ))}
    </div>
  );
}

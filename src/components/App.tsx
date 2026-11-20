"use client";

import { useEffect, useState, type ComponentType } from "react";
import { House, Users, Settings as SettingsIcon, MessageCircleMore, Signal, Wifi, BatteryFull } from "lucide-react";
import { useApp, useNav, type Route, type RouteName } from "@/lib/store";
import { Toaster, cx } from "./ui";
import { Welcome, ObAI, ObPrivacy, ObConnect, ObMain, ObBuilding, SignIn } from "./screens/Onboarding";
import { Home } from "./screens/Home";
import { Collections } from "./screens/Collections";
import { CollectionDetail } from "./screens/CollectionDetail";
import { Contacts } from "./screens/Contacts";
import { ContactDetail } from "./screens/ContactDetail";
import { SearchScreen } from "./screens/Search";
import { Settings } from "./screens/Settings";
import { Thera } from "./screens/Thera";

export interface ScreenProps {
  route: Route;
  active: boolean;
}

const SCREENS: Record<RouteName, ComponentType<ScreenProps>> = {
  welcome: Welcome,
  "ob-ai": ObAI,
  "ob-privacy": ObPrivacy,
  "ob-connect": ObConnect,
  "ob-main": ObMain,
  "ob-building": ObBuilding,
  signin: SignIn,
  home: Home,
  contacts: Contacts,
  settings: Settings,
  collections: Collections,
  collection: CollectionDetail,
  contact: ContactDetail,
  search: SearchScreen,
  thera: Thera,
};

const TAB_ROUTES: RouteName[] = ["home", "contacts", "settings", "collections", "contact"];

export default function App() {
  const stage = useApp((s) => s.stage);
  const stack = useNav((s) => s.stack);
  const direction = useNav((s) => s.direction);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const start = () => {
      useNav.getState().reset(useApp.getState().stage === "app" ? "home" : "welcome");
      setReady(true);
    };
    if (useApp.persist.hasHydrated()) start();
    else return useApp.persist.onFinishHydration(start);
  }, []);

  useEffect(() => {
    const onPop = () => useNav.getState().popFromHistory();
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const top = stack[stack.length - 1];
  const showTabs = ready && stage === "app" && TAB_ROUTES.includes(top.name);

  return (
    <div className="flex min-h-dvh w-full items-center justify-center sm:py-6">
      <div className="hidden sm:fixed sm:left-8 sm:top-8 sm:block">
        <DesktopCaption />
      </div>
      <div className="phone relative h-dvh w-full overflow-hidden bg-app sm:h-[852px] sm:max-h-[calc(100dvh-48px)] sm:w-[393px] sm:rounded-[56px] sm:shadow-[0_0_0_11px_#1b1b1f,0_0_0_13px_#3a3a40,0_40px_80px_rgba(0,0,0,0.55)]">
        {ready &&
          stack.map((route, i) => {
            const isTop = i === stack.length - 1;
            const Screen = SCREENS[route.name];
            return (
              <div
                key={route.key}
                aria-hidden={!isTop}
                className={cx(
                  "absolute inset-0",
                  isTop ? "z-10" : "invisible z-0",
                  isTop && direction === "push" && i > 0 && "animate-push",
                  isTop && direction === "pop" && "animate-pop",
                )}
              >
                <Screen route={route} active={isTop} />
              </div>
            );
          })}

        {showTabs && <TabBar current={stack[0].name} />}

        <StatusBar />
        <div className="pointer-events-none absolute bottom-2 left-1/2 z-[70] hidden h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-[#0f172a] sm:block" />
        <Toaster />
        <div id="overlay-root" className="pointer-events-none absolute inset-0 z-50" />
      </div>
    </div>
  );
}

function StatusBar() {
  const [time, setTime] = useState(() => fmt(new Date()));
  useEffect(() => {
    const t = setInterval(() => setTime(fmt(new Date())), 15000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[65] hidden h-[50px] items-center justify-between px-9 pt-1 text-[15px] font-semibold text-ink sm:flex">
      <span>{time}</span>
      <span className="flex items-center gap-1.5">
        <Signal size={16} strokeWidth={2.6} />
        <Wifi size={16} strokeWidth={2.6} />
        <BatteryFull size={22} strokeWidth={1.8} />
      </span>
    </div>
  );
}

const fmt = (d: Date) => d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

function TabBar({ current }: { current: RouteName }) {
  const reset = useNav((s) => s.reset);
  const push = useNav((s) => s.push);
  const tabs: { name: RouteName; label: string; icon: typeof House }[] = [
    { name: "home", label: "Home", icon: House },
    { name: "contacts", label: "Contacts", icon: Users },
    { name: "settings", label: "Settings", icon: SettingsIcon },
  ];
  const active = tabs.some((t) => t.name === current) ? current : "home";
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 h-[120px] bg-gradient-to-t from-app via-app/80 to-transparent">
      <div className="pointer-events-auto absolute inset-x-4 bottom-[calc(var(--sab)+4px)] flex items-center gap-3">
        <nav className="glass flex h-[60px] flex-1 items-center justify-between rounded-full border border-white px-1.5 shadow-[0_8px_30px_rgba(15,23,42,0.10)]">
          {tabs.map((t) => {
            const on = active === t.name;
            return (
              <button
                key={t.name}
                onClick={() => (on ? reset(t.name) : reset(t.name))}
                className={cx(
                  "press flex h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full text-[11px] font-medium transition-colors",
                  on ? "bg-[#ececee] text-brand" : "text-ink",
                )}
              >
                <t.icon size={21} strokeWidth={on ? 2.4 : 2.1} fill={on ? "currentColor" : "none"} fillOpacity={on ? 0.15 : 0} />
                {t.label}
              </button>
            );
          })}
        </nav>
        <button
          aria-label="Ask Thera"
          onClick={() => push("thera")}
          className="press glass flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full border border-white text-ink shadow-[0_8px_30px_rgba(15,23,42,0.10)]"
        >
          <MessageCircleMore size={24} strokeWidth={2.1} />
        </button>
      </div>
    </div>
  );
}

function DesktopCaption() {
  const resetAll = useApp((s) => s.resetAll);
  const reset = useNav((s) => s.reset);
  return (
    <div className="max-w-[240px] text-white/80">
      <div className="text-[15px] font-semibold text-white">AIMemory</div>
      <div className="mt-1 text-[13px] leading-5 text-white/60">
        Interactive demo. Your changes are saved in this browser.
      </div>
      <button
        onClick={() => {
          resetAll();
          reset("welcome");
        }}
        className="mt-3 rounded-full border border-white/20 px-3 py-1.5 text-[12px] font-medium text-white/80 hover:bg-white/10"
      >
        Restart demo
      </button>
    </div>
  );
}

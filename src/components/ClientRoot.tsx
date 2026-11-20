"use client";

import dynamic from "next/dynamic";

const App = dynamic(() => import("./App"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh items-center justify-center bg-[#0d0d10]">
      <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white spin-slow" />
    </div>
  ),
});

export default function ClientRoot() {
  return <App />;
}

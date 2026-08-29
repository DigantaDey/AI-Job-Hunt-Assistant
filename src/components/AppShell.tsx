"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Dashboard", icon: "M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" },
  { href: "/applications", label: "Applications", icon: "M4 6h16v2H4zm0 5h16v2H4zm0 5h10v2H4z" },
  { href: "/jobs", label: "Jobs", icon: "M12 2a5 5 0 015 5c0 2.5-1.5 4-3 5.5V14h2v2h-2v4h-4v-4H8v-2h2v-1.5C8.5 11 7 9.5 7 7a5 5 0 015-5z" },
  { href: "/cvs", label: "CV Library", icon: "M6 2h9l4 4v16H6V2zm8 3v4h4l-4-4zM8 12h8v2H8zm0 4h8v2H8z" },
  { href: "/answers", label: "Answer Memory", icon: "M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1.7-4-2.3V7z" },
  { href: "/credentials", label: "Credentials", icon: "M5 11V8a7 7 0 0114 0v3h1a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2v-8a2 2 0 012-2h1zm2 0h10V8a5 5 0 00-10 0v3zm5 5a1.5 1.5 0 00-1 2.6V20h2v-1.4a1.5 1.5 0 00-1-2.6z" },
  { href: "/settings", label: "Settings & AI", icon: "M19 14.6v-1.2l-1.6-1a6 6 0 000-2l1.6-1V7.2l-2.6-1a6 6 0 00-1-1l-.2-2.2h-3l-.8 2a6 6 0 00-2 0l-.8-2H6.2l-.2 2.2a6 6 0 00-1 1l-2.6 1v1.2l1.6 1a6 6 0 000 2l-1.6 1v1.2l2.6 1a6 6 0 001 1l.2 2.2h3l.8-2a6 6 0 002 0l.8 2h3l.2-2.2a6 6 0 001-1l2.6-1zM12 15a3 3 0 110-6 3 3 0 010 6z" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [provider, setProvider] = useState("mock");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => setProvider(d?.provider || "mock"))
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-200 bg-white sticky top-0 h-screen">
        <div className="px-6 py-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-lg font-bold">
              ⌕
            </div>
            <div>
              <p className="font-bold text-ink-900 leading-tight">Job Hunt</p>
              <p className="text-[11px] text-slate-400 leading-tight">AI Assistant</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-6 py-5 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="inline-flex h-2 w-2 rounded-full bg-mint" />
            AI provider:{" "}
            <span className="font-semibold text-slate-600 uppercase">{provider}</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-300">Local-first · data stays on device</p>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <MobileHeader />
        <div className="px-4 md:px-8 py-6 md:py-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}

function MobileHeader() {
  return (
    <div className="md:hidden sticky top-0 z-20 flex items-center justify-between bg-white border-b border-slate-200 px-4 py-3">
      <Link href="/" className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white font-bold">
          ⌕
        </div>
        <span className="font-bold">Job Hunt Assistant</span>
      </Link>
    </div>
  );
}

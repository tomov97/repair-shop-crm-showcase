"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { signOutAction } from "@/app/actions/auth";
import logo from "../../../../../logo.png";
import { SearchBar } from "@/components/dashboard/search-bar";

type NavigationItem = {
  href: string;
  label: string;
};

export function AppShellClient({
  activePath,
  userEmail,
  children,
  navigationItems,
  printAttentionCount,
}: {
  activePath: string;
  userEmail: string | null | undefined;
  children: React.ReactNode;
  navigationItems: NavigationItem[];
  printAttentionCount: number;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const isNewIntakeActive = activePath === "/new-intake";

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,_rgba(35,68,63,0.10),_transparent_35%),linear-gradient(180deg,_#f8f6eb_0%,_#f4f1e5_100%)]">
      {/* Mobile header */}
      <div className="bg-surface-strong px-4 py-3 lg:hidden">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between gap-3">
          <Image src={logo} alt="Кафемашини" className="h-8 w-auto object-contain" style={{ filter: "brightness(0) invert(1)" }} priority />

          <button
            type="button"
            onClick={() => { setMobileSearchOpen(true); setMobileMenuOpen(false); }}
            className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 text-white transition active:scale-90 active:opacity-70"
            aria-label="Търсене"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((current) => !current)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 text-white transition active:scale-90 active:opacity-70"
            aria-label="Меню"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Dropdown menu */}
        {mobileMenuOpen ? (
          <div className="mx-auto mt-3 max-w-[1100px] border-t border-white/15 pt-3 pb-1">
            <nav className="grid gap-1">
              {navigationItems.map((item) => {
                const isActive = item.href === activePath;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`rounded-xl px-3 py-2.5 text-sm font-semibold transition active:opacity-70 ${
                      isActive ? "bg-white/15 text-white" : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                    style={{ color: isActive ? "#ffffff" : "rgba(255,255,255,0.75)" }}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-3 border-t border-white/15 pt-3 pb-1 space-y-2">
              <p className="truncate text-xs text-white/50">{userEmail ?? "Няма сесия"}</p>
              <form action={signOutAction}>
                <button type="submit" className="text-sm font-semibold text-[#f28c84] transition hover:text-white">
                  Изход
                </button>
              </form>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mx-auto max-w-[1100px] px-4 py-4 sm:px-6 sm:py-6 lg:flex lg:min-h-screen lg:gap-6 lg:px-6 lg:py-6">
        <aside
          className="hidden lg:sticky lg:top-6 lg:flex lg:h-[calc(100vh-3rem)] lg:w-[260px] lg:shrink-0 lg:flex-col rounded-[2rem] bg-surface-strong px-5 py-6 text-white shadow-[0_24px_80px_rgba(35,68,63,0.18)]"
        >
          <div className="px-4">
            <Image src={logo} alt="Кафемашини" className="w-full object-contain" style={{ filter: "brightness(0) invert(1)" }} priority />
          </div>

          <nav className="mt-8 grid gap-2">
            {navigationItems.map((item) => {
              const isActive = item.href === activePath;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-[1.6rem] px-4 py-3 transition ${
                    isActive
                      ? "bg-[#eef4f0] text-surface-strong shadow-[0_12px_30px_rgba(8,18,16,0.16)]"
                      : "text-white hover:bg-white/8"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className={`text-sm font-semibold ${isActive ? "text-surface-strong" : "text-white"}`}>
                      {item.label}
                    </p>

                    {item.href === "/print" && printAttentionCount > 0 ? (
                      <span
                        className={`inline-flex min-h-6 min-w-6 items-center justify-center rounded-full px-2 py-1 text-[11px] font-semibold ${
                          isActive ? "bg-surface-strong/10 text-surface-strong" : "bg-white/12 text-white"
                        }`}
                      >
                        {printAttentionCount}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-6">
            <SearchBar variant="sidebar" />
          </div>

          <div className="mt-auto pt-6 space-y-3">
            <p className="truncate text-center text-sm text-white/60">{userEmail ?? "Няма сесия"}</p>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-[#d78c83] bg-[#b24f42] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#9f4338]"
              >
                Изход
              </button>
            </form>
          </div>
        </aside>

        <section className="min-w-0 flex-1 pb-24 lg:py-0"><div className="mx-auto max-w-[680px]">{children}</div></section>
      </div>

      <Link
        href="/new-intake"
        aria-label="Нов прием"
        className={`fixed right-4 bottom-4 z-20 inline-flex h-16 w-16 items-center justify-center rounded-full text-4xl leading-none text-white shadow-[0_8px_24px_rgba(35,68,63,0.35)] transition hover:scale-[1.03] active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#23443f] sm:right-6 sm:bottom-6 lg:right-8 lg:bottom-8 ${
          isNewIntakeActive ? "bg-[#1a3530]" : "bg-[#23443f]"
        }`}
      >
        <span style={{ color: "#ffffff" }}>+</span>
      </Link>

      {mobileSearchOpen ? (
        <SearchBar variant="overlay" isOpen={mobileSearchOpen} onClose={() => setMobileSearchOpen(false)} />
      ) : null}
    </main>
  );
}

"use client";

import { useState, useRef } from "react";
import PlatformCard from "@/components/PlatformCard";
import { platforms, type CheckStatus } from "@/lib/platforms";

type Results = Record<string, CheckStatus>;

export default function Home() {
  const [query, setQuery] = useState("");
  const [searchedQuery, setSearchedQuery] = useState("");
  const [results, setResults] = useState<Results>({});
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasResults = searchedQuery.length > 0;

  const available = Object.values(results).filter((s) => s === "available").length;
  const taken = Object.values(results).filter((s) => s === "taken").length;
  const checking = Object.values(results).filter((s) => s === "checking").length;

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || isSearching) return;

    setIsSearching(true);
    setSearchedQuery(trimmed);

    // Set all cards to checking state immediately
    const initial: Results = {};
    platforms.forEach((p) => (initial[p.id] = "checking"));
    setResults(initial);

    // Fire all platform checks in parallel — cards update as each result arrives
    await Promise.all(
      platforms.map(async (platform) => {
        try {
          const res = await fetch(
            `/api/check?username=${encodeURIComponent(trimmed)}&platform=${platform.id}`
          );
          const data = await res.json();
          setResults((prev) => ({ ...prev, [platform.id]: data.status as CheckStatus }));
        } catch {
          setResults((prev) => ({ ...prev, [platform.id]: "unknown" }));
        }
      })
    );

    setIsSearching(false);
  };

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Subtle radial glow at top */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[500px] opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 60% 300px at 50% -80px, rgba(120,80,255,0.25), transparent)",
        }}
      />

      {/* Nav */}
      <header className="relative z-10 border-b border-white/[0.06] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="w-3.5 h-3.5 text-white/70"
              >
                <circle cx="11" cy="11" r="8" />
                <path strokeLinecap="round" d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight">social handle check</span>
          </div>
          <span className="text-xs text-white/25 hidden sm:block">
            9 platforms · instant results
          </span>
        </div>
      </header>

      {/* Hero + Search */}
      <div className="relative z-10 max-w-2xl mx-auto px-6 pt-20 pb-14 text-center">
        <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-xs text-white/40 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          find your social handle seamlessly
        </div>

        <h1 className="text-4xl md:text-[52px] font-bold tracking-[-0.03em] leading-tight mb-4">
          Is your handle{" "}
          <span className="bg-gradient-to-r from-white/40 to-white/20 bg-clip-text text-transparent">
            available?
          </span>
        </h1>

        <p className="text-white/40 text-base md:text-lg mb-10 leading-relaxed">
          Search once. We check 9 major platforms simultaneously.
        </p>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          className="flex gap-2 max-w-md mx-auto"
        >
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 text-sm font-medium select-none">
              @
            </span>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value.replace(/\s/g, ""))}
              placeholder="yourusername"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="w-full bg-white/[0.06] border border-white/[0.1] rounded-xl pl-9 pr-4 py-3.5 text-white placeholder-white/20 text-sm transition-all duration-200 focus:bg-white/[0.08] focus:border-white/20 focus:ring-1 focus:ring-white/10"
            />
          </div>
          <button
            type="submit"
            disabled={!query.trim() || isSearching}
            className="bg-white text-black text-sm font-semibold px-5 py-3.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/90 active:scale-[0.98] transition-all duration-150 shrink-0"
          >
            {isSearching ? "Checking…" : "Check"}
          </button>
        </form>
      </div>

      {/* Results */}
      {hasResults && (
        <div className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
          {/* Summary bar */}
          <div className="flex items-center justify-center gap-6 mb-8 text-sm">
            <span className="flex items-center gap-2 text-white/40">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span>
                <span className="text-white font-medium">{available}</span> available
              </span>
            </span>
            <span className="flex items-center gap-2 text-white/40">
              <span className="w-2 h-2 rounded-full bg-red-400" />
              <span>
                <span className="text-white font-medium">{taken}</span> taken
              </span>
            </span>
            {checking > 0 && (
              <span className="flex items-center gap-2 text-white/30 text-xs">
                <svg
                  className="w-3 h-3 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path strokeLinecap="round" d="M12 3a9 9 0 0 1 9 9" />
                  <path strokeLinecap="round" d="M12 3a9 9 0 1 0 9 9" className="opacity-20" />
                </svg>
                {checking} checking
              </span>
            )}
          </div>

          {/* Platform grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {platforms.map((platform, i) => (
              <PlatformCard
                key={platform.id}
                platform={platform}
                status={results[platform.id] ?? "idle"}
                username={searchedQuery}
                index={i}
              />
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-center text-white/20 text-xs mt-8 leading-relaxed">
            Results may vary due to platform bot detection. GitHub and Reddit
            use official APIs and are most reliable.
          </p>
        </div>
      )}

      {/* Platform preview (shown before search) */}
      {!hasResults && (
        <div className="relative z-10 max-w-3xl mx-auto px-6 pb-24">
          <div className="flex flex-wrap justify-center gap-3">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.07] rounded-xl px-3.5 py-2.5 text-white/40 text-xs font-medium"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: platform.color, opacity: 0.7 }}
                >
                  <path d={platform.svgPath} />
                </svg>
                {platform.name}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { ExternalLink } from "lucide-react";
import type { Platform, CheckStatus } from "@/lib/platforms";

interface Props {
  platform: Platform;
  status: CheckStatus;
  username: string;
  index: number;
}

export default function PlatformCard({ platform, status, username, index }: Props) {
  const profileUrl = platform.profileUrl(username);
  const displayUrl = profileUrl.replace("https://", "");

  const cardStyle =
    status === "available"
      ? "border-green-500/25 bg-green-500/[0.06]"
      : status === "taken"
      ? "border-red-500/20 bg-red-500/[0.05]"
      : "border-white/[0.07] bg-white/[0.03]";

  const animationDelay = `${index * 40}ms`;

  return (
    <div
      data-testid={`card-${platform.id}`}
      className={`rounded-2xl border p-5 transition-all duration-300 animate-fade-slide-up ${cardStyle}`}
      style={{ animationDelay, animationFillMode: "both", opacity: 0 }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 flex items-center justify-center shrink-0"
            style={{ color: platform.color }}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d={platform.svgPath} />
            </svg>
          </div>
          <span className="font-medium text-sm text-white/90">{platform.name}</span>
        </div>

        {/* Status badge */}
        {status === "idle" && (
          <span className="text-xs text-white/20 font-medium">—</span>
        )}
        {status === "checking" && (
          <span className="flex items-center gap-1.5 text-xs text-white/40">
            <svg
              className="w-3.5 h-3.5 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path
                strokeLinecap="round"
                d="M12 3a9 9 0 1 0 9 9"
                className="opacity-20"
              />
              <path strokeLinecap="round" d="M12 3a9 9 0 0 1 9 9" />
            </svg>
            Checking
          </span>
        )}
        {status === "available" && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-green-400 bg-green-400/10 px-2.5 py-1 rounded-full">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="w-3 h-3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Available
          </span>
        )}
        {status === "taken" && (
          <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400 bg-red-400/10 px-2.5 py-1 rounded-full">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="w-3 h-3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Taken
          </span>
        )}
        {status === "unknown" && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-white/40 bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
          >
            Verify
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>

      {/* Profile URL link */}
      <a
        href={profileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 group w-fit max-w-full"
      >
        <span className="text-xs text-white/25 group-hover:text-white/50 transition-colors truncate">
          {displayUrl}
        </span>
        <ExternalLink className="w-3 h-3 text-white/0 group-hover:text-white/40 transition-all shrink-0" />
      </a>
    </div>
  );
}

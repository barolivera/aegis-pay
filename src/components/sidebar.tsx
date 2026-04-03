"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAccount, useConnect } from "wagmi";
import { injected } from "wagmi/connectors";
import {
  LayoutDashboard,
  Bot,
  Shield,
  Zap,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

function shortAddress(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/agents", label: "Agents", icon: Bot },
  { href: "/policy", label: "Policy", icon: Shield },
  { href: "/simulate", label: "Simulate", icon: Zap },
  { href: "/history", label: "History", icon: Clock },
];

function RadarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#2563EB" strokeWidth="1.5" opacity="0.3" />
      <circle cx="12" cy="12" r="6" stroke="#2563EB" strokeWidth="1.5" opacity="0.5" />
      <circle cx="12" cy="12" r="2" fill="#2563EB" />
      <line x1="12" y1="12" x2="12" y2="2" stroke="#2563EB" strokeWidth="1.5" opacity="0.7" />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { address, isConnected } = useAccount();
  const { connect } = useConnect();

  return (
    <aside
      className="fixed top-0 left-0 h-dvh w-[240px] flex flex-col z-40"
      style={{ backgroundColor: "#0a0a0a", borderRight: "1px solid #1a1a1a" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 pt-6 pb-8">
        <RadarIcon className="w-5 h-5 shrink-0" />
        <span className="text-sm font-semibold tracking-tight" style={{ color: "#f0f0f0" }}>
          AegisPay
        </span>
      </div>

      {/* Section label */}
      <div className="px-5 mb-2">
        <span
          className="font-mono tracking-[0.1em]"
          style={{ fontSize: "10px", color: "#444" }}
        >
          PLATFORM
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-0.5 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] transition-colors",
                active
                  ? "text-white"
                  : "text-[#555] hover:text-[#888]",
              )}
              style={
                active
                  ? {
                      backgroundColor: "#141414",
                      borderLeft: "2px solid #2563EB",
                    }
                  : { borderLeft: "2px solid transparent" }
              }
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Wallet — bottom */}
      <div className="px-4 pb-5 pt-4" style={{ borderTop: "1px solid #1a1a1a" }}>
        {isConnected && address ? (
          <div className="flex items-center gap-2 px-1 font-mono text-[12px]" style={{ color: "#888" }}>
            <span className="block h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
            {shortAddress(address)}
          </div>
        ) : (
          <button
            onClick={() => {
              try {
                connect({ connector: injected() });
              } catch {
                /* no wallet — do nothing */
              }
            }}
            className="group relative inline-flex w-full rounded-md transition-shadow hover:shadow-[0_0_20px_rgba(37,99,235,0.25)]"
          >
            <span
              className="absolute inset-0 rounded-md opacity-80 group-hover:opacity-100 transition-opacity"
              style={{
                background: "linear-gradient(135deg, #2563EB, #7C3AED)",
                padding: "1.5px",
              }}
            >
              <span
                className="block h-full w-full rounded-[5px]"
                style={{ backgroundColor: "#0a0a0a" }}
              />
            </span>
            <span className="relative z-10 inline-flex h-9 w-full items-center justify-center text-xs font-medium text-white">
              Connect Wallet
            </span>
          </button>
        )}
      </div>
    </aside>
  );
}

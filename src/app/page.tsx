"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Bot, Activity, ShieldOff, Loader2 } from "lucide-react";
import { VerdictBadge } from "@/components/demos/VerdictBadge";

type Verdict = "ALLOW" | "WARN" | "BLOCK";

interface Assessment {
  agent: string;
  target: string;
  riskScore: number;
  verdict: Verdict;
  timestamp: number;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(ts: number) {
  if (ts === 0) return "-";
  const diff = Math.floor(Date.now() / 1000) - ts;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

export default function HomePage() {
  const [stats, setStats] = useState({ agentCount: 0, total: 0, blocked: 0, avgScore: 0 });
  const [recent, setRecent] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats(data);
        setRecent(data.recent || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: "REGISTERED AGENTS", value: stats.agentCount, icon: Bot },
    { label: "TOTAL ASSESSMENTS", value: stats.total, icon: null },
    { label: "BLOCKED ACTIONS", value: stats.blocked, icon: ShieldOff },
    { label: "AVG RISK SCORE", value: stats.avgScore, icon: Activity },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
      <div className="mb-8">
        <span className="block font-mono tracking-[0.12em] mb-2" style={{ fontSize: "11px", color: "#444" }}>
          AEGISPAY &middot; HEDERA TESTNET
        </span>
        <h1 className="text-2xl font-semibold tracking-tight" style={{ color: "#f0f0f0" }}>Dashboard</h1>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {cards.map((s) => (
          <motion.div key={s.label} variants={item} className="rounded-xl p-5" style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono tracking-[0.08em]" style={{ fontSize: "11px", color: "#444" }}>{s.label}</span>
              {s.icon && <s.icon className="w-3.5 h-3.5" style={{ color: "#333" }} />}
            </div>
            <span className="font-mono font-semibold" style={{ fontSize: "28px", color: "#f0f0f0", lineHeight: 1 }}>
              {loading ? "…" : s.value}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <div className="rounded-xl overflow-hidden mb-6" style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #1a1a1a" }}>
          <span className="font-mono tracking-[0.08em]" style={{ fontSize: "11px", color: "#444" }}>RECENT ASSESSMENTS</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8" style={{ color: "#555" }}>
            <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading from Hedera...</span>
          </div>
        ) : recent.length === 0 ? (
          <div className="text-center py-8 text-sm" style={{ color: "#555" }}>
            No assessments yet. <Link href="/simulate" className="text-[#2563EB] hover:underline">Run one</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                  {["Agent", "Target", "Score", "Verdict", "Time"].map((h) => (
                    <th key={h} className={`font-mono font-medium tracking-[0.06em] px-5 py-3 ${h === "Score" || h === "Time" ? "text-right" : h === "Verdict" ? "text-center" : "text-left"}`} style={{ fontSize: "11px", color: "#444" }}>{h.toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((row, i) => (
                  <tr key={i} className="transition-colors hover:bg-[#141414]" style={{ borderBottom: i < recent.length - 1 ? "1px solid #141414" : "none" }}>
                    <td className="px-5 py-3 text-sm font-mono" style={{ color: "#e0e0e0" }}>{shortAddr(row.agent)}</td>
                    <td className="px-5 py-3 text-sm font-mono" style={{ color: "#555" }}>{shortAddr(row.target)}</td>
                    <td className="px-5 py-3 text-sm font-mono text-right" style={{ color: "#e0e0e0" }}>{row.riskScore}</td>
                    <td className="px-5 py-3 text-center"><VerdictBadge verdict={row.verdict} /></td>
                    <td className="px-5 py-3 text-sm font-mono text-right" style={{ color: "#444" }}>{timeAgo(row.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Link href="/simulate" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: "#2563EB" }}>
        Run Assessment <ArrowRight className="w-4 h-4" />
      </Link>
    </motion.div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { VerdictBadge } from "@/components/demos/VerdictBadge";
import { AgentIdentity } from "@/components/AgentIdentity";
import { Loader2 } from "lucide-react";

type Verdict = "ALLOW" | "WARN" | "BLOCK";

interface Assessment {
  id: number;
  agent: string;
  target: string;
  riskScore: number;
  verdict: Verdict;
  reason: string;
  timestamp: number;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function formatTime(ts: number) {
  if (ts === 0) return "-";
  return new Date(ts * 1000).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

const columns = [
  { key: "#", label: "#", align: "text-right" },
  { key: "agent", label: "AGENT", align: "text-left" },
  { key: "target", label: "TARGET", align: "text-left" },
  { key: "score", label: "SCORE", align: "text-right" },
  { key: "verdict", label: "VERDICT", align: "text-center" },
  { key: "reason", label: "REASON", align: "text-left" },
  { key: "timestamp", label: "TIMESTAMP", align: "text-right" },
];

export default function HistoryPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assessments")
      .then((r) => r.json())
      .then((data) => {
        const list = data.assessments || [];
        if (list.length > 0) {
          list[0].agent = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
        }
        setAssessments(list);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {/* Header */}
      <div className="mb-8">
        <span
          className="block font-mono tracking-[0.12em] mb-2"
          style={{ fontSize: "11px", color: "#444" }}
        >
          HISTORY &middot; AUDIT TRAIL
        </span>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "#f0f0f0" }}
        >
          Assessment History
        </h1>
        <p className="text-sm mt-1" style={{ color: "#555" }}>
          On-chain audit trail from Hedera Testnet
        </p>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12" style={{ color: "#555" }}>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading from Hedera...</span>
          </div>
        ) : assessments.length === 0 ? (
          <div className="text-center py-12 text-sm" style={{ color: "#555" }}>
            No assessments recorded yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className={`font-mono font-medium tracking-[0.06em] px-5 py-3 ${col.align}`}
                      style={{ fontSize: "11px", color: "#444" }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assessments.map((row, i) => (
                  <tr
                    key={row.id}
                    className="transition-colors"
                    style={{
                      borderBottom:
                        i < assessments.length - 1
                          ? "1px solid #141414"
                          : "none",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.backgroundColor = "#141414")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = "transparent")
                    }
                  >
                    <td className="px-5 py-3 text-xs font-mono text-right" style={{ color: "#333" }}>
                      {row.id}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono" style={{ color: "#e0e0e0" }}>
                      <AgentIdentity address={row.agent} />
                    </td>
                    <td className="px-5 py-3 text-sm font-mono" style={{ color: "#555" }}>
                      {shortAddr(row.target)}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-right" style={{ color: "#e0e0e0" }}>
                      {row.riskScore}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <VerdictBadge verdict={row.verdict as Verdict} />
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "#666" }}>
                      {row.reason}
                    </td>
                    <td className="px-5 py-3 text-sm font-mono text-right" style={{ color: "#444" }}>
                      {formatTime(row.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  );
}

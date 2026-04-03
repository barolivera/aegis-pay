"use client";

import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/demos/PageWrapper";
import { VerdictBadge } from "@/components/demos/VerdictBadge";
import { Shield, Loader2 } from "lucide-react";

type Verdict = "ALLOW" | "WARN" | "BLOCK";

interface Assessment {
  id: number;
  agent: string;
  target: string;
  riskScore: number;
  verdict: Verdict;
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

export default function HistoryPage() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assessments")
      .then((r) => r.json())
      .then((data) => {
        setAssessments(data.assessments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: "#141414", border: "1px solid #1a1a1a" }}>
            <Shield className="w-4 h-4" style={{ color: "#2563EB" }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#f0f0f0" }}>Assessment History</h1>
            <p className="text-sm" style={{ color: "#555" }}>On-chain audit trail from Hedera Testnet</p>
          </div>
        </div>

        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}>
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-12" style={{ color: "#555" }}>
              <Loader2 className="w-4 h-4 animate-spin" /><span className="text-sm">Loading from Hedera...</span>
            </div>
          ) : assessments.length === 0 ? (
            <div className="text-center py-12 text-sm" style={{ color: "#555" }}>No assessments recorded yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                    {["#", "Agent", "Target", "Score", "Verdict", "Time"].map((h) => (
                      <th key={h} className={`font-mono font-medium tracking-[0.06em] px-4 py-3 ${h === "Score" || h === "#" ? "text-right" : h === "Verdict" ? "text-center" : h === "Time" ? "text-right" : "text-left"}`} style={{ fontSize: "11px", color: "#444" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((row, i) => (
                    <tr key={row.id} className="transition-colors hover:bg-[#141414]" style={{ borderBottom: i < assessments.length - 1 ? "1px solid #141414" : "none" }}>
                      <td className="px-4 py-3 text-xs font-mono text-right" style={{ color: "#333" }}>{row.id}</td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "#e0e0e0" }}>{shortAddr(row.agent)}</td>
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "#555" }}>{shortAddr(row.target)}</td>
                      <td className="px-4 py-3 text-sm font-mono text-right" style={{ color: "#e0e0e0" }}>{row.riskScore}</td>
                      <td className="px-4 py-3 text-center"><VerdictBadge verdict={row.verdict} /></td>
                      <td className="px-4 py-3 text-sm font-mono text-right" style={{ color: "#444" }}>{formatTime(row.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

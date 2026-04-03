"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageWrapper } from "@/components/demos/PageWrapper";
import { VerdictBadge } from "@/components/demos/VerdictBadge";
import {
  Activity,
  ArrowRight,
  ShieldAlert,
  ShieldOff,
  Check,
  X,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ADDRESSES, assessmentRegistryAbi } from "@/lib/contracts";

type Verdict = "ALLOW" | "WARN" | "BLOCK";

interface SimResult {
  score: number;
  verdict: Verdict;
  reasons: string[];
}

const RISKY_PATTERNS = ["dead", "0000000000000000000000000000000000000000"];
const ACTION_RISK: Record<string, number> = {
  transfer: 0, swap: 10, "contract-call": 15, mint: 10, other: 5,
};

function computeRiskScore(target: string, amount: number, action: string): number {
  let score = 0;
  const addr = target.toLowerCase();
  if (RISKY_PATTERNS.some((p) => addr.includes(p))) score += 60;
  if (amount > 100) score += 35;
  else if (amount > 10) score += 20;
  else if (amount > 1) score += 10;
  else score += 5;
  score += ACTION_RISK[action] || 5;
  score += 10;
  return Math.max(0, Math.min(score, 100));
}

function getReasonsForScore(score: number, verdict: Verdict, action: string, amount: number): string[] {
  const reasons: string[] = [];
  if (amount > 100) reasons.push("High value transaction");
  else if (amount > 10) reasons.push("Moderate transaction amount");
  else reasons.push("Low value transaction");
  if (action === "contract-call") reasons.push("Contract interaction requires extra scrutiny");
  else if (action === "swap") reasons.push("Swap operation detected");
  else if (action === "mint") reasons.push("Mint operation detected");
  if (verdict === "BLOCK") reasons.push("Risk score exceeds block threshold");
  else if (verdict === "WARN") reasons.push("Score in warning zone — human review recommended");
  else reasons.push("All checks passed — safe to execute");
  return reasons;
}

const actionTypes = [
  { value: "transfer", label: "Transfer" },
  { value: "contract-call", label: "Contract Call" },
  { value: "swap", label: "Swap" },
  { value: "mint", label: "Mint" },
  { value: "other", label: "Other" },
];

const inputClass =
  "flex h-9 w-full rounded-md border px-3 py-1 font-mono text-sm shadow-sm transition-colors placeholder:text-[#444] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2563EB]/50";

export default function SimulatePage() {
  const { address } = useAccount();

  const [form, setForm] = useState({ agent: "", target: "", amount: "", action: "transfer" });
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [operatorDecision, setOperatorDecision] = useState<"approved" | "rejected" | null>(null);
  const [thresholds, setThresholds] = useState<[number, number] | null>(null);

  useEffect(() => {
    fetch("/api/thresholds")
      .then((r) => r.json())
      .then((data) => { if (data.low !== undefined) setThresholds([data.low, data.medium]); })
      .catch(() => {});
  }, []);

  const { writeContract, isPending: isWritePending, data: writeTxHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: writeTxHash });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    setOperatorDecision(null);

    try {
      const amt = parseFloat(form.amount) || 0;
      const riskScore = computeRiskScore(form.target, amt, form.action);
      const response = await fetch(`/api/verdict?score=${riskScore}`);
      const json = await response.json();
      if (json.error) throw new Error(json.error);
      const verdict = json.verdict as Verdict;
      const reasons = getReasonsForScore(riskScore, verdict, form.action, amt);
      setResult({ score: riskScore, verdict, reasons });
      if (verdict === "WARN") setShowModal(true);
    } catch (err: any) {
      setError(err.message || "Failed to query PolicyManager");
    } finally {
      setLoading(false);
    }
  }

  function handleRegister() {
    if (!result) return;
    const agentAddr = (form.agent.startsWith("0x") ? form.agent : address || form.target) as `0x${string}`;
    const reason = `${actionTypes.find((a) => a.value === form.action)?.label || form.action}: ${form.amount} HBAR to ${form.target.slice(0, 10)}...`;
    writeContract({
      address: ADDRESSES.assessmentRegistry,
      abi: assessmentRegistryAbi,
      functionName: "createAssessment",
      args: [agentAddr, form.target as `0x${string}`, BigInt(result.score), result.verdict, reason],
    });
  }

  function handleApproval(decision: "approved" | "rejected") {
    setShowModal(false);
    setOperatorDecision(decision);
  }

  const canRegister = result && ((result.verdict === "ALLOW") || (result.verdict === "WARN" && operatorDecision === "approved"));
  const showRegisterButton = canRegister && !isConfirmed && !isWritePending && !isConfirming;

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: "#141414", border: "1px solid #1a1a1a" }}>
            <Activity className="w-4 h-4" style={{ color: "#2563EB" }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#f0f0f0" }}>Simulate Assessment</h1>
            <p className="text-sm" style={{ color: "#555" }}>Run a risk assessment before executing a transaction</p>
          </div>
        </div>

        {thresholds && (
          <div className="mb-4 flex items-center justify-between rounded-lg px-4 py-2 text-xs font-mono" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a", color: "#555" }}>
            <span>Active Policy</span>
            <span>
              <span className="text-emerald-400">ALLOW &lt;{thresholds[0]}</span>{" · "}
              <span className="text-amber-400">WARN {thresholds[0]}-{thresholds[1]}</span>{" · "}
              <span className="text-red-400">BLOCK &gt;{thresholds[1]}</span>
            </span>
          </div>
        )}

        <div className="rounded-xl p-6" style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="font-mono tracking-[0.06em]" style={{ fontSize: "11px", color: "#444" }}>AGENT ADDRESS</label>
              <input placeholder={address || "0x... or connect wallet"} value={form.agent} onChange={(e) => setForm((f) => ({ ...f, agent: e.target.value }))} className={inputClass} style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a", color: "#e0e0e0" }} />
            </div>
            <div className="space-y-2">
              <label className="font-mono tracking-[0.06em]" style={{ fontSize: "11px", color: "#444" }}>TARGET ADDRESS</label>
              <input placeholder="0x..." value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} required className={inputClass} style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a", color: "#e0e0e0" }} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="font-mono tracking-[0.06em]" style={{ fontSize: "11px", color: "#444" }}>AMOUNT</label>
                <div className="relative">
                  <input type="number" placeholder="0.00" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required className={inputClass} style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a", color: "#e0e0e0", paddingRight: "52px" }} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono" style={{ fontSize: "11px", color: "#444" }}>HBAR</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="font-mono tracking-[0.06em]" style={{ fontSize: "11px", color: "#444" }}>ACTION TYPE</label>
                <select value={form.action} onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))} className={inputClass} style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a", color: "#e0e0e0" }}>
                  {actionTypes.map((a) => (<option key={a.value} value={a.value}>{a.label}</option>))}
                </select>
              </div>
            </div>
            <button type="submit" disabled={loading} className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#2563EB" }}>
              {loading ? (<><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Querying PolicyManager…</>) : (<>Run Assessment<ArrowRight className="w-4 h-4" /></>)}
            </button>
          </form>
        </div>

        {error && (<div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">{error}</div>)}

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="mt-4 rounded-xl p-6" style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm" style={{ color: "#555" }}>Result</span>
                <VerdictBadge verdict={result.verdict} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#555" }}>Risk Score</span>
                  <span className="text-2xl font-bold font-mono" style={{ color: "#f0f0f0" }}>{result.score}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#141414" }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${result.score}%` }} transition={{ duration: 0.6, ease: "easeOut" }} className={`h-full rounded-full ${result.verdict === "ALLOW" ? "bg-emerald-500" : result.verdict === "WARN" ? "bg-amber-500" : "bg-red-500"}`} />
                </div>
                <div className="pt-2 space-y-1.5">
                  {result.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 block h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: result.verdict === "ALLOW" ? "#22c55e" : result.verdict === "WARN" ? "#f59e0b" : "#ef4444" }} />
                      <span className="text-xs leading-relaxed" style={{ color: "#888" }}>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              <AnimatePresence>
                {operatorDecision && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }} className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${operatorDecision === "approved" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-red-500/30 bg-red-500/10 text-red-400"}`}>
                    {operatorDecision === "approved" ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    {operatorDecision === "approved" ? "Action approved by operator" : "Action rejected by operator"}
                  </motion.div>
                )}
              </AnimatePresence>

              {result.verdict === "BLOCK" && (
                <div className="mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium border-red-500/30 bg-red-500/10 text-red-400">
                  <ShieldOff className="w-4 h-4 shrink-0" />Transfer blocked by AegisPay policy engine
                </div>
              )}

              {showRegisterButton && (
                <div className="mt-4">
                  <button onClick={handleRegister} disabled={isWritePending || isConfirming} className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#2563EB" }}>
                    {isWritePending ? (<><Loader2 className="w-4 h-4 animate-spin" />Confirm in wallet…</>) : isConfirming ? (<><Loader2 className="w-4 h-4 animate-spin" />Confirming on Hedera…</>) : "Register Assessment on Hedera"}
                  </button>
                </div>
              )}

              {isConfirmed && writeTxHash && (
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400">
                    <Check className="w-4 h-4" />Assessment registered on Hedera
                  </div>
                  <a href={`https://hashscan.io/testnet/transaction/${writeTxHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-mono hover:underline" style={{ color: "#555" }}>
                    <ExternalLink className="w-3 h-3" />View on HashScan
                  </a>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showModal && result && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-50 flex items-center justify-center px-4">
              <div className="absolute inset-0 bg-black/60" onClick={() => handleApproval("rejected")} />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} transition={{ duration: 0.2 }} className="relative w-full max-w-md rounded-xl p-6 shadow-2xl" style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/30" style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}>
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight" style={{ color: "#f0f0f0" }}>Human Approval Required</h2>
                </div>
                <p className="text-sm mb-4" style={{ color: "#888" }}>This transaction scored in the warning zone. Review the details below and approve or reject. In production, this would be routed to a Ledger device or multisig for secure co-signing.</p>
                <div className="rounded-lg p-4 mb-6 space-y-2" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
                  {[
                    { label: "Target", value: form.target },
                    { label: "Amount", value: `${form.amount} HBAR` },
                    { label: "Action", value: actionTypes.find((a) => a.value === form.action)?.label || form.action },
                    { label: "Risk Score", value: String(result.score), amber: true },
                    { label: "Verdict", value: result.verdict, amber: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span style={{ color: "#555" }}>{row.label}</span>
                      <span className="font-mono text-xs" style={{ color: row.amber ? "#f59e0b" : "#ccc" }}>{row.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleApproval("rejected")} className="flex-1 h-9 rounded-md border border-red-500/30 bg-red-500/10 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors">Reject</button>
                  <button onClick={() => handleApproval("approved")} className="flex-1 h-9 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors">Approve</button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}

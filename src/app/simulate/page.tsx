"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VerdictBadge } from "@/components/demos/VerdictBadge";
import { ArrowRight, ShieldAlert, ShieldOff, Check, X, Loader2, CheckCircle2 } from "lucide-react";
import { useAccount, useWriteContract } from "wagmi";
import { assessmentRegistryConfig } from "@/lib/contracts";

type Verdict = "ALLOW" | "WARN" | "BLOCK";

interface SimResult {
  score: number;
  verdict: Verdict;
  reasons: string[];
}

function randomInRange(min: number, max: number): number {
  return Math.round(min + Math.random() * (max - min));
}

const allowReasons: Record<string, string[]> = {
  transfer: ["Low value transfer", "Known target address"],
  swap: ["Low value swap", "Standard liquidity pool"],
  "contract-call": ["Low value contract call", "Verified contract"],
  mint: ["Low value mint operation", "Standard token contract"],
  other: ["Low value operation", "No risk signals detected"],
};

const warnReasons: Record<string, string[]> = {
  transfer: ["Elevated amount", "Limited transaction history"],
  swap: ["Elevated amount", "Swap action requires review", "Slippage risk detected"],
  "contract-call": ["Elevated amount", "Unverified contract interaction", "Contract call requires review"],
  mint: ["Elevated amount", "Mint action requires review", "Limited contract history"],
  other: ["Elevated amount", "Unknown action type", "Requires additional review"],
};

const blockReasons: Record<string, string[]> = {
  transfer: ["High value transfer", "Unknown recipient", "Amount exceeds safe threshold"],
  swap: ["High value swap", "Unknown liquidity pool", "Swap flagged by policy engine"],
  "contract-call": ["High value contract call", "Unknown contract", "Execute action flagged"],
  mint: ["High value mint", "Unverified mint contract", "Mint operation blocked"],
  other: ["High value operation", "Unknown action type", "Flagged by risk engine"],
};

function mockAssessment(
  target: string,
  amount: string,
  action: string,
): SimResult {
  const amt = parseFloat(amount) || 0;
  const addrLower = target.toLowerCase();

  if (amt > 1000 || action === "contract-call" || addrLower.includes("dead")) {
    const reasons = [...(blockReasons[action] || blockReasons.other)];
    if (addrLower.includes("dead")) reasons[1] = "Flagged target address";
    return { score: randomInRange(70, 100), verdict: "BLOCK", reasons };
  }

  if ((amt >= 10 && amt <= 1000) || action === "swap" || action === "mint") {
    return {
      score: randomInRange(31, 69),
      verdict: "WARN",
      reasons: warnReasons[action] || warnReasons.other,
    };
  }

  return {
    score: randomInRange(0, 30),
    verdict: "ALLOW",
    reasons: allowReasons[action] || allowReasons.other,
  };
}

interface TraceStep {
  label: string;
  result: string;
  status: "ok" | "warn" | "neutral";
}

const stepNumbers = ["①", "②", "③", "④", "⑤"];

function buildTraceSteps(target: string, amount: string, action: string): TraceStep[] {
  const amt = parseFloat(amount) || 0;
  const knownAddress = target.toLowerCase().startsWith("0x") && !target.toLowerCase().includes("dead");
  const actionLabel = actionTypes.find((a) => a.value === action)?.label || action;

  return [
    {
      label: `Resolving target address...`,
      result: knownAddress ? "Known contract" : "Unknown address",
      status: knownAddress ? "ok" : "warn",
    },
    {
      label: `Evaluating amount (${amount || "0"} USDC)...`,
      result: amt > 1000 ? "High value" : amt >= 10 ? "Elevated" : "Low value",
      status: amt > 1000 ? "warn" : amt >= 10 ? "warn" : "ok",
    },
    {
      label: `Analyzing action type (${actionLabel})...`,
      result: action === "contract-call" ? "High risk" : action === "swap" || action === "mint" ? "Requires review" : "Safe action",
      status: action === "contract-call" ? "warn" : action === "swap" || action === "mint" ? "warn" : "ok",
    },
    {
      label: `Applying policy thresholds...`,
      result: "Thresholds loaded",
      status: "ok",
    },
    {
      label: `Computing verdict...`,
      result: "Assessment complete",
      status: "neutral",
    },
  ];
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
  const [form, setForm] = useState({
    agent: "",
    target: "",
    amount: "",
    action: "transfer",
  });
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [operatorDecision, setOperatorDecision] = useState<
    "approved" | "rejected" | null
  >(null);
  const { address, isConnected } = useAccount();
  const {
    data: txHash,
    writeContract,
    isPending: isRegistering,
    isSuccess: isRegistered,
    error: registerError,
    reset: resetRegister,
  } = useWriteContract();
  const [traceSteps, setTraceSteps] = useState<TraceStep[]>([]);
  const [traceProgress, setTraceProgress] = useState(-1); // -1 = idle, 0..4 = animating
  const [traceVisible, setTraceVisible] = useState(false);
  const pendingResult = useRef<SimResult | null>(null);

  useEffect(() => {
    if (traceProgress < 0 || traceProgress >= traceSteps.length) return;
    const timer = setTimeout(() => {
      const next = traceProgress + 1;
      setTraceProgress(next);
      if (next >= traceSteps.length) {
        // All steps done — show result after a brief pause
        setTimeout(() => {
          const assessment = pendingResult.current;
          if (assessment) {
            setResult(assessment);
            setLoading(false);
            if (assessment.verdict === "WARN") {
              setShowModal(true);
            }
          }
        }, 400);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [traceProgress, traceSteps.length]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setOperatorDecision(null);
    resetRegister();

    // Compute result immediately but hold it
    const assessment = mockAssessment(form.target, form.amount, form.action);
    pendingResult.current = assessment;

    // Build and start trace
    const steps = buildTraceSteps(form.target, form.amount, form.action);
    setTraceSteps(steps);
    setTraceVisible(true);
    setTraceProgress(0);
  }

  function handleApproval(decision: "approved" | "rejected") {
    setShowModal(false);
    setOperatorDecision(decision);
  }

  function handleRegister() {
    if (!isConnected || !address || !result) return;

    const normalizedTarget = form.target.toLowerCase() as `0x${string}`;

    writeContract({
      ...assessmentRegistryConfig,
      functionName: "createAssessment",
      args: [
        address,
        normalizedTarget,
        BigInt(result.score),
        result.verdict,
        result.reasons[0],
      ],
    });
  }

  const showRegisterButton =
    result &&
    ((result.verdict === "ALLOW") ||
      (result.verdict === "WARN" && operatorDecision === "approved"));

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
          SIMULATE &middot; RISK ASSESSMENT
        </span>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "#f0f0f0" }}
        >
          Simulate Assessment
        </h1>
      </div>

        {/* Form */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Agent Address */}
            <div className="space-y-2">
              <label
                className="font-mono tracking-[0.06em]"
                style={{ fontSize: "11px", color: "#444" }}
              >
                AGENT ADDRESS
              </label>
              <input
                placeholder="0x... or agent name"
                value={form.agent}
                onChange={(e) => setForm((f) => ({ ...f, agent: e.target.value }))}
                className={inputClass}
                style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a", color: "#e0e0e0" }}
              />
            </div>

            {/* Target Address */}
            <div className="space-y-2">
              <label
                className="font-mono tracking-[0.06em]"
                style={{ fontSize: "11px", color: "#444" }}
              >
                TARGET ADDRESS
              </label>
              <input
                placeholder="0x..."
                value={form.target}
                onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}
                required
                className={inputClass}
                style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a", color: "#e0e0e0" }}
              />
            </div>

            {/* Amount + Action Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  className="font-mono tracking-[0.06em]"
                  style={{ fontSize: "11px", color: "#444" }}
                >
                  AMOUNT
                </label>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    required
                    className={inputClass}
                    style={{
                      backgroundColor: "#0a0a0a",
                      borderColor: "#1a1a1a",
                      color: "#e0e0e0",
                      paddingRight: "52px",
                    }}
                  />
                  <span
                    className="absolute right-3 top-1/2 -translate-y-1/2 font-mono"
                    style={{ fontSize: "11px", color: "#444" }}
                  >
                    USDC
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label
                  className="font-mono tracking-[0.06em]"
                  style={{ fontSize: "11px", color: "#444" }}
                >
                  ACTION TYPE
                </label>
                <select
                  value={form.action}
                  onChange={(e) => setForm((f) => ({ ...f, action: e.target.value }))}
                  className={inputClass}
                  style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a", color: "#e0e0e0" }}
                >
                  {actionTypes.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#2563EB" }}
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Assessing…
                </>
              ) : (
                <>
                  Run Assessment
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Assessment Trace */}
        <AnimatePresence>
          {traceVisible && traceSteps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mt-4 rounded-lg"
              style={{ backgroundColor: "#050505", border: "1px solid #1a1a1a", padding: 16 }}
            >
              <span
                className="block font-mono uppercase tracking-[0.14em] mb-4"
                style={{ fontSize: "10px", color: "#444" }}
              >
                Assessment Trace
              </span>

              {/* Steps with vertical line */}
              <div className="relative" style={{ paddingLeft: 20 }}>
                {/* Vertical connector line */}
                <div
                  className="absolute top-0 bottom-0"
                  style={{ left: 5, width: 1, backgroundColor: "#2563EB", opacity: 0.3 }}
                />

                <div className="space-y-3">
                  {traceSteps.map((step, i) => {
                    const isCompleted = i < traceProgress;
                    const isCurrent = i === traceProgress && traceProgress < traceSteps.length;
                    const isVisible = i <= traceProgress;

                    if (!isVisible) return null;

                    const resultColor =
                      step.status === "ok" ? "#16a34a" : step.status === "warn" ? "#d97706" : "#2563EB";

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        className="relative flex items-center justify-between gap-3"
                      >
                        {/* Dot on the vertical line */}
                        <div
                          className="absolute"
                          style={{ left: -19, top: "50%", transform: "translateY(-50%)" }}
                        >
                          {isCurrent ? (
                            <Loader2
                              className="animate-spin"
                              style={{ width: 10, height: 10, color: "#2563EB" }}
                            />
                          ) : (
                            <div
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: "50%",
                                backgroundColor: resultColor,
                                marginLeft: 1.5,
                              }}
                            />
                          )}
                        </div>

                        {/* Left: number + label */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="font-mono shrink-0"
                            style={{ fontSize: "12px", color: "#444" }}
                          >
                            {stepNumbers[i]}
                          </span>
                          <span
                            className="font-mono truncate"
                            style={{
                              fontSize: "12px",
                              color: isCompleted ? "#ccc" : "#888",
                            }}
                          >
                            {step.label}
                          </span>
                        </div>

                        {/* Right: result */}
                        {isCompleted && (
                          <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="font-mono shrink-0"
                            style={{ fontSize: "11px", color: resultColor }}
                          >
                            {step.result}
                          </motion.span>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result card */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mt-4 rounded-xl p-6"
              style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}
            >
              {/* Score + Verdict */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm" style={{ color: "#555" }}>Result</span>
                <VerdictBadge verdict={result.verdict} />
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: "#555" }}>Risk Score</span>
                  <span className="text-2xl font-bold font-mono" style={{ color: "#f0f0f0" }}>
                    {result.score}
                  </span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#141414" }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${result.score}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      result.verdict === "ALLOW"
                        ? "bg-emerald-500"
                        : result.verdict === "WARN"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>

                {/* Reasons list */}
                <div className="pt-2 space-y-1.5">
                  {result.reasons.map((r, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span
                        className="mt-1.5 block h-1.5 w-1.5 rounded-full shrink-0"
                        style={{
                          backgroundColor:
                            result.verdict === "ALLOW"
                              ? "#22c55e"
                              : result.verdict === "WARN"
                                ? "#f59e0b"
                                : "#ef4444",
                        }}
                      />
                      <span className="text-xs leading-relaxed" style={{ color: "#888" }}>
                        {r}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operator decision banner */}
              <AnimatePresence>
                {operatorDecision && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className={`mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium ${
                      operatorDecision === "approved"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : "border-red-500/30 bg-red-500/10 text-red-400"
                    }`}
                  >
                    {operatorDecision === "approved" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                    {operatorDecision === "approved"
                      ? "Action approved by operator"
                      : "Action rejected by operator"}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BLOCK message */}
              {result.verdict === "BLOCK" && (
                <div
                  className="mt-4 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium border-red-500/30 bg-red-500/10 text-red-400"
                >
                  <ShieldOff className="w-4 h-4 shrink-0" />
                  Transfer blocked by AegisPay
                </div>
              )}

              {/* Register button */}
              <AnimatePresence>
                {showRegisterButton && !isRegistered && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    transition={{ duration: 0.25 }}
                    className="mt-4"
                  >
                    <button
                      onClick={handleRegister}
                      disabled={isRegistering}
                      className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: "#2563EB" }}
                    >
                      {isRegistering ? "Registering on Hedera..." : "Register Assessment on Hedera"}
                    </button>
                  </motion.div>
                )}
                {isRegistered && txHash && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-400"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    Assessment registered on Hedera ✓ tx: {txHash.slice(0, 6)}...{txHash.slice(-4)}
                  </motion.div>
                )}
                {registerError && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.25 }}
                    className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-400"
                  >
                    {registerError.message.length > 120
                      ? registerError.message.slice(0, 120) + "..."
                      : registerError.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Human Approval Modal */}
        <AnimatePresence>
          {showModal && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
            >
              <div
                className="absolute inset-0 bg-black/60"
                onClick={() => handleApproval("rejected")}
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="relative w-full max-w-md rounded-xl p-6 shadow-2xl"
                style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-amber-500/30"
                    style={{ backgroundColor: "rgba(245, 158, 11, 0.1)" }}
                  >
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-semibold tracking-tight" style={{ color: "#f0f0f0" }}>
                    Human Approval Required
                  </h2>
                </div>

                <div
                  className="rounded-lg p-4 mb-6 space-y-2"
                  style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}
                >
                  {[
                    { label: "Target", value: form.target, mono: true },
                    { label: "Amount", value: `${form.amount} USDC`, mono: true },
                    { label: "Action", value: actionTypes.find((a) => a.value === form.action)?.label || form.action, mono: true },
                    { label: "Risk Score", value: String(result.score), mono: true, amber: true },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between text-sm">
                      <span style={{ color: "#555" }}>{row.label}</span>
                      <span
                        className={row.mono ? "font-mono text-xs" : "text-xs"}
                        style={{ color: row.amber ? "#f59e0b" : "#ccc" }}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleApproval("rejected")}
                    className="flex-1 h-9 rounded-md border border-red-500/30 bg-red-500/10 text-sm font-medium text-red-400 hover:bg-red-500/20 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproval("approved")}
                    className="flex-1 h-9 rounded-md border border-emerald-500/30 bg-emerald-500/10 text-sm font-medium text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
    </motion.div>
  );
}

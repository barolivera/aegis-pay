"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VerdictBadge } from "@/components/demos/VerdictBadge";
import { Save, CheckCircle2 } from "lucide-react";
import { useWriteContract } from "wagmi";
import { policyManagerConfig } from "@/lib/contracts";

export default function PolicyPage() {
  const [thresholds, setThresholds] = useState({ allow: 80, warn: 50 });

  useEffect(() => {
    fetch("/api/thresholds")
      .then((r) => r.json())
      .then((data) => {
        if (data.low !== undefined && data.medium !== undefined) {
          setThresholds({ warn: data.low, allow: data.medium });
        }
      })
      .catch(() => {});
  }, []);

  const {
    data: txHash,
    writeContract,
    isPending,
    isSuccess,
    error: writeError,
    reset,
  } = useWriteContract();

  function handleSave() {
    reset();
    writeContract({
      ...policyManagerConfig,
      functionName: "setPolicy",
      args: [BigInt(thresholds.warn), BigInt(thresholds.allow)],
    });
  }

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
          POLICY &middot; RISK THRESHOLDS
        </span>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "#f0f0f0" }}
        >
          Configure Policy
        </h1>
      </div>

      {/* Policy card */}
      <div
        className="rounded-xl p-6 space-y-8"
        style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}
      >
        {/* Bar visualization */}
        <div className="space-y-3">
          <div className="flex items-center justify-between font-mono" style={{ fontSize: "11px", color: "#444" }}>
            <span>0</span>
            <span className="tracking-[0.08em]">SCORE RANGE</span>
            <span>100</span>
          </div>
          <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: "#141414" }}>
            <div
              className="bg-red-500/50 transition-all duration-300"
              style={{ width: `${thresholds.warn}%` }}
            />
            <div
              className="bg-amber-500/50 transition-all duration-300"
              style={{ width: `${thresholds.allow - thresholds.warn}%` }}
            />
            <div
              className="bg-emerald-500/50 transition-all duration-300"
              style={{ width: `${100 - thresholds.allow}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <VerdictBadge verdict="BLOCK" />
            <VerdictBadge verdict="WARN" />
            <VerdictBadge verdict="ALLOW" />
          </div>
        </div>

        {/* Sliders */}
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                className="font-mono tracking-[0.06em]"
                style={{ fontSize: "11px", color: "#444" }}
              >
                ALLOW THRESHOLD
              </label>
              <span className="text-sm font-mono text-emerald-400">
                &ge; {thresholds.allow}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={thresholds.allow}
              onChange={(e) => {
                const v = Number(e.target.value);
                setThresholds((t) => ({
                  ...t,
                  allow: Math.max(v, t.warn + 1),
                }));
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400"
              style={{ backgroundColor: "#1a1a1a" }}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label
                className="font-mono tracking-[0.06em]"
                style={{ fontSize: "11px", color: "#444" }}
              >
                WARN THRESHOLD
              </label>
              <span className="text-sm font-mono text-amber-400">
                &ge; {thresholds.warn}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={thresholds.warn}
              onChange={(e) => {
                const v = Number(e.target.value);
                setThresholds((t) => ({
                  ...t,
                  warn: Math.min(v, t.allow - 1),
                }));
              }}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
              style={{ backgroundColor: "#1a1a1a" }}
            />
          </div>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "#2563EB" }}
        >
          {isPending ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Policy
            </>
          )}
        </button>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {isSuccess && txHash && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Policy saved on Hedera ✓ tx: {txHash.slice(0, 6)}...{txHash.slice(-4)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error banner */}
      <AnimatePresence>
        {writeError && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400"
          >
            {writeError.message.length > 120
              ? writeError.message.slice(0, 120) + "..."
              : writeError.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current policy summary */}
      <div
        className="mt-4 rounded-xl p-5"
        style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}
      >
        <span
          className="block font-mono tracking-[0.08em] mb-3"
          style={{ fontSize: "11px", color: "#444" }}
        >
          ACTIVE POLICY
        </span>
        <div className="space-y-1.5 font-mono text-xs leading-relaxed" style={{ color: "#888" }}>
          <div className="flex items-center gap-2">
            <span className="block h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
            Score &lt; {thresholds.warn} → BLOCK
          </div>
          <div className="flex items-center gap-2">
            <span className="block h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            Score {thresholds.warn}–{thresholds.allow - 1} → WARN
          </div>
          <div className="flex items-center gap-2">
            <span className="block h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
            Score &ge; {thresholds.allow} → ALLOW
          </div>
        </div>
      </div>
    </motion.div>
  );
}

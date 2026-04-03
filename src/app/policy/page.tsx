"use client";

import { useState, useEffect } from "react";
import { PageWrapper } from "@/components/demos/PageWrapper";
import { VerdictBadge } from "@/components/demos/VerdictBadge";
import { Sliders, Save, Loader2, ExternalLink } from "lucide-react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ADDRESSES, policyManagerAbi } from "@/lib/contracts";

export default function PolicyPage() {
  const [low, setLow] = useState(30);
  const [medium, setMedium] = useState(70);

  useEffect(() => {
    fetch("/api/thresholds")
      .then((r) => r.json())
      .then((data) => {
        if (data.low !== undefined) setLow(data.low);
        if (data.medium !== undefined) setMedium(data.medium);
      })
      .catch(() => {});
  }, []);

  const { writeContract, isPending, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  function handleSave() {
    writeContract({
      address: ADDRESSES.policyManager,
      abi: policyManagerAbi,
      functionName: "setPolicy",
      args: [BigInt(low), BigInt(medium)],
    });
  }

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: "#141414", border: "1px solid #1a1a1a" }}>
            <Sliders className="w-4 h-4" style={{ color: "#2563EB" }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#f0f0f0" }}>Configure Policy</h1>
            <p className="text-sm" style={{ color: "#555" }}>Set risk score thresholds for transaction verdicts</p>
          </div>
        </div>

        <div className="rounded-xl p-6 space-y-8" style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono" style={{ color: "#444" }}>
              <span>0</span><span>Score range</span><span>100</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500/50 transition-all duration-300" style={{ width: `${low}%` }} />
              <div className="bg-amber-500/50 transition-all duration-300" style={{ width: `${medium - low}%` }} />
              <div className="bg-red-500/50 transition-all duration-300" style={{ width: `${100 - medium}%` }} />
            </div>
            <div className="flex justify-between text-xs">
              <VerdictBadge verdict="ALLOW" /><VerdictBadge verdict="WARN" /><VerdictBadge verdict="BLOCK" />
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: "#888" }}>ALLOW / WARN boundary</label>
                <span className="text-sm font-mono text-emerald-400">&lt; {low} = ALLOW</span>
              </div>
              <input type="range" min={1} max={99} value={low} onChange={(e) => setLow(Math.min(Number(e.target.value), medium - 1))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#1a1a1a] accent-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium" style={{ color: "#888" }}>WARN / BLOCK boundary</label>
                <span className="text-sm font-mono text-red-400">&ge; {medium} = BLOCK</span>
              </div>
              <input type="range" min={1} max={99} value={medium} onChange={(e) => setMedium(Math.max(Number(e.target.value), low + 1))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[#1a1a1a] accent-red-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-400" />
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1a1a1a" }}>
              <p className="text-xs font-mono leading-relaxed" style={{ color: "#555" }}>
                Score &lt; {low} → <span className="text-emerald-400">ALLOW</span><br />
                Score {low}–{medium - 1} → <span className="text-amber-400">WARN</span><br />
                Score &ge; {medium} → <span className="text-red-400">BLOCK</span>
              </p>
            </div>
          </div>

          <button onClick={handleSave} disabled={isPending || isConfirming} className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#2563EB" }}>
            {isPending ? (<><Loader2 className="w-4 h-4 animate-spin" />Confirm in wallet…</>) : isConfirming ? (<><Loader2 className="w-4 h-4 animate-spin" />Saving on Hedera…</>) : isConfirmed ? "Policy Saved on Hedera" : (<><Save className="w-4 h-4" />Save Policy on Hedera</>)}
          </button>

          {isConfirmed && txHash && (
            <a href={`https://hashscan.io/testnet/transaction/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-mono hover:underline" style={{ color: "#555" }}>
              <ExternalLink className="w-3 h-3" />View on HashScan
            </a>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}

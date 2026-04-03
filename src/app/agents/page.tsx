"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageWrapper } from "@/components/demos/PageWrapper";
import { Bot, CheckCircle2, Loader2, ExternalLink } from "lucide-react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { ADDRESSES, agentRegistryAbi } from "@/lib/contracts";

export default function AgentsPage() {
  const { address } = useAccount();
  const [form, setForm] = useState({ name: "", description: "", metadataURI: "" });

  const { writeContract, isPending, data: txHash } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) return;
    const metadataURI = form.metadataURI || `ipfs://${form.name.toLowerCase().replace(/\s+/g, "-")}`;
    writeContract({
      address: ADDRESSES.agentRegistry,
      abi: agentRegistryAbi,
      functionName: "registerAgent",
      args: [address, metadataURI],
    });
  }

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: "#141414", border: "1px solid #1a1a1a" }}>
            <Bot className="w-4 h-4" style={{ color: "#2563EB" }} />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight" style={{ color: "#f0f0f0" }}>Register Agent</h1>
            <p className="text-sm" style={{ color: "#555" }}>Register a new autonomous agent on-chain</p>
          </div>
        </div>

        <div className="rounded-xl p-6" style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="font-mono tracking-[0.06em]" style={{ fontSize: "11px", color: "#444" }}>AGENT ADDRESS</label>
              <input value={address || ""} disabled className="flex h-9 w-full rounded-md border px-3 py-1 font-mono text-sm" style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a", color: "#555" }} />
              <p className="text-xs" style={{ color: "#333" }}>Uses your connected wallet address</p>
            </div>
            <div className="space-y-2">
              <label className="font-mono tracking-[0.06em]" style={{ fontSize: "11px", color: "#444" }}>AGENT NAME</label>
              <input placeholder="e.g. PaymentBot-v2" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required className="flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-[#444] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2563EB]/50" style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a", color: "#e0e0e0" }} />
            </div>
            <div className="space-y-2">
              <label className="font-mono tracking-[0.06em]" style={{ fontSize: "11px", color: "#444" }}>DESCRIPTION</label>
              <textarea placeholder="What does this agent do?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-[#444] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2563EB]/50 resize-none" style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a", color: "#e0e0e0" }} />
            </div>
            <div className="space-y-2">
              <label className="font-mono tracking-[0.06em]" style={{ fontSize: "11px", color: "#444" }}>METADATA URI</label>
              <input placeholder="ipfs://Qm... or https://..." value={form.metadataURI} onChange={(e) => setForm((f) => ({ ...f, metadataURI: e.target.value }))} className="flex h-9 w-full rounded-md border px-3 py-1 font-mono text-sm shadow-sm transition-colors placeholder:text-[#444] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2563EB]/50" style={{ backgroundColor: "#0a0a0a", borderColor: "#1a1a1a", color: "#e0e0e0" }} />
            </div>
            <button type="submit" disabled={isPending || isConfirming || !address} className="flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50" style={{ backgroundColor: "#2563EB" }}>
              {isPending ? (<><Loader2 className="w-4 h-4 animate-spin" />Confirm in wallet…</>) : isConfirming ? (<><Loader2 className="w-4 h-4 animate-spin" />Registering on Hedera…</>) : "Register Agent"}
            </button>
          </form>
        </div>

        <AnimatePresence>
          {isConfirmed && txHash && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-4 space-y-2">
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />Agent registered on Hedera
              </div>
              <a href={`https://hashscan.io/testnet/transaction/${txHash}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-mono hover:underline" style={{ color: "#555" }}>
                <ExternalLink className="w-3 h-3" />View on HashScan
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, CheckCircle2 } from "lucide-react";

const inputClass =
  "flex h-9 w-full rounded-md border px-3 py-1 font-mono text-sm shadow-sm transition-colors placeholder:text-[#444] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2563EB]/50";

const inputStyle = {
  backgroundColor: "#0a0a0a",
  borderColor: "#1a1a1a",
  color: "#e0e0e0",
};

export default function AgentsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    metadataURI: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", description: "", metadataURI: "" });
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
          AGENTS &middot; HEDERA
        </span>
        <h1
          className="text-2xl font-semibold tracking-tight"
          style={{ color: "#f0f0f0" }}
        >
          Register Agent
        </h1>
      </div>

      {/* Form card */}
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a" }}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              className="font-mono tracking-[0.06em]"
              style={{ fontSize: "11px", color: "#444" }}
            >
              AGENT NAME
            </label>
            <input
              placeholder="e.g. PaymentBot-v2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <label
              className="font-mono tracking-[0.06em]"
              style={{ fontSize: "11px", color: "#444" }}
            >
              DESCRIPTION
            </label>
            <textarea
              placeholder="What does this agent do?"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              required
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border px-3 py-2 font-mono text-sm shadow-sm transition-colors placeholder:text-[#444] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#2563EB]/50 resize-none"
              style={inputStyle}
            />
          </div>

          <div className="space-y-2">
            <label
              className="font-mono tracking-[0.06em]"
              style={{ fontSize: "11px", color: "#444" }}
            >
              METADATA URI
            </label>
            <input
              placeholder="ipfs://Qm... or https://..."
              value={form.metadataURI}
              onChange={(e) =>
                setForm((f) => ({ ...f, metadataURI: e.target.value }))
              }
              required
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            className="flex h-10 w-full items-center justify-center rounded-md text-sm font-medium text-white transition-colors hover:opacity-90"
            style={{ backgroundColor: "#2563EB" }}
          >
            Register Agent
          </button>
        </form>
      </div>

      {/* Success banner */}
      <AnimatePresence>
        {submitted && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-400"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            Agent registered successfully
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

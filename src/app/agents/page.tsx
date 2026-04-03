"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageWrapper } from "@/components/demos/PageWrapper";
import { Button } from "@/components/ui/button";
import { Bot, CheckCircle2 } from "lucide-react";

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
    <PageWrapper>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/50">
            <Bot className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Register Agent
            </h1>
            <p className="text-sm text-muted-foreground">
              Register a new autonomous agent on-chain
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Agent Name
              </label>
              <input
                placeholder="e.g. PaymentBot-v2"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Description
              </label>
              <textarea
                placeholder="What does this agent do?"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
                required
                rows={3}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Metadata URI
              </label>
              <input
                placeholder="ipfs://Qm... or https://..."
                value={form.metadataURI}
                onChange={(e) =>
                  setForm((f) => ({ ...f, metadataURI: e.target.value }))
                }
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 font-mono text-sm shadow-sm transition-colors placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <Button type="submit" className="w-full">
              Register Agent
            </Button>
          </form>
        </div>

        <AnimatePresence>
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-600 px-4 py-3 text-sm font-medium text-white"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Agent registered successfully
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageWrapper>
  );
}

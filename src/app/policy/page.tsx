"use client";

import { useState } from "react";
import { PageWrapper } from "@/components/demos/PageWrapper";
import { Button } from "@/components/ui/button";
import { VerdictBadge } from "@/components/demos/VerdictBadge";
import { Sliders, Save } from "lucide-react";

export default function PolicyPage() {
  const [thresholds, setThresholds] = useState({ allow: 80, warn: 50 });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <PageWrapper>
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-secondary/50">
            <Sliders className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Configure Policy
            </h1>
            <p className="text-sm text-muted-foreground">
              Set risk score thresholds for transaction verdicts
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/50 p-6 space-y-8">
          {/* Bar visualization */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
              <span>0</span>
              <span>Score range</span>
              <span>100</span>
            </div>
            <div className="h-3 rounded-full overflow-hidden flex">
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
                <label className="text-sm font-medium text-muted-foreground">
                  ALLOW threshold
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
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-secondary accent-emerald-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-muted-foreground">
                  WARN threshold
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
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-secondary accent-amber-500 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-400"
              />
            </div>

            <div className="rounded-lg bg-secondary/50 border border-border p-3">
              <p className="text-xs text-muted-foreground font-mono leading-relaxed">
                Score &lt; {thresholds.warn} → BLOCK
                <br />
                Score {thresholds.warn}–{thresholds.allow - 1} → WARN
                <br />
                Score &ge; {thresholds.allow} → ALLOW
              </p>
            </div>
          </div>

          <Button onClick={handleSave} className="w-full">
            {saved ? (
              "Policy Saved"
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Policy
              </span>
            )}
          </Button>
        </div>
      </div>
    </PageWrapper>
  );
}

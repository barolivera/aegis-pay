"use client";

let cleanup: (() => void) | null = null;

export async function initLedger() {
  if (cleanup) return;
  if (typeof window === "undefined") return;
  const specifier = "@ledgerhq/ledger-wallet-provider";
  const mod = await import(/* webpackIgnore: true */ specifier);
  const { initializeLedgerProvider } = mod;
  cleanup = initializeLedgerProvider({ dAppIdentifier: "aegispay" });
}

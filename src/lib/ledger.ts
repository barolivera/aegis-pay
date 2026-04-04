"use client";

let cleanup: (() => void) | null = null;

export async function initLedger() {
  if (cleanup) return;
  if (typeof window === "undefined") return;

  try {
    const specifier = "@ledgerhq/ledger-wallet-provider";
    const mod = await import(/* webpackIgnore: true */ specifier);
    const { initializeLedgerProvider } = mod;

    cleanup = initializeLedgerProvider({
      dAppIdentifier: "aegispay",
    });
  } catch {
    // Ledger provider not available — wallet connect still works via MetaMask
  }
}

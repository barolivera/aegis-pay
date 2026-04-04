"use client";

let cleanup: (() => void) | null = null;

/**
 * Initialise the Ledger Wallet Provider (EIP-6963).
 * wagmi v2 auto-discovers it via the injected() connector.
 * Call once on app mount.
 */
export async function initLedger() {
  if (cleanup) return;
  if (typeof window === "undefined") return;

  // Use a type-erased dynamic import so webpack doesn't statically
  // analyse the package's exports map (which has a condition-order
  // issue that trips up webpack).
  const specifier = "@ledgerhq/ledger-wallet-provider";
  const mod = await import(/* webpackIgnore: true */ specifier);
  const { initializeLedgerProvider } = mod;

  cleanup = initializeLedgerProvider({
    dAppIdentifier: "aegispay",
  });
}

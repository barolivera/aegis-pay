import { createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { type Chain, defineChain } from "viem";

/* ── Hedera Testnet (chain 296) ────────────────────────────── */
export const hederaTestnet: Chain = defineChain({
  id: 296,
  name: "Hedera Testnet",
  nativeCurrency: { name: "HBAR", symbol: "HBAR", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://testnet.hashio.io/api"] },
  },
  blockExplorers: {
    default: { name: "HashScan", url: "https://hashscan.io/testnet" },
  },
  testnet: true,
});

/* ── Wagmi config ──────────────────────────────────────────── */
export const wagmiConfig = createConfig({
  chains: [hederaTestnet, mainnet],
  transports: {
    [hederaTestnet.id]: http("https://testnet.hashio.io/api"),
    [mainnet.id]: http(), // for ENS resolution
  },
  ssr: true,
});
